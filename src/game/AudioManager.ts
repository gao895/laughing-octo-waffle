import type { SettingsData } from "../types/gameTypes";

/**
 * Web Audio APIを用いた完全プロシージャル生成のサウンドマネージャー。
 * 外部音声ファイルを使わず、ノイズ・オシレーターから全効果音を合成する。
 * カテゴリ別ゲイン: BGM / AMBIENCE / SE(足音・ホラー) / VOICE / JUMPSCARE
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private bgmGain!: GainNode;
  private ambienceGain!: GainNode;
  private seGain!: GainNode;
  private voiceGain!: GainNode;
  private jumpscareGain!: GainNode;
  private noiseBuffer: AudioBuffer | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private footstepToggle = false;

  /** ユーザー操作（クリック等）のタイミングで呼び、AudioContextを開始する */
  init(settings: SettingsData) {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    // iOS Safari ではユーザー操作起点でもsuspended状態で生成されることがあるため明示的に再開する
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.ambienceGain = this.ctx.createGain();
    this.seGain = this.ctx.createGain();
    this.voiceGain = this.ctx.createGain();
    this.jumpscareGain = this.ctx.createGain();
    for (const g of [this.bgmGain, this.ambienceGain, this.seGain, this.voiceGain, this.jumpscareGain]) {
      g.connect(this.masterGain);
    }
    this.applySettings(settings);
    this.noiseBuffer = this.buildNoiseBuffer(2);
  }

  get ready() {
    return !!this.ctx;
  }

  applySettings(settings: SettingsData) {
    if (!this.ctx) return;
    this.bgmGain.gain.value = settings.bgmVolume * 0.5;
    this.ambienceGain.gain.value = settings.bgmVolume * 0.6;
    this.seGain.gain.value = settings.seVolume;
    this.voiceGain.gain.value = settings.voiceVolume;
    this.jumpscareGain.gain.value = settings.seVolume;
  }

  private buildNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** 環境音（低いドローン+フィルターされたノイズ）をループ再生開始 */
  startAmbience() {
    if (!this.ctx || !this.noiseBuffer || this.ambienceSource) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    src.connect(filter).connect(this.ambienceGain);
    src.start();
    this.ambienceSource = src;
    this.ambienceFilter = filter;
  }

  /** 環境音を一瞬で無音にする（恐怖演出用） */
  cutAmbience(durationSec = 0.05) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.ambienceGain.gain.cancelScheduledValues(now);
    this.ambienceGain.gain.setValueAtTime(this.ambienceGain.gain.value, now);
    this.ambienceGain.gain.linearRampToValueAtTime(0, now + durationSec);
  }

  restoreAmbience(settings: SettingsData, durationSec = 1.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.ambienceGain.gain.cancelScheduledValues(now);
    this.ambienceGain.gain.setValueAtTime(this.ambienceGain.gain.value, now);
    this.ambienceGain.gain.linearRampToValueAtTime(settings.bgmVolume * 0.6, now + durationSec);
  }

  stopAmbience() {
    this.ambienceSource?.stop();
    this.ambienceSource = null;
    this.ambienceFilter = null;
  }

  playFootstep() {
    if (!this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = this.footstepToggle ? 220 : 260;
    filter.Q.value = 1.2;
    this.footstepToggle = !this.footstepToggle;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    src.connect(filter).connect(gain).connect(this.seGain);
    src.start(now);
    src.stop(now + 0.15);
  }

  /** 異変：足音が一歩多い演出。少し遅れて追加の足音を鳴らす */
  playExtraFootstepGhost() {
    if (!this.ctx) return;
    setTimeout(() => this.playFootstep(), 260);
  }

  /** 空室から響くナースコールの電子音 */
  playNurseCall() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.4;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 1046;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain).connect(this.seGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  playKnock(pan = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = pan;
    osc.connect(gain).connect(panner).connect(this.seGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playElectricHum() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 120;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    osc.connect(gain).connect(this.seGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playWhisper() {
    if (!this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.6;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 4;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.001, now + 1.6);
    src.connect(filter).connect(gain).connect(this.voiceGain);
    src.start(now);
    src.stop(now + 1.7);
  }

  playHeartbeat(bpm = 70) {
    if (!this.ctx) return;
    const interval = 60 / bpm;
    const beat = () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 55;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain).connect(this.seGain);
      osc.start(now);
      osc.stop(now + 0.25);
    };
    beat();
    return interval;
  }

  /** ジャンプスケア用の強い衝撃音 */
  playStinger() {
    if (!this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4000, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.6);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    src.connect(filter).connect(gain).connect(this.jumpscareGain);
    src.start(now);
    src.stop(now + 0.7);

    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(oscGain).connect(this.jumpscareGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  /** 異変が発生しているループの開始時に鳴らす、不協和な音程を重ねた不気味なチャイム */
  playAnomalyChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // 短2度(C6/C#6)の不協和音＋トライトーン(F#6)をずらして重ね、オルゴールが
    // 狂ったような違和感を出す。足音等のSEと混ざらないよう長めにゆっくり減衰させる。
    const notes: { freq: number; delay: number; peak: number; decay: number }[] = [
      { freq: 1046.5, delay: 0, peak: 0.16, decay: 2.4 },
      { freq: 1108.73, delay: 0.08, peak: 0.12, decay: 2.2 },
      { freq: 1479.98, delay: 0.3, peak: 0.1, decay: 1.8 },
    ];
    for (const note of notes) {
      const t = now + note.delay;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = note.freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(note.peak, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.decay);
      osc.connect(gain).connect(this.seGain);
      osc.start(t);
      osc.stop(t + note.decay + 0.1);
    }
  }

  playCorrectChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(660, now + 0.12);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain).connect(this.seGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playWrongBuzz() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(110, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain).connect(this.seGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  dispose() {
    this.stopAmbience();
    this.ctx?.close();
    this.ctx = null;
  }
}

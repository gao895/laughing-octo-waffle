import * as THREE from "three";

/**
 * モデル/テクスチャアセットを用意せず、Canvas上で手続き的にテクスチャを生成する。
 * Low Poly + Texture Atlas的なアプローチで軽量化しつつ、
 * オリジナルの見た目を確保する。
 */

function createCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function noiseFill(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, amount: number) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);
}

export function makeConcreteTexture(hueBase = "#2b2d33"): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, hueBase, 22);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, 0);
    ctx.lineTo(Math.random() * 256, 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeTileFloorTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#15161a", 10);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  const tile = 64;
  for (let x = 0; x <= 256; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 12);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeCeilingTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#1c1d20", 12);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 「EXIT」/「ENTER」看板テクスチャ */
export function makeSignTexture(text: string, color = "#ff2a2a"): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 128);
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 122);
  ctx.fillStyle = color;
  ctx.font = "bold 56px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillText(text, 128, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 廊下に繰り返し貼る注意書き風の掲示物。variantで数パターン用意し、
 * 「毎回同じはずのもの」が並ぶことで、異変（違い）に気づきやすい密度を作る。
 */
export function makeNoticePosterTexture(variant: number): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 176);
  ctx.fillStyle = "#e8e4d4";
  ctx.fillRect(0, 0, 128, 176);
  ctx.strokeStyle = "#8a8672";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 124, 172);

  const texts: [string, string][] = [
    ["注意", "足元にご注意ください"],
    ["火気厳禁", "この先火気の使用を禁じます"],
    ["非常灯", "停電時は非常灯が点灯します"],
    ["案内", "係員にお尋ねください"],
  ];
  const [title, body] = texts[variant % texts.length];

  ctx.fillStyle = "#1c1a14";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 64, 34);

  ctx.strokeStyle = "#a01010";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(64, 46);
  ctx.lineTo(44, 84);
  ctx.lineTo(84, 84);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#a01010";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("!", 64, 76);

  ctx.fillStyle = "#3a382e";
  ctx.font = "11px sans-serif";
  const words = body.split("");
  let line = "";
  let y = 112;
  for (const ch of words) {
    line += ch;
    if (line.length >= 8) {
      ctx.fillText(line, 64, y);
      line = "";
      y += 16;
    }
  }
  if (line) ctx.fillText(line, 64, y);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 廊下の方向案内サイン（矢印）。純粋な背景装飾として繰り返し配置する */
export function makeArrowSignTexture(direction: "left" | "right" = "right"): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(160, 80);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, 160, 80);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 156, 76);
  ctx.fillStyle = "#39d97a";
  ctx.save();
  ctx.translate(80, 40);
  if (direction === "left") ctx.scale(-1, 1);
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(10, -22);
  ctx.lineTo(10, -8);
  ctx.lineTo(40, -8);
  ctx.lineTo(40, 8);
  ctx.lineTo(10, 8);
  ctx.lineTo(10, 22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** ポスター：シンプルな人物シルエット風の絵。hueShiftで異変時に色を変える */
export function makePosterTexture(hueShift = 0): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 192);
  ctx.fillStyle = hueShift ? "#3a0a0a" : "#c9c2ad";
  ctx.fillRect(0, 0, 128, 192);
  ctx.fillStyle = hueShift ? "#150303" : "#33302a";
  ctx.beginPath();
  ctx.ellipse(64, 60, 26, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(30, 190);
  ctx.lineTo(40, 100);
  ctx.lineTo(88, 100);
  ctx.lineTo(98, 190);
  ctx.closePath();
  ctx.fill();
  if (hueShift) {
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 55);
    ctx.lineTo(78, 68);
    ctx.moveTo(78, 55);
    ctx.lineTo(50, 68);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 188);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** アナログ時計の文字盤テクスチャ */
export function makeClockFaceTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 128);
  ctx.fillStyle = "#e8e4d8";
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#111";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = 64 + Math.sin(a) * 50;
    const y = 64 - Math.cos(a) * 50;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 人型シルエット（遠景の人影・鏡の中の人影用） */
export function buildHumanSilhouette(color = 0x050505, opacity = 1): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.9, 4, 8), mat);
  body.position.y = 1.05;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), mat);
  head.position.y = 1.75;
  group.add(body, head);
  return group;
}

/** 顔テクスチャ付きの人型シルエット（患者用）。faceMeshを返し後から差し替え可能にする */
export function buildFacedSilhouette(faceTex: THREE.Texture, color = 0x2c2a26): { group: THREE.Group; faceMesh: THREE.Mesh } {
  const group = buildHumanSilhouette(color, 1);
  const faceMat = new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false, transparent: true });
  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), faceMat);
  faceMesh.position.set(0, 1.75, 0.15);
  group.add(faceMesh);
  return { group, faceMesh };
}

export interface HumanoidColors {
  skin: number;
  outfit: number;
  legs: number;
}

/**
 * 頭・首・胴体・腕・脚を別パーツで組んだ低ポリの人型。
 * MeshStandardMaterialで構築するため、天井灯の光を受けて陰影が付き、
 * 単色シルエットのCapsuleGeometryよりも「そこに人が立っている」実在感が出る。
 */
export function buildHumanoidFigure(colors: HumanoidColors): THREE.Group {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: colors.skin, roughness: 0.85, metalness: 0 });
  const outfitMat = new THREE.MeshStandardMaterial({ color: colors.outfit, roughness: 0.9, metalness: 0 });
  const legsMat = new THREE.MeshStandardMaterial({ color: colors.legs, roughness: 0.9, metalness: 0 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), skinMat);
  head.position.y = 1.62;

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.08, 8), skinMat);
  neck.position.y = 1.53;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.5, 10), outfitMat);
  torso.position.y = 1.25;

  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.18, 10), outfitMat);
  hips.position.y = 0.91;

  const legGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.82, 8);
  const legL = new THREE.Mesh(legGeo, legsMat);
  legL.position.set(-0.08, 0.41, 0);
  const legR = new THREE.Mesh(legGeo, legsMat);
  legR.position.set(0.08, 0.41, 0);

  const armGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.52, 8);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.2, 1.1, 0);
  armL.rotation.z = 0.1;
  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.set(0.2, 1.1, 0);
  armR.rotation.z = -0.1;

  group.add(head, neck, torso, hips, legL, legR, armL, armR);
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });
  return group;
}

const PATIENT_COLORS: HumanoidColors = { skin: 0xc9b9a3, outfit: 0xaab0ac, legs: 0x8e8a84 };
const NURSE_COLORS: HumanoidColors = { skin: 0xc2b3a0, outfit: 0xd8dcd6, legs: 0x9aa0a6 };

/** 患者（STAGE02）。病衣の低ポリ人型に、個体差を出す顔テクスチャを前面に貼る */
export function buildPatientFigure(faceTex: THREE.Texture): { group: THREE.Group; faceMesh: THREE.Mesh } {
  const group = buildHumanoidFigure(PATIENT_COLORS);
  const faceMat = new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false, transparent: true });
  const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), faceMat);
  faceMesh.position.set(0, 1.62, 0.1);
  group.add(faceMesh);
  return { group, faceMesh };
}

/** ナース（STAGE02「壁の中のナース」用）。白衣寄りの配色で、あえて顔は付けない */
export function buildNurseFigure(): THREE.Group {
  return buildHumanoidFigure(NURSE_COLORS);
}

export function buildUmbrella(): THREE.Group {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.7 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), poleMat);
  pole.position.y = 0.45;
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.22, 8), canopyMat);
  canopy.position.y = 0.95;
  group.add(pole, canopy);
  return group;
}

export function disposeTexture(tex: THREE.Texture | null | undefined) {
  tex?.dispose();
}

// ============================================================
// STAGE02「廃病院」用テクスチャ・小道具
// ============================================================

export function makeHospitalWallTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#cdd3c8", 10);
  ctx.strokeStyle = "rgba(90,100,90,0.25)";
  ctx.lineWidth = 2;
  for (let y = 90; y <= 256; y += 90) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(60,70,60,0.15)";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 14, 4 + Math.random() * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeHospitalFloorTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#9aa89c", 8);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  const tile = 32;
  for (let x = 0; x <= 256; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 12);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 病院の廊下に繰り返し貼る衛生・案内掲示。variantで数パターン用意し、
 * 「いつも同じはずの掲示物」の密度を上げて見比べる楽しさを作る。
 */
export function makeHospitalNoticeTexture(variant: number): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 176);
  ctx.fillStyle = "#f2f3ee";
  ctx.fillRect(0, 0, 128, 176);
  ctx.strokeStyle = "#9aa39a";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 124, 172);

  const items: [string, string][] = [
    ["手指消毒", "入室前に消毒をお願いします"],
    ["面会時間", "平日 15:00〜19:00"],
    ["静粛に", "院内ではお静かに願います"],
    ["携帯電話", "使用禁止エリアです"],
  ];
  const [title, body] = items[variant % items.length];

  ctx.fillStyle = "#1c2a24";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 64, 32);

  ctx.strokeStyle = "#2e7d5e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(64, 68, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#2e7d5e";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("+", 64, 70);

  ctx.fillStyle = "#3a4440";
  ctx.font = "10px sans-serif";
  let line = "";
  let y = 108;
  for (const ch of body) {
    line += ch;
    if (line.length >= 9) {
      ctx.fillText(line, 64, y);
      line = "";
      y += 15;
    }
  }
  if (line) ctx.fillText(line, 64, y);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 病室番号プレート。glitchで数字が歪んだ異常表示になる */
export function makeRoomNumberTexture(numberText: string, glitch = false): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 96);
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(0, 0, 128, 96);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 124, 92);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (glitch) {
    ctx.fillStyle = "#ff2a2a";
    ctx.font = "bold 40px sans-serif";
    ctx.save();
    ctx.translate(64, 50);
    ctx.rotate(0.06);
    ctx.fillText(numberText, 2, 2);
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(numberText, -3, -2);
  } else {
    ctx.fillStyle = "#e8e6e1";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(numberText, 64, 50);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** カルテ（クリップボード）。anomalyでプレイヤーを示す不穏な記載に変わる */
export function makeChartTexture(anomaly = false): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 176);
  ctx.fillStyle = "#d8d4c4";
  ctx.fillRect(0, 0, 128, 176);
  ctx.strokeStyle = "#8a8672";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 172);
  ctx.strokeStyle = "rgba(60,60,50,0.5)";
  ctx.lineWidth = 1.5;
  for (let y = 30; y < 170; y += 14) {
    ctx.beginPath();
    ctx.moveTo(14, y);
    ctx.lineTo(114, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#2a2a24";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("PATIENT CHART", 14, 18);
  if (anomaly) {
    ctx.fillStyle = "#a01010";
    ctx.font = "bold 13px monospace";
    ctx.fillText("NAME: YOU", 14, 44);
  } else {
    ctx.fillStyle = "#2a2a24";
    ctx.font = "11px monospace";
    ctx.fillText("NAME: ------", 14, 44);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 心拍モニターの波形画面 */
export function makeECGTexture(spiky = false): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 80);
  ctx.fillStyle = "#020a04";
  ctx.fillRect(0, 0, 128, 80);
  ctx.strokeStyle = "#25ff6b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  const step = spiky ? 6 : 10;
  for (let x = 0; x < 128; x += step) {
    const spike = spiky ? (Math.random() - 0.5) * 60 : Math.sin(x * 0.3) * 4;
    const big = !spiky && x % 40 < 6 ? -30 : 0;
    ctx.lineTo(x, 40 + spike + big);
  }
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 患者の顔テクスチャ。seedで表情違いを生成し、通常時は個体差を出す */
export function makePatientFaceTexture(seed: number): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(64, 64);
  ctx.fillStyle = "#cabfae";
  ctx.beginPath();
  ctx.ellipse(32, 32, 22, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  const eyeY = 26 + (seed % 3) - 1;
  const eyeGap = 9 + (seed % 2) * 2;
  ctx.fillStyle = "#161412";
  ctx.beginPath();
  ctx.arc(32 - eyeGap, eyeY, 2.4, 0, Math.PI * 2);
  ctx.arc(32 + eyeGap, eyeY, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4a3f33";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const mouthCurve = ((seed % 5) - 2) * 2;
  ctx.moveTo(24, 44);
  ctx.quadraticCurveTo(32, 44 + mouthCurve, 40, 44);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildPatientBed(): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x555b5e, roughness: 0.5, metalness: 0.4 });
  const mattressMat = new THREE.MeshStandardMaterial({ color: 0xe4e0d2, roughness: 0.85 });
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 1.1), mattressMat);
  mattress.position.y = 0.42;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 1.15), frameMat);
  frame.position.y = 0.35;
  const legGeo = new THREE.BoxGeometry(0.04, 0.34, 0.04);
  const legOffsets: [number, number][] = [
    [-0.26, -0.5],
    [0.26, -0.5],
    [-0.26, 0.5],
    [0.26, 0.5],
  ];
  for (const [x, z] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(x, 0.17, z);
    group.add(leg);
  }
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.05), frameMat);
  headboard.position.set(0, 0.58, -0.55);
  group.add(mattress, frame, headboard);
  return group;
}

export function buildWheelchair(): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c, roughness: 0.5, metalness: 0.5 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.4), seatMat);
  seat.position.y = 0.42;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.05), seatMat);
  back.position.set(0, 0.62, -0.18);
  const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.03, 16);
  const wheelL = new THREE.Mesh(wheelGeo, frameMat);
  wheelL.rotation.z = Math.PI / 2;
  wheelL.position.set(-0.22, 0.24, 0.02);
  const wheelR = wheelL.clone();
  wheelR.position.x = 0.22;
  const smallWheelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 10);
  const smallL = new THREE.Mesh(smallWheelGeo, frameMat);
  smallL.rotation.z = Math.PI / 2;
  smallL.position.set(-0.16, 0.07, -0.32);
  const smallR = smallL.clone();
  smallR.position.x = 0.16;
  group.add(seat, back, wheelL, wheelR, smallL, smallR);
  return group;
}

export interface IVPoleHandle {
  group: THREE.Group;
  bagMat: THREE.MeshStandardMaterial;
  drop: THREE.Mesh;
}

export function buildIVPole(): IVPoleHandle {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xb7bcc0, roughness: 0.3, metalness: 0.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 6), poleMat);
  pole.position.y = 0.75;
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 6, 16), poleMat);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.02;
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xdfe8ea, roughness: 0.4, transparent: true, opacity: 0.85 });
  const bag = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.14, 4, 8), bagMat);
  bag.position.y = 1.4;
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0x88a0a8 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.55, 5), tubeMat);
  tube.position.y = 1.02;
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), new THREE.MeshBasicMaterial({ color: 0xaad4e0 }));
  drop.position.y = 1.2;
  group.add(pole, baseRing, bag, tube, drop);
  return { group, bagMat, drop };
}

export function buildNurseSpeaker(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: 0.6 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.05), mat);
  const grillMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });
  const grill = new THREE.Mesh(new THREE.CircleGeometry(0.03, 12), grillMat);
  grill.position.z = 0.026;
  group.add(box, grill);
  return group;
}

// ============================================================
// STAGE03「廃校」用テクスチャ・小道具
// ============================================================

export function makeSchoolWallTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#d8d2b8", 8);
  // 腰板（下部の濃い帯）
  ctx.fillStyle = "#6b5c42";
  ctx.fillRect(0, 170, 256, 86);
  ctx.strokeStyle = "rgba(40,30,10,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 170);
  ctx.lineTo(256, 170);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeSchoolFloorTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#b89b6a", 10);
  ctx.strokeStyle = "rgba(60,45,20,0.2)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 教室の黒板。messageで書かれている文字を変える（空文字で「何も書かれていない」） */
export function makeChalkboardTexture(message: string): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(192, 112);
  ctx.fillStyle = "#1e3a2e";
  ctx.fillRect(0, 0, 192, 112);
  ctx.strokeStyle = "#5a4a30";
  ctx.lineWidth = 5;
  ctx.strokeRect(2, 2, 188, 108);
  if (message) {
    ctx.fillStyle = "rgba(235,235,225,0.9)";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, 96, 56);
  } else {
    // 薄いチョークの消し跡
    ctx.strokeStyle = "rgba(220,220,210,0.12)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(20 + i * 10, 20);
      ctx.lineTo(170 - i * 6, 92);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 卒業アルバム風の集合写真。extraで本来いないはずの顔を1つ紛れ込ませる */
export function makeClassPortraitTexture(extra: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(160, 128);
  ctx.fillStyle = "#e4ddc8";
  ctx.fillRect(0, 0, 160, 128);
  ctx.strokeStyle = "#8a8366";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 156, 124);

  const cols = 5;
  const rows = 3;
  const count = cols * rows - (extra ? 0 : 1);
  ctx.fillStyle = "#cabf9e";
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 22 + col * 28;
    const cy = 26 + row * 32;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (extra) {
    // 最後の1枠だけ、黒く塗り潰した「異質な顔」にする
    const i = count - 1;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 22 + col * 28;
    const cy = 26 + row * 32;
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 下駄箱。extraで、本来空であるはずの枠に見覚えのない上履きが増える */
export function makeShoeCubbyTexture(extra: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(160, 112);
  ctx.fillStyle = "#4a3c2a";
  ctx.fillRect(0, 0, 160, 112);
  const cols = 5;
  const rows = 3;
  const cellW = 160 / cols;
  const cellH = 112 / rows;
  ctx.strokeStyle = "#2a2018";
  ctx.lineWidth = 2;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cellW, 0);
    ctx.lineTo(c * cellW, 112);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cellH);
    ctx.lineTo(160, r * cellH);
    ctx.stroke();
  }
  const filled = new Set([1, 3, 6, 9, 11, 13]);
  ctx.fillStyle = "#d8d4c8";
  for (const i of filled) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    ctx.beginPath();
    ctx.ellipse(c * cellW + cellW / 2, r * cellH + cellH / 2, cellW * 0.3, cellH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (extra) {
    // 誰も使っていないはずの最後の枠にだけ、上履きが増えている
    const emptyIdx = 14;
    const c = emptyIdx % cols;
    const r = Math.floor(emptyIdx / cols);
    ctx.fillStyle = "#c01818";
    ctx.beginPath();
    ctx.ellipse(c * cellW + cellW / 2, r * cellH + cellH / 2, cellW * 0.3, cellH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 廃校の廊下に繰り返し貼る掲示物 */
export function makeSchoolNoticeTexture(variant: number): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 176);
  ctx.fillStyle = "#ece6d0";
  ctx.fillRect(0, 0, 128, 176);
  ctx.strokeStyle = "#8a8366";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 124, 172);

  const items: [string, string][] = [
    ["私語厳禁", "廊下では静かに歩きましょう"],
    ["上履き着用", "土足での立入を禁じます"],
    ["避難経路", "最寄りの非常口はこちら"],
    ["掲示板", "お知らせは職員室前にて"],
  ];
  const [title, body] = items[variant % items.length];

  ctx.fillStyle = "#1c1a14";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 64, 32);

  ctx.strokeStyle = "#2a5a3a";
  ctx.lineWidth = 3;
  ctx.strokeRect(44, 48, 40, 40);

  ctx.fillStyle = "#3a382e";
  ctx.font = "10px sans-serif";
  let line = "";
  let y = 112;
  for (const ch of body) {
    line += ch;
    if (line.length >= 9) {
      ctx.fillText(line, 64, y);
      line = "";
      y += 15;
    }
  }
  if (line) ctx.fillText(line, 64, y);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const STUDENT_COLORS: HumanoidColors = { skin: 0xc9b9a3, outfit: 0x24304a, legs: 0x1c1c22 };

/** 生徒（STAGE03）。学生服寄りの配色の低ポリ人型 */
export function buildStudentFigure(): THREE.Group {
  return buildHumanoidFigure(STUDENT_COLORS);
}

/** ロッカー列。ajarIndexで指定した1台だけ、扉が少し開いた状態になる */
export function buildLockerRow(count: number, ajarIndex: number | null): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a4a52, roughness: 0.6, metalness: 0.3 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a5c66, roughness: 0.5, metalness: 0.4 });
  const width = 0.32;
  for (let i = 0; i < count; i++) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(width - 0.02, 0.85, 0.32), bodyMat);
    body.position.set(i * width, 0.43, 0);
    const doorPivot = new THREE.Object3D();
    doorPivot.position.set(i * width - (width - 0.02) / 2, 0.43, 0.16);
    const door = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, 0.8, 0.02), doorMat);
    door.position.set((width - 0.04) / 2, 0, 0.01);
    doorPivot.add(door);
    if (ajarIndex !== null && i === ajarIndex) {
      doorPivot.rotation.y = -0.9;
    }
    group.add(body, doorPivot);
  }
  return group;
}

/** 教室の窓越しに見える机の列。countで列の机の数を変化させる */
export function buildDeskRow(count: number): THREE.Group {
  const group = new THREE.Group();
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x8a6b45, roughness: 0.8 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.3 });
  const cols = 3;
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const desk = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.12), deskMat);
    top.position.y = 0.16;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.02), legMat);
    desk.add(top, leg);
    desk.position.set((col - 1) * 0.22, 0, -row * 0.18);
    group.add(desk);
  }
  return group;
}

export interface SchoolDoorHandle {
  group: THREE.Group;
  plateMat: THREE.MeshBasicMaterial;
}

/**
 * 教室の引き戸一式（アルミ枠+ワイヤー入りガラス窓+腰板+取っ手+クラス表示）。
 * 単なる番号プレートではなく実際の引き戸の形を持たせ、廊下らしいリアリティを出す。
 */
export function buildSchoolDoorPanel(numberTex: THREE.Texture): SchoolDoorHandle {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8a8a82, roughness: 0.4, metalness: 0.6 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.0, 0.05), frameMat);
  group.add(frame);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0xc9c4b0, roughness: 0.5 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.9, 0.03), doorMat);
  door.position.z = 0.012;
  group.add(door);

  // 上部のワイヤー入り磨りガラス窓
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xaebfc2,
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
    opacity: 0.55,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 1.1), glassMat);
  glass.position.set(0, 0.35, 0.03);
  group.add(glass);
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x6a6a62, roughness: 0.5 });
  const wireH = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.01, 0.005), wireMat);
  wireH.position.set(0, 0.35, 0.035);
  const wireV = new THREE.Mesh(new THREE.BoxGeometry(0.01, 1.1, 0.005), wireMat);
  wireV.position.set(0, 0.35, 0.035);
  group.add(wireH, wireV);

  // 下部の腰板
  const lowerPanelMat = new THREE.MeshStandardMaterial({ color: 0xb8b2a0, roughness: 0.6 });
  const lowerPanel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.015), lowerPanelMat);
  lowerPanel.position.set(0, -0.62, 0.03);
  group.add(lowerPanel);

  // 引き戸の掘り込み取っ手
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3, metalness: 0.7 });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.02), handleMat);
  handle.position.set(0.24, -0.3, 0.04);
  group.add(handle);

  // クラス表示プレート
  const plateMat = new THREE.MeshBasicMaterial({ map: numberTex, toneMapped: false });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.13), plateMat);
  plate.position.set(0, 0.92, 0.035);
  group.add(plate);

  return { group, plateMat };
}

// ============================================================
// STAGE04「夜神社」用テクスチャ・小道具
// ============================================================

export function makeShrinePathTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#4a4740", 14);
  ctx.fillStyle = "rgba(20,18,14,0.3)";
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.ellipse(x, y, 3 + Math.random() * 5, 2 + Math.random() * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeHedgeWallTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#111613", 10);
  ctx.fillStyle = "rgba(20,30,20,0.4)";
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 夜空（「天井」用）。かすかな星をちりばめる */
export function makeNightSkyTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  ctx.fillStyle = "#040308";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(220,220,240,0.6)";
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = Math.random() < 0.15 ? 1.4 : 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 絵馬。messageで書かれている願い事の文字を変える */
export function makeEmaTexture(message: string): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(112, 128);
  ctx.fillStyle = "#caa15a";
  ctx.beginPath();
  ctx.moveTo(4, 24);
  ctx.lineTo(56, 4);
  ctx.lineTo(108, 24);
  ctx.lineTo(108, 124);
  ctx.lineTo(4, 124);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#6b4a22";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#2a1c0e";
  ctx.font = "20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("奉", 56, 60);
  if (message) {
    ctx.fillStyle = "#1a1210";
    ctx.font = "14px sans-serif";
    ctx.fillText(message, 56, 94);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 参道に繰り返し立てる木製案内札 */
export function makeShrineNoticeTexture(variant: number): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 176);
  ctx.fillStyle = "#3a2e1e";
  ctx.fillRect(0, 0, 128, 176);
  ctx.strokeStyle = "#1c150c";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 172);

  const items: [string, string][] = [
    ["清め", "手水にて心身を清めてください"],
    ["一礼", "鳥居の前では一礼を"],
    ["参拝順路", "矢印に沿ってお進みください"],
    ["私語厳禁", "参道では静かにお歩きください"],
  ];
  const [title, body] = items[variant % items.length];

  ctx.fillStyle = "#e8dcb8";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 64, 34);

  ctx.strokeStyle = "#c2a04a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 46);
  ctx.lineTo(104, 46);
  ctx.stroke();

  ctx.fillStyle = "#cfc49e";
  ctx.font = "11px sans-serif";
  let line = "";
  let y = 70;
  for (const ch of body) {
    line += ch;
    if (line.length >= 8) {
      ctx.fillText(line, 64, y);
      line = "";
      y += 16;
    }
  }
  if (line) ctx.fillText(line, 64, y);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 鳥居（朱塗りの柱2本+貫+笠木）。widthで柱の間隔、heightで高さを指定する */
export function buildToriiGate(width = 1.9, height = 2.6): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xa3321f, roughness: 0.7 });
  const pillarGeo = new THREE.CylinderGeometry(0.08, 0.09, height, 10);
  const pillarL = new THREE.Mesh(pillarGeo, mat);
  pillarL.position.set(-width / 2, height / 2, 0);
  const pillarR = new THREE.Mesh(pillarGeo, mat);
  pillarR.position.set(width / 2, height / 2, 0);
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.12, 0.12), mat);
  nuki.position.set(0, height * 0.72, 0);
  const kasagi = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.16, 0.22), mat);
  kasagi.position.set(0, height + 0.1, 0);
  const shimaki = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.5, 0.08, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.6 })
  );
  shimaki.position.set(0, height + 0.02, 0);
  group.add(pillarL, pillarR, nuki, kasagi, shimaki);
  return group;
}

export interface StoneLanternHandle {
  group: THREE.Group;
  flame: THREE.Mesh;
  flameLight: THREE.PointLight;
}

/** 石灯籠。flame/flameLightを切り替えることで「灯りが消えている」異変を表現する */
export function buildStoneLantern(): StoneLanternHandle {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5c5a52, roughness: 0.95 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.1, 8), stoneMat);
  base.position.y = 0.05;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.55, 8), stoneMat);
  pole.position.y = 0.38;
  const house = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.26, 8), stoneMat);
  house.position.y = 0.78;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 8), stoneMat);
  roof.position.y = 0.98;
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb347, toneMapped: false });
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), flameMat);
  flame.position.y = 0.78;
  const flameLight = new THREE.PointLight(0xffb347, 2.2, 3, 2);
  flameLight.position.y = 0.78;
  group.add(base, pole, house, roof, flame, flameLight);
  return { group, flame, flameLight };
}

export interface KomainuHandle {
  group: THREE.Group;
  headPivot: THREE.Object3D;
}

/** 狛犬。headPivot.rotation.yでプレイヤー方向へ顔を向けられるようにする */
export function buildKomainu(mirrored: boolean): KomainuHandle {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a8578, roughness: 0.9 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.4), mat);
  base.position.y = 0.05;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.34), mat);
  body.position.y = 0.26;
  const headPivot = new THREE.Object3D();
  headPivot.position.set(0, 0.42, mirrored ? -0.14 : 0.14);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.16), mat);
  const earGeo = new THREE.ConeGeometry(0.04, 0.08, 6);
  const earL = new THREE.Mesh(earGeo, mat);
  earL.position.set(-0.06, 0.1, 0);
  const earR = new THREE.Mesh(earGeo, mat);
  earR.position.set(0.06, 0.1, 0);
  headPivot.add(head, earL, earR);
  group.add(base, body, headPivot);
  return { group, headPivot };
}

export interface ChozuyaHandle {
  group: THREE.Group;
  waterMat: THREE.MeshStandardMaterial;
}

/** 手水舎の水盤。waterMat.colorを変えることで「水が赤い」異変を表現する */
export function buildChozuya(): ChozuyaHandle {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a4842, roughness: 0.9 });
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.26, 10), stoneMat);
  basin.position.y = 0.13;
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x3a6a78, roughness: 0.15, metalness: 0.3 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 10), waterMat);
  water.position.y = 0.25;
  const roofPostGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6);
  const posts: THREE.Mesh[] = [];
  for (const [x, z] of [
    [-0.3, -0.3],
    [0.3, -0.3],
    [-0.3, 0.3],
    [0.3, 0.3],
  ] as [number, number][]) {
    const post = new THREE.Mesh(roofPostGeo, stoneMat);
    post.position.set(x, 0.55, z);
    posts.push(post);
  }
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 0.3, 4),
    new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.8 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.25;
  group.add(basin, water, roof, ...posts);
  return { group, waterMat };
}

/** しめ縄＋紙垂のゲート。shideCountで紙垂の本数を変化させる */
export function buildShimenawaGate(shideCount: number): THREE.Group {
  const group = new THREE.Group();
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xe8ddc0, roughness: 0.95 });
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.9, 8), ropeMat);
  rope.rotation.z = Math.PI / 2;
  group.add(rope);
  const shideMat = new THREE.MeshBasicMaterial({ color: 0xf4f1e6, toneMapped: false, side: THREE.DoubleSide });
  for (let i = 0; i < shideCount; i++) {
    const shide = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.26), shideMat);
    const t = shideCount === 1 ? 0 : i / (shideCount - 1) - 0.5;
    shide.position.set(t * 1.6, -0.18, 0);
    group.add(shide);
  }
  return group;
}

/** 石段（装飾用）。countで段数を変化させる */
export function buildStoneSteps(count: number): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x5c5a52, roughness: 0.95 });
  for (let i = 0; i < count; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.16), mat);
    step.position.set(0, i * 0.08, -i * 0.16);
    group.add(step);
  }
  return group;
}

const SHRINE_FIGURE_COLORS: HumanoidColors = { skin: 0x2a2622, outfit: 0x1c1a18, legs: 0x141210 };

/** 顔のない人影（STAGE04ボス用）。あえて顔のパーツを付けない低ポリ人型 */
export function buildFacelessFigure(): THREE.Group {
  return buildHumanoidFigure(SHRINE_FIGURE_COLORS);
}

// ============================================================
// STAGE05「ホテル666」用テクスチャ・小道具
// ============================================================

export function makeHotelWallpaperTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#3a1c22", 8);
  ctx.strokeStyle = "rgba(90,40,30,0.3)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(120,60,40,0.12)";
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.ellipse(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 10, 16 + Math.random() * 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeHotelCarpetTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#5a1018", 10);
  ctx.fillStyle = "rgba(20,5,8,0.4)";
  for (let y = 0; y < 256; y += 48) {
    for (let x = 0; x < 256; x += 48) {
      ctx.beginPath();
      ctx.arc(x + 24, y + 24, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 「起こさないでください」の札。anomalyでメッセージが不穏なものに変わる */
export function makeDndTexture(anomaly: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(96, 160);
  ctx.fillStyle = "#c7b57a";
  ctx.fillRect(4, 4, 88, 152);
  ctx.strokeStyle = "#2a2015";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 88, 152);
  ctx.fillStyle = "#2a2015";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DO NOT", 48, 60);
  ctx.fillText("DISTURB", 48, 78);
  if (anomaly) {
    ctx.fillStyle = "#7a1010";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("出てこない", 48, 110);
    ctx.fillText("でください", 48, 130);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 廊下の絵画。variantで視線の向きを変える */
export function makePaintingTexture(variant: 0 | 1): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 160);
  ctx.fillStyle = "#1c1410";
  ctx.fillRect(0, 0, 128, 160);
  ctx.fillStyle = "#4a3a2c";
  ctx.beginPath();
  ctx.ellipse(64, 70, 30, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  const eyeOffset = variant === 1 ? 10 : 0;
  ctx.fillStyle = "#0a0806";
  ctx.beginPath();
  ctx.ellipse(54 + eyeOffset, 64, 4, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(74 + eyeOffset, 64, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#caa86a";
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 116, 148);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 自動販売機のパネル。anomalyで商品名が不穏なものに変わる */
export function makeVendingScreenTexture(anomaly: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(96, 128);
  ctx.fillStyle = "#0a0a12";
  ctx.fillRect(0, 0, 96, 128);
  const items = anomaly
    ? ["????", "でてこい", "666", "のまないで"]
    : ["COLA", "WATER", "TEA", "COFFEE"];
  ctx.fillStyle = anomaly ? "#ff3a3a" : "#8adfff";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  items.forEach((label, i) => {
    ctx.fillText(label, 6, 24 + i * 26);
    ctx.strokeStyle = anomaly ? "#ff3a3a" : "#8adfff";
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 10 + i * 26, 86, 18);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** ホテル廊下に繰り返し貼る案内掲示 */
export function makeHotelNoticeTexture(variant: number): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 176);
  ctx.fillStyle = "#2a1c1a";
  ctx.fillRect(0, 0, 128, 176);
  ctx.strokeStyle = "#8a6a4a";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 124, 172);

  const items: [string, string][] = [
    ["非常口", "避難経路は矢印方向です"],
    ["禁煙", "館内は全室禁煙です"],
    ["清掃時間", "毎朝9時より清掃を行います"],
    ["フロント", "御用の際は内線0番へ"],
  ];
  const [title, body] = items[variant % items.length];

  ctx.fillStyle = "#e8d8b0";
  ctx.font = "bold 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 64, 32);

  ctx.strokeStyle = "#caa04a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 46);
  ctx.lineTo(104, 46);
  ctx.stroke();

  ctx.fillStyle = "#cbb894";
  ctx.font = "10px sans-serif";
  let line = "";
  let y = 70;
  for (const ch of body) {
    line += ch;
    if (line.length >= 9) {
      ctx.fillText(line, 64, y);
      line = "";
      y += 15;
    }
  }
  if (line) ctx.fillText(line, 64, y);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface ElevatorHandle {
  group: THREE.Group;
  indicatorMat: THREE.MeshBasicMaterial;
}

/** エレベーター扉と階数表示パネル */
export function buildElevatorDoors(indicatorTex: THREE.Texture): ElevatorHandle {
  const group = new THREE.Group();
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x8a7a4a, roughness: 0.3, metalness: 0.8 });
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.9, 0.04), doorMat);
  doorL.position.set(-0.23, 0.95, 0);
  const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.9, 0.04), doorMat);
  doorR.position.set(0.23, 0.95, 0);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 2.0, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.5 })
  );
  frame.position.z = -0.02;
  const indicatorMat = new THREE.MeshBasicMaterial({ map: indicatorTex, toneMapped: false });
  const indicator = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.12), indicatorMat);
  indicator.position.set(0, 2.05, 0.02);
  group.add(frame, doorL, doorR, indicator);
  return { group, indicatorMat };
}

/** スーツケース付きのルームサービス/荷物カート。extraで荷物が増える */
export function buildLuggageCart(extra: boolean): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.5, metalness: 0.5 });
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.35), frameMat);
  shelf.position.y = 0.45;
  const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6);
  const legOffsets: [number, number][] = [
    [-0.22, -0.15],
    [0.22, -0.15],
    [-0.22, 0.15],
    [0.22, 0.15],
  ];
  for (const [x, z] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(x, 0.22, z);
    group.add(leg);
  }
  const caseMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.6 });
  const case1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.2), caseMat);
  case1.position.set(-0.05, 0.57, 0);
  group.add(shelf, case1);
  if (extra) {
    const case2Mat = new THREE.MeshStandardMaterial({ color: 0x5a2a2a, roughness: 0.6 });
    const case2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.18), case2Mat);
    case2.position.set(0.14, 0.53, 0.02);
    group.add(case2);
  }
  return group;
}

export interface VendingMachineHandle {
  group: THREE.Group;
  screenMat: THREE.MeshBasicMaterial;
  glowLight: THREE.PointLight;
}

export function buildVendingMachine(screenTex: THREE.Texture): VendingMachineHandle {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, roughness: 0.4, metalness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.5, 0.4), bodyMat);
  body.position.y = 0.75;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.55), screenMat);
  screen.position.set(0, 0.95, 0.21);
  const glowLight = new THREE.PointLight(0x8adfff, 1.2, 1.5, 2);
  glowLight.position.set(0, 0.95, 0.3);
  group.add(body, screen, glowLight);
  return { group, screenMat, glowLight };
}

/** ルームサービスカート */
export function buildRoomServiceCart(): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xaaa9a0, roughness: 0.4, metalness: 0.6 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.3), frameMat);
  top.position.y = 0.5;
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.3), frameMat);
  shelf.position.y = 0.25;
  const legGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6);
  for (const [x, z] of [
    [-0.22, -0.12],
    [0.22, -0.12],
    [-0.22, 0.12],
    [0.22, 0.12],
  ] as [number, number][]) {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(x, 0.25, z);
    group.add(leg);
  }
  const domeMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d0, roughness: 0.3, metalness: 0.7 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
  dome.position.set(-0.08, 0.5, 0);
  group.add(top, shelf, dome);
  return group;
}

const HOTEL_GUEST_COLORS: HumanoidColors = { skin: 0xc9b9a3, outfit: 0x2a2a30, legs: 0x1c1c20 };

/** 宿泊客風の人影（STAGE05ボス用） */
export function buildHotelGuestFigure(): THREE.Group {
  return buildHumanoidFigure(HOTEL_GUEST_COLORS);
}

export interface HotelDoorHandle {
  group: THREE.Group;
  plateMat: THREE.MeshBasicMaterial;
}

/**
 * 客室ドア一式（扉本体+枠+ドアノブ+覗き穴+部屋番号プレート）。
 * 単なる番号プレートではなく実際の扉の形を持たせることで、
 * 廊下らしいリアリティを出す。
 */
export function buildHotelDoorPanel(numberTex: THREE.Texture): HotelDoorHandle {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.6 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.96, 0.05), frameMat);
  group.add(frame);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a2e1c, roughness: 0.55 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.86, 0.03), doorMat);
  door.position.z = 0.012;
  group.add(door);

  const panelMat = new THREE.MeshStandardMaterial({ color: 0x3a2516, roughness: 0.6 });
  const panelTop = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.015), panelMat);
  panelTop.position.set(0, 0.55, 0.03);
  const panelBottom = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.75, 0.015), panelMat);
  panelBottom.position.set(0, -0.35, 0.03);
  group.add(panelTop, panelBottom);

  const knobMat = new THREE.MeshStandardMaterial({ color: 0xc9a84a, roughness: 0.3, metalness: 0.8 });
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), knobMat);
  knob.position.set(0.22, -0.05, 0.04);
  group.add(knob);

  const peepholeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2, metalness: 0.6 });
  const peephole = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), peepholeMat);
  peephole.position.set(0, 0.95, 0.03);
  group.add(peephole);

  const plateMat = new THREE.MeshBasicMaterial({ map: numberTex, toneMapped: false });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), plateMat);
  plate.position.set(0, 0.72, 0.03);
  group.add(plate);

  return { group, plateMat };
}

// ============================================================
// STAGE06「終電」用テクスチャ・小道具
// ============================================================

export function makeTrainWallTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#c8c2b0", 8);
  ctx.strokeStyle = "rgba(90,85,70,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 120);
  ctx.lineTo(256, 120);
  ctx.stroke();
  ctx.fillStyle = "rgba(60,80,90,0.3)";
  ctx.fillRect(0, 150, 256, 60);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeTrainFloorTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 256);
  noiseFill(ctx, 256, 256, "#3a3a3e", 10);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (let y = 0; y < 256; y += 16) {
    for (let x = 0; x < 256; x += 16) {
      if ((x / 16 + y / 16) % 2 === 0) ctx.fillRect(x, y, 16, 16);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 路線図。anomalyで知らない駅名が紛れ込む */
export function makeRouteMapTexture(anomaly: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(192, 96);
  ctx.fillStyle = "#eef0e8";
  ctx.fillRect(0, 0, 192, 96);
  ctx.strokeStyle = "#2a6a3a";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(10, 48);
  ctx.lineTo(182, 48);
  ctx.stroke();
  const stations = ["中央", "本町", "花園", "北山", "終点"];
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i < stations.length; i++) {
    const x = 20 + i * 38;
    ctx.fillStyle = "#1c1c1c";
    ctx.beginPath();
    ctx.arc(x, 48, 4, 0, Math.PI * 2);
    ctx.fill();
    const label = anomaly && i === 3 ? "誰そ彼" : stations[i];
    ctx.fillStyle = anomaly && i === 3 ? "#a01010" : "#1c1c1c";
    ctx.fillText(label, x, 66);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 車内広告。anomalyで不穏な内容に変わる */
export function makeTrainAdTexture(anomaly: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(160, 96);
  ctx.fillStyle = anomaly ? "#160808" : "#f0e8d8";
  ctx.fillRect(0, 0, 160, 96);
  ctx.strokeStyle = "#8a8366";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 156, 92);
  ctx.textAlign = "center";
  if (anomaly) {
    ctx.fillStyle = "#a01010";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("おりられません", 80, 44);
    ctx.font = "11px sans-serif";
    ctx.fillText("このまま終点まで", 80, 64);
  } else {
    ctx.fillStyle = "#2a2a2a";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("キャンペーン実施中", 80, 40);
    ctx.font = "10px sans-serif";
    ctx.fillText("詳しくは窓口まで", 80, 58);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 優先席プレート。anomalyでプレイヤー自身の名前が書かれる */
export function makePrioritySeatTexture(anomaly: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 64);
  ctx.fillStyle = "#1c2a4a";
  ctx.fillRect(0, 0, 128, 64);
  ctx.strokeStyle = "#e8d060";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 124, 60);
  ctx.fillStyle = "#e8d060";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("優先席", 64, 26);
  ctx.font = "9px sans-serif";
  ctx.fillStyle = anomaly ? "#ff4a4a" : "#c9d0e0";
  ctx.fillText(anomaly ? "あなたの席です" : "お譲りください", 64, 46);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** ベンチシート（座席）。lengthで長さを指定する */
export function buildTrainSeatBench(length: number): THREE.Group {
  const group = new THREE.Group();
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x1c2a44, roughness: 0.85 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd8d4c4, roughness: 0.4, metalness: 0.3 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, length), cushionMat);
  seat.position.y = 0.42;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, length), cushionMat);
  back.position.set(-0.17, 0.68, 0);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.38, length - 0.04), frameMat);
  frame.position.y = 0.2;
  group.add(seat, back, frame);
  return group;
}

/**
 * 連続したロングシート（日本の通勤電車らしい、仕切り板付きの長い座席）。
 * lengthで全体の長さ、divisionsで座席の区画数（仕切り板の数-1）を指定する。
 */
export function buildTrainBenchRun(length: number, divisions: number): THREE.Group {
  const group = new THREE.Group();
  const cushionMat = new THREE.MeshStandardMaterial({ color: 0x1c2a44, roughness: 0.85 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd8d4c4, roughness: 0.4, metalness: 0.3 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, length), cushionMat);
  seat.position.y = 0.42;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.46, length), cushionMat);
  back.position.set(-0.17, 0.66, 0);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.38, length - 0.04), frameMat);
  frame.position.y = 0.2;
  group.add(seat, back, frame);

  const dividerMat = new THREE.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.5 });
  for (let i = 0; i <= divisions; i++) {
    const z = -length / 2 + (i * length) / divisions;
    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.025), dividerMat);
    divider.position.set(-0.03, 0.68, z);
    group.add(divider);
  }
  return group;
}

/** 床から天井近くまで伸びるステンレスのスタンションポール（握り棒） */
export function buildStanchionPole(height: number): THREE.Group {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xc9cdd0, roughness: 0.2, metalness: 0.85 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, height, 10), poleMat);
  pole.position.y = height / 2;
  const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12), poleMat);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = height - 0.05;
  group.add(pole, topRing);
  return group;
}

/** 天井中央に通る蛍光灯の光るパネル。lengthで長さを指定する */
export function buildCeilingLightStrip(length: number): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xf4f8ff,
    emissive: 0xdfe8ff,
    emissiveIntensity: 1.1,
    roughness: 0.6,
  });
  return new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, length), mat);
}

export interface StrapRowHandle {
  group: THREE.Group;
  straps: THREE.Object3D[];
}

/** つり革の列。countで本数、spacingで間隔を指定する */
export function buildStrapRow(count: number, spacing: number): StrapRowHandle {
  const group = new THREE.Group();
  const railMat = new THREE.MeshStandardMaterial({ color: 0x9a9890, roughness: 0.3, metalness: 0.7 });
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, count * spacing, 8), railMat);
  rail.rotation.z = Math.PI / 2;
  group.add(rail);

  const strapMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.8 });
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xc9a84a, roughness: 0.4, metalness: 0.6 });
  const straps: THREE.Object3D[] = [];
  for (let i = 0; i < count; i++) {
    const pivot = new THREE.Object3D();
    pivot.position.set((i - (count - 1) / 2) * spacing, 0, 0);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.008), strapMat);
    band.position.y = -0.14;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12), ringMat);
    ring.position.y = -0.28;
    pivot.add(band, ring);
    group.add(pivot);
    straps.push(pivot);
  }
  return { group, straps };
}

export interface EmergencyButtonHandle {
  group: THREE.Group;
  lampMat: THREE.MeshStandardMaterial;
  light: THREE.PointLight;
}

export function buildEmergencyButton(): EmergencyButtonHandle {
  const group = new THREE.Group();
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, roughness: 0.5 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.04), boxMat);
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0x3a0808,
    emissive: 0x3a0808,
    emissiveIntensity: 0.3,
    roughness: 0.4,
  });
  const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), lampMat);
  lamp.position.z = 0.021;
  const light = new THREE.PointLight(0xff2a2a, 0, 1.2, 2);
  light.position.z = 0.05;
  group.add(box, lamp, light);
  return { group, lampMat, light };
}

/** 車窓の外に流れる夜景（走行中の雰囲気を出すため、使う側でオフセットをスクロールさせる） */
export function makeTrainSceneryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#03040a");
  grad.addColorStop(0.7, "#070910");
  grad.addColorStop(1, "#0d1119");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 遠景のビル影と窓明かり（タイルしても違和感の少ない低いシルエット）
  let seed = 11;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  let x = 0;
  while (x < canvas.width) {
    const w = 12 + rand() * 24;
    const h = 18 + rand() * 55;
    ctx.fillStyle = "rgba(5,6,11,0.95)";
    ctx.fillRect(x, canvas.height - h, w, h);
    const winCount = Math.floor(h / 13);
    for (let i = 0; i < winCount; i++) {
      if (rand() > 0.55) {
        ctx.fillStyle = `rgba(255,${200 + Math.floor(rand() * 40)},130,${0.35 + rand() * 0.35})`;
        ctx.fillRect(x + 2 + rand() * (w - 6), canvas.height - h + 4 + i * 12, 2, 3);
      }
    }
    x += w + 3 + rand() * 7;
  }

  // 流れる光の筋（走行時のモーションブラー表現）
  for (let i = 0; i < 10; i++) {
    const y = canvas.height * (0.3 + rand() * 0.55);
    const w = 20 + rand() * 60;
    const px = rand() * canvas.width;
    const streak = ctx.createLinearGradient(px, y, px + w, y);
    streak.addColorStop(0, "rgba(255,230,180,0)");
    streak.addColorStop(0.5, `rgba(255,230,180,${0.15 + rand() * 0.2})`);
    streak.addColorStop(1, "rgba(255,230,180,0)");
    ctx.fillStyle = streak;
    ctx.fillRect(px, y, w, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface TrainWindowHandle {
  group: THREE.Group;
  glassMat: THREE.MeshStandardMaterial;
  sceneryMat: THREE.MeshBasicMaterial;
  sceneryTex: THREE.CanvasTexture;
}

/** 車窓（中が空いた縁+外を流れる夜景+半透明ガラスの3層構成） */
export function buildTrainWindow(width: number, height: number): TrainWindowHandle {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x7a7870, roughness: 0.4, metalness: 0.5 });
  const bw = 0.05;
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(width + bw * 2, bw, 0.04), frameMat);
  frameTop.position.y = height / 2 + bw / 2;
  const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(width + bw * 2, bw, 0.04), frameMat);
  frameBottom.position.y = -(height / 2 + bw / 2);
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(bw, height, 0.04), frameMat);
  frameLeft.position.x = -(width / 2 + bw / 2);
  const frameRight = new THREE.Mesh(new THREE.BoxGeometry(bw, height, 0.04), frameMat);
  frameRight.position.x = width / 2 + bw / 2;
  group.add(frameTop, frameBottom, frameLeft, frameRight);

  // 外側: 流れる夜景（窓の奥＝ローカルZ負方向に配置）
  const sceneryTex = makeTrainSceneryTexture();
  sceneryTex.repeat.set(Math.max(1, width / 1.1), 1);
  const sceneryMat = new THREE.MeshBasicMaterial({ map: sceneryTex, toneMapped: false });
  const scenery = new THREE.Mesh(new THREE.PlaneGeometry(width, height), sceneryMat);
  scenery.position.z = -0.05;
  group.add(scenery);

  // 内側: 半透明のガラス（夜景が透けて見える）
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0c1420,
    roughness: 0.15,
    metalness: 0.5,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(width, height), glassMat);
  glass.position.z = 0.02;
  group.add(glass);

  return { group, glassMat, sceneryMat, sceneryTex };
}

const TRAIN_PASSENGER_COLORS: HumanoidColors = { skin: 0xc9b9a3, outfit: 0x24282e, legs: 0x1a1a1e };

/** 乗客風の人影（STAGE06用） */
export function buildTrainPassengerFigure(): THREE.Group {
  return buildHumanoidFigure(TRAIN_PASSENGER_COLORS);
}

// ============================================================
// STAGE07「廃遊園地」用テクスチャ・小道具
// ============================================================

export function makeParkPathTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 128);
  noiseFill(ctx, 128, 128, "#4a4038", 6);
  ctx.strokeStyle = "rgba(20,18,14,0.5)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 128; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  for (let y = 0; y <= 128; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }
  // 色あせたカーニバル柄のタイルを所々に
  ctx.fillStyle = "rgba(140,40,30,0.18)";
  for (let i = 0; i < 6; i++) {
    const gx = Math.floor(Math.random() * 4) * 32;
    const gy = Math.floor(Math.random() * 4) * 32;
    ctx.fillRect(gx + 2, gy + 2, 28, 28);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 20);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeParkFenceTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 128);
  noiseFill(ctx, 128, 128, "#201c22", 6);
  // 色あせた赤白ストライプの看板パネル
  ctx.save();
  ctx.translate(64, 64);
  ctx.rotate(Math.PI / 4);
  for (let x = -160; x < 160; x += 24) {
    ctx.fillStyle = Math.floor(x / 24) % 2 === 0 ? "rgba(130,30,30,0.35)" : "rgba(180,170,150,0.12)";
    ctx.fillRect(x, -160, 12, 320);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(10,8,10,0.6)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 124);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 錆びたトタン板のテクスチャ（骨組みフェンスに残る波板の破片用） */
export function makeRustMetalTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 128);
  noiseFill(ctx, 128, 128, "#7a6248", 14);
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const r = 4 + Math.random() * 14;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(190,95,40,0.65)");
    grad.addColorStop(1, "rgba(190,95,40,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(10,8,6,0.4)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 128; x += 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  for (let i = 0; i < 4; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    ctx.beginPath();
    ctx.ellipse(x, y, 4 + Math.random() * 7, 3 + Math.random() * 5, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 骨組みだけの錆びたフェンス。支柱+横桟+斜めブレースのみで構成し、
 * 波板は一部だけ残して大半は欠落させることで、隙間から奥の暗闇が見える
 * 廃墟らしい見た目にする。ローカルZ方向に伸び、呼び出し側で位置/回転を設定する。
 */
export function buildRustedFenceWall(length: number, height: number, rustTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  // 暗い通路でも骨組みだと視認できるよう、やや明るめの錆色+高めの金属感にする
  const rustMat = new THREE.MeshStandardMaterial({ color: 0x9a7a54, roughness: 0.6, metalness: 0.6 });
  const rustMatDark = new THREE.MeshStandardMaterial({ color: 0x6a5038, roughness: 0.65, metalness: 0.55 });
  rustTex.wrapS = rustTex.wrapT = THREE.RepeatWrapping;
  rustTex.repeat.set(1.5, 1.5);
  const panelMat = new THREE.MeshStandardMaterial({ map: rustTex, roughness: 0.7, metalness: 0.4, side: THREE.DoubleSide });

  const postSpacing = 1.5;
  const postCount = Math.max(2, Math.round(length / postSpacing) + 1);
  const postGeo = new THREE.CylinderGeometry(0.05, 0.055, height, 8);
  for (let i = 0; i < postCount; i++) {
    const z = -length / 2 + (i / (postCount - 1)) * length;
    const post = new THREE.Mesh(postGeo, i % 3 === 0 ? rustMatDark : rustMat);
    post.position.set(0, height / 2, z);
    if (i % 7 === 3) post.rotation.z = 0.05;
    group.add(post);
  }

  const railGeo = new THREE.CylinderGeometry(0.03, 0.03, length, 6);
  for (const ry of [height * 0.22, height * 0.52, height * 0.85]) {
    const rail = new THREE.Mesh(railGeo, rustMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, ry, 0);
    group.add(rail);
  }

  const braceGeo = new THREE.CylinderGeometry(0.022, 0.022, height * 0.8, 6);
  for (let i = 1; i < postCount - 1; i += 3) {
    const z = -length / 2 + (i / (postCount - 1)) * length;
    const brace = new THREE.Mesh(braceGeo, rustMatDark);
    brace.position.set(0, height * 0.42, z);
    brace.rotation.z = 0.85;
    group.add(brace);
  }

  // 波板は半分以上を欠落させ、残った破片だけ丈もまちまちに取り付ける
  const segLen = length / (postCount - 1);
  for (let i = 0; i < postCount - 1; i++) {
    if (i % 5 === 1 || i % 5 === 2) continue;
    const z0 = -length / 2 + (i / (postCount - 1)) * length;
    const panelH = height * (i % 2 === 0 ? 0.55 : 0.34);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(segLen * 0.92, panelH), panelMat);
    panel.position.set(0.015, panelH / 2 + 0.04, z0 + segLen / 2);
    group.add(panel);
  }

  return group;
}

/** 園内に繰り返し立つ注意書き/アトラクション案内の立て看板 */
export function makeParkNoticeTexture(variant: number): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 176);
  ctx.fillStyle = "#1c3a3a";
  ctx.fillRect(0, 0, 128, 176);
  ctx.strokeStyle = "#0c1c1c";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 124, 172);

  const items: [string, string][] = [
    ["ご案内", "お手を離さずお進みください"],
    ["営業時間", "閉園後の入場は禁止です"],
    ["順路", "矢印に沿ってお進みください"],
    ["迷子注意", "はぐれた場合は係員まで"],
  ];
  const [title, body] = items[variant % items.length];

  ctx.fillStyle = "#ffd94a";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 64, 34);

  ctx.strokeStyle = "#ff8a4a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 46);
  ctx.lineTo(104, 46);
  ctx.stroke();

  ctx.fillStyle = "#cfe4e4";
  ctx.font = "11px sans-serif";
  let line = "";
  let y = 70;
  for (const ch of body) {
    line += ch;
    if (line.length >= 8) {
      ctx.fillText(line, 64, y);
      line = "";
      y += 16;
    }
  }
  if (line) ctx.fillText(line, 64, y);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 木目調の板張りテクスチャ（券売ブース・屋台カウンター・顔抜き看板の裏板等で共用） */
export function makeWoodPlankTexture(baseColor = "#6a4a2a"): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 128);
  noiseFill(ctx, 128, 128, baseColor, 10);
  ctx.strokeStyle = "rgba(20,12,4,0.5)";
  ctx.lineWidth = 2;
  for (let y = 0; y <= 128; y += 21) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(20,12,4,0.25)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 128;
    const x0 = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + 10 + Math.random() * 30, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 閉店中のシャッター風の錆びたトタン板テクスチャ */
export function makeShutterTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 96);
  noiseFill(ctx, 128, 96, "#5a5048", 10);
  ctx.strokeStyle = "rgba(20,16,12,0.5)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= 128; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 96);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(120,70,40,0.15)";
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.ellipse(Math.random() * 128, Math.random() * 96, 6 + Math.random() * 8, 3 + Math.random() * 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(10,8,6,0.6)";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 124, 92);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** メリーゴーランドの天蓋（紅白ストライプ+金の縁取り） */
export function makeCarouselCanopyTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 64);
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = (x / 32) % 2 === 0 ? "#7a1c1c" : "#ddd3b8";
    ctx.fillRect(x, 0, 32, 64);
  }
  ctx.fillStyle = "rgba(180,150,70,0.8)";
  ctx.fillRect(0, 0, 256, 6);
  ctx.fillRect(0, 58, 256, 6);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** マスコット像/着ぐるみの顔。variantで笑顔の種類を変える */
export function makeMascotFaceTexture(variant: "normal" | "wide" | "blank"): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(160, 160);
  // 円形デカールとして使うため、四隅まで肌色で塗りつぶし透明部分を作らない
  ctx.fillStyle = "#e8d8a0";
  ctx.fillRect(0, 0, 160, 160);
  ctx.strokeStyle = "#9a7a30";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(80, 80, 72, 0, Math.PI * 2);
  ctx.stroke();

  if (variant === "blank") {
    // 目鼻がなく、口だけがうっすら残っている
    ctx.strokeStyle = "#4a3a1c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(80, 98, 26, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  ctx.fillStyle = "#1a1410";
  ctx.beginPath();
  ctx.ellipse(52, 66, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(108, 66, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c03838";
  ctx.beginPath();
  ctx.ellipse(44, 94, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(116, 94, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#6a1414";
  ctx.fillStyle = "#3a0808";
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (variant === "wide") {
    // 顔からはみ出すほど不自然に大きい笑み
    ctx.moveTo(14, 100);
    ctx.quadraticCurveTo(80, 170, 146, 100);
    ctx.quadraticCurveTo(80, 140, 14, 100);
  } else {
    ctx.moveTo(40, 108);
    ctx.quadraticCurveTo(80, 136, 120, 108);
    ctx.quadraticCurveTo(80, 124, 40, 108);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (variant === "wide") {
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(26 + i * 15, 104, 8, 10);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 顔抜き看板。showFaceで穴から覗く顔を描き足す */
export function makeCutoutBoardTexture(showFace: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(160, 224);
  ctx.fillStyle = "#caa15a";
  ctx.fillRect(0, 0, 160, 224);
  // 二人並んだ陽気な着ぐるみの胴体を描く
  for (const cx of [48, 112]) {
    ctx.fillStyle = cx === 48 ? "#2a6a8a" : "#8a2a4a";
    ctx.beginPath();
    ctx.ellipse(cx, 150, 34, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8d8a0";
    ctx.beginPath();
    ctx.ellipse(cx, 92, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 顔の穴（くり抜き）
  for (const cx of [48, 112]) {
    ctx.fillStyle = showFace ? "#0a0806" : "#070504";
    ctx.beginPath();
    ctx.arc(cx, 58, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a4020";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (showFace) {
    // 右側の穴にだけ、覗く顔を描く
    ctx.fillStyle = "#1a1410";
    ctx.beginPath();
    ctx.ellipse(104, 54, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(120, 54, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#3a0808";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(98, 68);
    ctx.quadraticCurveTo(112, 80, 126, 68);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 156, 220);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 射的屋台の景品棚。anomalyで「自分の持ち物」風の景品に差し替える */
export function makePrizeShelfTexture(anomaly: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(192, 96);
  ctx.fillStyle = "#3a2c1c";
  ctx.fillRect(0, 0, 192, 96);
  ctx.fillStyle = "#5a4428";
  for (let y = 24; y < 96; y += 24) {
    ctx.fillRect(0, y, 192, 3);
  }
  const prizeColors = anomaly
    ? ["#8a8a8a", "#d8d4c4", "#4a4a4a", "#c9b9a3", "#2a2a2a", "#e8e4d8"]
    : ["#d94a4a", "#4ad9a0", "#d9c94a", "#4a7ad9", "#d94ac0", "#8ad94a"];
  let i = 0;
  for (let y = 4; y < 96; y += 24) {
    for (let x = 4; x < 192; x += 32) {
      ctx.fillStyle = prizeColors[i % prizeColors.length];
      ctx.fillRect(x, y, 22, 16);
      i++;
    }
  }
  if (anomaly) {
    // 一つだけ、プレイヤーの持ち物のようなシルエット（バッグ風）を描く
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(84, 6, 24, 14);
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    ctx.strokeRect(84, 6, 24, 14);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface TicketBoothHandle {
  group: THREE.Group;
  windowLightMat: THREE.MeshStandardMaterial;
}

/** チケットブース（閉鎖中の券売窓口。木目壁+錆びたシャッター+庇のある構造） */
export function buildTicketBooth(signTex: THREE.Texture, woodTex: THREE.Texture, shutterTex: THREE.Texture): TicketBoothHandle {
  const group = new THREE.Group();
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(2, 2);
  const bodyMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a1c1c, roughness: 0.6 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xc9b060, roughness: 0.45, metalness: 0.4 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.7), bodyMat);
  body.position.y = 0.65;

  const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.08, 0.76), trimMat);
  baseTrim.position.y = 0.04;

  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.45, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.52;

  const roofTrim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.025, 6, 4), trimMat);
  roofTrim.rotation.x = Math.PI / 2;
  roofTrim.rotation.y = Math.PI / 4;
  roofTrim.position.y = 1.3;

  // 窓枠（中が空いた縁）の奥にシャッターのパネルを置き、開口のある構造にする
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 0.5, metalness: 0.4 });
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.05), frameMat);
  fTop.position.set(0, 1.03, 0.355);
  const fBottom = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.05), frameMat);
  fBottom.position.set(0, 0.67, 0.355);
  const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.05), frameMat);
  fLeft.position.set(-0.27, 0.85, 0.355);
  const fRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.05), frameMat);
  fRight.position.set(0.27, 0.85, 0.355);

  shutterTex.wrapS = shutterTex.wrapT = THREE.RepeatWrapping;
  shutterTex.repeat.set(3, 2);
  const windowLightMat = new THREE.MeshStandardMaterial({
    map: shutterTex,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.6,
  });
  const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.33), windowLightMat);
  windowMesh.position.set(0, 0.85, 0.34);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.3), trimMat);
  counter.position.set(0, 0.52, 0.5);
  const counterFront = new THREE.Mesh(new THREE.BoxGeometry(0.93, 0.35, 0.04), bodyMat);
  counterFront.position.set(0, 0.33, 0.64);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.2), new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false }));
  sign.position.set(0, 1.18, 0.361);

  const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.28, 8);
  const postL = new THREE.Mesh(postGeo, trimMat);
  postL.position.set(-0.44, 0.65, 0.34);
  const postR = new THREE.Mesh(postGeo, trimMat);
  postR.position.set(0.44, 0.65, 0.34);

  group.add(body, baseTrim, roof, roofTrim, fTop, fBottom, fLeft, fRight, windowMesh, counter, counterFront, sign, postL, postR);
  return { group, windowLightMat };
}

/** メリーゴーランドの馬（鞍・たてがみ付きの丸みのある形状） */
export function buildCarouselHorse(colorHex: number): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.45, metalness: 0.15 });
  const saddleMat = new THREE.MeshStandardMaterial({ color: 0xd8c488, roughness: 0.6, metalness: 0.3 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xd8c488, roughness: 0.3, metalness: 0.7 });
  const maneMat = new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.8 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), poleMat);
  pole.position.y = 0.65;

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 4, 8), mat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.55;

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.18), saddleMat);
  saddle.position.set(0, 0.63, 0);

  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.18, 4, 8), mat);
  neck.position.set(0, 0.74, 0.17);
  neck.rotation.x = -0.6;

  const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 8), mat);
  head.position.set(0, 0.89, 0.31);
  head.rotation.x = -0.3;

  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.24, 0.16), maneMat);
  mane.position.set(0, 0.79, 0.09);
  mane.rotation.x = -0.5;

  const earGeo = new THREE.ConeGeometry(0.02, 0.05, 6);
  const earL = new THREE.Mesh(earGeo, mat);
  earL.position.set(-0.03, 0.96, 0.26);
  const earR = new THREE.Mesh(earGeo, mat);
  earR.position.set(0.03, 0.96, 0.26);

  const legGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.3, 6);
  const legPositions: [number, number][] = [
    [-0.06, 0.18],
    [0.06, 0.18],
    [-0.06, -0.16],
    [0.06, -0.16],
  ];
  for (const [lx, lz] of legPositions) {
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.set(lx, 0.4, lz);
    leg.rotation.x = lz > 0 ? 0.35 : -0.35;
    group.add(leg);
  }
  group.add(pole, body, saddle, neck, head, mane, earL, earR);
  return group;
}

export interface CarouselHandle {
  group: THREE.Group;
  horses: THREE.Group[];
}

/** メリーゴーランド本体。horsesを個別に回転/差し替えできるよう返す */
export function buildCarousel(radius: number, horseCount: number, canopyTex: THREE.Texture, baseTex: THREE.Texture): CarouselHandle {
  const group = new THREE.Group();
  baseTex.wrapS = baseTex.wrapT = THREE.RepeatWrapping;
  baseTex.repeat.set(4, 4);
  const baseMat = new THREE.MeshStandardMaterial({ map: baseTex, roughness: 0.8 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.12, 24), baseMat);
  base.position.y = 0.06;
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xc9b060, roughness: 0.4, metalness: 0.5 });
  const baseRim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.025, 6, 24), trimMat);
  baseRim.rotation.x = Math.PI / 2;
  baseRim.position.y = 0.12;
  const centerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.9, 10), trimMat);
  centerPole.position.y = 1.0;
  canopyTex.repeat.set(6, 1);
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(radius + 0.3, 0.8, 20, 1, true),
    new THREE.MeshStandardMaterial({ map: canopyTex, roughness: 0.7, side: THREE.DoubleSide })
  );
  canopy.position.y = 2.3;
  const supportRing = new THREE.Mesh(
    new THREE.TorusGeometry(radius + 0.26, 0.02, 6, 24),
    new THREE.MeshStandardMaterial({ color: 0x8a7a50, roughness: 0.5, metalness: 0.5 })
  );
  supportRing.rotation.x = Math.PI / 2;
  supportRing.position.y = 1.9;
  group.add(base, baseRim, centerPole, canopy, supportRing);

  // 天蓋の縁に垂れる三角ペナント
  const pennantColors = [0xffd94a, 0x7a1c1c];
  const pennantCount = 16;
  for (let i = 0; i < pennantCount; i++) {
    const a = (i / pennantCount) * Math.PI * 2;
    const pennant = new THREE.Mesh(
      new THREE.ConeGeometry(0.045, 0.09, 3),
      new THREE.MeshStandardMaterial({ color: pennantColors[i % 2], roughness: 0.6 })
    );
    pennant.rotation.x = Math.PI;
    pennant.rotation.y = a;
    pennant.position.set(Math.sin(a) * (radius + 0.3), 1.95, Math.cos(a) * (radius + 0.3));
    group.add(pennant);
  }

  // 電飾の電球
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd98a, emissiveIntensity: 1.8, roughness: 0.4 });
  const bulbCount = 16;
  for (let i = 0; i < bulbCount; i++) {
    const a = (i / bulbCount) * Math.PI * 2 + Math.PI / bulbCount;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), bulbMat);
    bulb.position.set(Math.sin(a) * (radius + 0.27), 1.9, Math.cos(a) * (radius + 0.27));
    group.add(bulb);
  }

  const horseColors = [0xd94a4a, 0xffffff, 0x4a7ad9, 0xd9c94a];
  const horses: THREE.Group[] = [];
  for (let i = 0; i < horseCount; i++) {
    const a = (i / horseCount) * Math.PI * 2;
    const horse = buildCarouselHorse(horseColors[i % horseColors.length]);
    horse.position.set(Math.sin(a) * (radius - 0.35), 0.1, Math.cos(a) * (radius - 0.35));
    horse.rotation.y = a;
    group.add(horse);
    horses.push(horse);
  }
  return { group, horses };
}

export interface CutoutBoardHandle {
  group: THREE.Group;
  faceMat: THREE.MeshBasicMaterial;
}

/** 顔抜き看板。faceMatのmapを差し替えて「覗く顔」異変を表現する */
export function buildCutoutBoard(initialTex: THREE.Texture, woodTex: THREE.Texture): CutoutBoardHandle {
  const group = new THREE.Group();
  const faceMat = new THREE.MeshBasicMaterial({ map: initialTex, toneMapped: false });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.12), faceMat);
  board.position.set(0, 0.95, 0.021);
  // ベニヤ板らしい厚みを持たせる裏板
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(2, 3);
  const backing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.12, 0.04), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 }));
  backing.position.set(0, 0.95, 0);
  const standMat = new THREE.MeshStandardMaterial({ color: 0x3a2c1c, roughness: 0.9 });
  const standL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 0.06), standMat);
  standL.position.set(-0.3, 0.48, -0.08);
  const standR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 0.06), standMat);
  standR.position.set(0.3, 0.48, -0.08);
  group.add(backing, board, standL, standR);
  return { group, faceMat };
}

export interface MascotStatueHandle {
  group: THREE.Group;
  headPivot: THREE.Object3D;
  faceMat: THREE.MeshBasicMaterial;
}

/** マスコット像。headPivotで視線を追わせ、faceMatで笑みの種類を差し替えられる */
export function buildMascotStatue(initialFaceTex: THREE.Texture): MascotStatueHandle {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd94a6a, roughness: 0.55 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xf2d9b0, roughness: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.12, 14), new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.9 }));
  base.position.y = 0.06;

  const footMat = new THREE.MeshStandardMaterial({ color: 0xffd94a, roughness: 0.55 });
  const footGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.14, 10);
  const footL = new THREE.Mesh(footGeo, footMat);
  footL.position.set(-0.1, 0.19, 0.04);
  const footR = new THREE.Mesh(footGeo, footMat);
  footR.position.set(0.1, 0.19, 0.04);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 8, 14), bodyMat);
  body.position.y = 0.72;

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), bellyMat);
  belly.position.set(0, 0.67, 0.13);
  belly.scale.set(1, 1.1, 0.65);

  const armGeo = new THREE.CapsuleGeometry(0.06, 0.38, 4, 8);
  const armL = new THREE.Mesh(armGeo, bodyMat);
  armL.position.set(-0.27, 0.84, 0.03);
  armL.rotation.z = 0.5;
  const armR = new THREE.Mesh(armGeo, bodyMat);
  armR.position.set(0.27, 0.84, 0.03);
  armR.rotation.z = -0.5;
  const handGeo = new THREE.SphereGeometry(0.07, 10, 8);
  const handL = new THREE.Mesh(handGeo, bellyMat);
  handL.position.set(-0.4, 0.63, 0.03);
  const handR = new THREE.Mesh(handGeo, bellyMat);
  handR.position.set(0.4, 0.63, 0.03);

  const bowtieMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 });
  const bowtieL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.08, 4), bowtieMat);
  bowtieL.rotation.z = Math.PI / 2;
  bowtieL.position.set(-0.05, 1.06, 0.2);
  const bowtieR = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.08, 4), bowtieMat);
  bowtieR.rotation.z = -Math.PI / 2;
  bowtieR.position.set(0.05, 1.06, 0.2);
  const bowtieKnot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), bowtieMat);
  bowtieKnot.position.set(0, 1.06, 0.2);

  const headPivot = new THREE.Object3D();
  headPivot.position.y = 1.32;
  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 16), new THREE.MeshStandardMaterial({ color: 0xe8d8a0, roughness: 0.6 }));
  const faceMat = new THREE.MeshBasicMaterial({ map: initialFaceTex, toneMapped: false });
  const facePlane = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), faceMat);
  facePlane.position.z = 0.245;
  const earGeo = new THREE.SphereGeometry(0.08, 10, 8);
  const earL = new THREE.Mesh(earGeo, bodyMat);
  earL.position.set(-0.26, 0.1, 0);
  const earR = earL.clone();
  earR.position.x = 0.26;
  headPivot.add(headSphere, facePlane, earL, earR);

  group.add(base, footL, footR, body, belly, armL, armR, handL, handR, bowtieL, bowtieR, bowtieKnot, headPivot);
  return { group, headPivot, faceMat };
}

export interface BalloonCartHandle {
  group: THREE.Group;
  balloonMats: THREE.MeshStandardMaterial[];
}

/** 風船売り場のカート。balloonMatsの色を差し替えて異変を表現する */
export function buildBalloonCart(cartTex: THREE.Texture, canopyTex: THREE.Texture, signTex: THREE.Texture): BalloonCartHandle {
  const group = new THREE.Group();
  cartTex.wrapS = cartTex.wrapT = THREE.RepeatWrapping;
  cartTex.repeat.set(2, 1);
  const cartMat = new THREE.MeshStandardMaterial({ map: cartTex, roughness: 0.8 });
  const cart = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.35), cartMat);
  cart.position.y = 0.3;
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd8c488, roughness: 0.4, metalness: 0.3 });
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.04, 0.39), trimMat);
  trim.position.y = 0.53;
  const wheelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  for (const wx of [-0.22, 0.22]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.1, 0);
    group.add(wheel);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.4 }));
  pole.position.set(0, 0.95, 0);

  // 日よけの小さな屋根
  canopyTex.wrapS = THREE.RepeatWrapping;
  canopyTex.repeat.set(4, 1);
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 0.22, 10),
    new THREE.MeshStandardMaterial({ map: canopyTex, roughness: 0.7, side: THREE.DoubleSide })
  );
  canopy.position.y = 1.5;

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false }));
  sign.position.set(0, 0.43, 0.18);

  const balloonColors = [0xd94a4a, 0xffd94a, 0x4a9ad9, 0x8ad94a, 0xd94ac0];
  const balloonMats: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshStandardMaterial({ color: balloonColors[i], roughness: 0.15, metalness: 0.05 });
    const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), mat);
    const a = (i / 5) * Math.PI * 2;
    balloon.position.set(Math.sin(a) * 0.14, 1.35 + Math.cos(a * 2) * 0.05, Math.cos(a) * 0.14);
    group.add(balloon);
    balloonMats.push(mat);
  }
  group.add(cart, trim, canopy, sign, pole);
  return { group, balloonMats };
}

/** 観覧車のシルエット。group.rotation.zを回すと異変「動く観覧車」になる */
export function buildFerrisWheel(radius: number, gondolaCount: number): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.65, metalness: 0.45 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.06, 8, 32), metalMat);
  const innerRim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, 0.035, 6, 32), metalMat);
  group.add(rim, innerRim);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, radius * 2, 6), metalMat);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = a;
    group.add(spoke);
  }
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
  const winMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, emissive: 0xffcf8a, emissiveIntensity: 0.9, roughness: 0.3 });
  for (let i = 0; i < gondolaCount; i++) {
    const a = (i / gondolaCount) * Math.PI * 2;
    const gondola = new THREE.Group();
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.15, 0.15), cabinMat);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.02, 0.17), metalMat);
    roof.position.y = 0.085;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.08), winMat);
    win.position.z = 0.076;
    gondola.add(cabin, roof, win);
    gondola.position.set(Math.sin(a) * radius, Math.cos(a) * radius, 0);
    group.add(gondola);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), metalMat);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);
  const legLen = radius * 1.3;
  const legPositions = [-radius * 0.55, radius * 0.55];
  for (const lx of legPositions) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, legLen, 6), metalMat);
    leg.position.set(lx, -radius * 0.1, -0.3);
    leg.rotation.z = lx > 0 ? -0.35 : 0.35;
    group.add(leg);
  }
  const tieBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, legPositions[1] - legPositions[0], 6), metalMat);
  tieBar.rotation.z = Math.PI / 2;
  tieBar.position.set(0, -radius * 0.85, -0.3);
  group.add(tieBar);
  return group;
}

const MASCOT_COSTUME_COLORS: HumanoidColors = { skin: 0xe8d8a0, outfit: 0xd94a6a, legs: 0x4a3a28 };

export interface MascotCostumeHandle {
  group: THREE.Group;
  faceMat: THREE.MeshBasicMaterial;
}

/** 着ぐるみボス。顔はマスコット像と同じ「笑っているもの」であることを示す */
export function buildMascotCostumeFigure(faceTex: THREE.Texture): MascotCostumeHandle {
  const group = buildHumanoidFigure(MASCOT_COSTUME_COLORS);
  const faceMat = new THREE.MeshBasicMaterial({ map: faceTex, toneMapped: false });
  const bigHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), new THREE.MeshStandardMaterial({ color: 0xe8d8a0, roughness: 0.6 }));
  bigHead.position.y = 1.65;
  const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), faceMat);
  facePlane.position.set(0, 1.65, 0.2);
  group.add(bigHead, facePlane);
  return { group, faceMat };
}

// ============================================================
// STAGE08「廃村」用テクスチャ・小道具
// ============================================================

export function makeVillagePathTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 128);
  noiseFill(ctx, 128, 128, "#453a2c", 10);
  ctx.fillStyle = "rgba(30,24,16,0.3)";
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    ctx.beginPath();
    ctx.ellipse(x, y, 3 + Math.random() * 6, 2 + Math.random() * 4, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // 荷車の轍
  ctx.strokeStyle = "rgba(60,50,36,0.35)";
  ctx.lineWidth = 4;
  for (const x of [40, 88]) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 128);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 20);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 茅葺き屋根風のテクスチャ */
export function makeVillageRoofTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(128, 128);
  noiseFill(ctx, 128, 128, "#3a3226", 10);
  ctx.strokeStyle = "rgba(20,16,10,0.5)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 128; x += 3) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 6, 128);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(10,8,4,0.4)";
  ctx.lineWidth = 3;
  for (let y = 16; y < 128; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(128, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 家の窓。withFaceで暗闇の奥に蒼白い顔が覗く異変を描き足す */
export function makeVillageWindowTexture(withFace: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(96, 96);
  const grad = ctx.createLinearGradient(0, 0, 0, 96);
  grad.addColorStop(0, "#07080c");
  grad.addColorStop(1, "#111018");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 96, 96);
  if (withFace) {
    ctx.fillStyle = "#d8d4c8";
    ctx.beginPath();
    ctx.ellipse(48, 50, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#15131a";
    ctx.beginPath();
    ctx.ellipse(41, 46, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(55, 46, 2.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#15131a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(42, 58);
    ctx.lineTo(54, 58);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface VillageHouseHandle {
  group: THREE.Group;
  windowMat: THREE.MeshBasicMaterial;
}

/** 廃屋。windowMatのmapを差し替えると窓の奥に顔が覗く異変になる */
export function buildVillageHouse(wallTex: THREE.Texture, roofTex: THREE.Texture, windowTex: THREE.Texture): VillageHouseHandle {
  const group = new THREE.Group();
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.repeat.set(2, 1.6);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88 });
  const width = 1.15;
  const depth = 0.9;
  const wallHeight = 1.3;

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, wallHeight, depth), wallMat);
  body.position.y = wallHeight / 2;

  roofTex.wrapS = roofTex.wrapT = THREE.RepeatWrapping;
  roofTex.repeat.set(2, 2);
  const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.92 });
  const rise = 0.42;
  const slopeLen = Math.sqrt((width / 2) ** 2 + rise ** 2) + 0.06;
  const riseAngle = Math.atan2(rise, width / 2);
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.05, depth + 0.18), roofMat);
  roofL.position.set(-width / 4, wallHeight + rise / 2, 0);
  roofL.rotation.z = riseAngle;
  const roofR = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.05, depth + 0.18), roofMat);
  roofR.position.set(width / 4, wallHeight + rise / 2, 0);
  roofR.rotation.z = -riseAngle;
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, depth + 0.18), roofMat);
  ridge.position.set(0, wallHeight + rise, 0);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a130c, roughness: 0.8 });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.58), doorMat);
  door.position.set(-0.26, 0.29, depth / 2 + 0.005);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x201810, roughness: 0.6 });
  const winW = 0.3;
  const winH = 0.3;
  const winY = wallHeight * 0.62;
  const winX = 0.26;
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.04, 0.03, 0.03), frameMat);
  fTop.position.set(winX, winY + winH / 2, depth / 2);
  const fBottom = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.04, 0.03, 0.03), frameMat);
  fBottom.position.set(winX, winY - winH / 2, depth / 2);
  const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, winH, 0.03), frameMat);
  fLeft.position.set(winX - winW / 2, winY, depth / 2);
  const fRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, winH, 0.03), frameMat);
  fRight.position.set(winX + winW / 2, winY, depth / 2);

  const windowMat = new THREE.MeshBasicMaterial({ map: windowTex, toneMapped: false });
  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), windowMat);
  windowGlass.position.set(winX, winY, depth / 2 + 0.002);

  group.add(body, roofL, roofR, ridge, door, fTop, fBottom, fLeft, fRight, windowGlass);
  return { group, windowMat };
}

/**
 * 骨組み+一部だけ板が残った朽ちた木塀。STAGE07の錆びたフェンスと同じ思想で、
 * 隙間から奥の暗闇が見える廃村らしい境界にする。ローカルZ方向に伸びる。
 */
export function buildWoodenFenceWall(length: number, height: number, woodTex: THREE.Texture): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a7050, roughness: 0.85 });
  const woodMatDark = new THREE.MeshStandardMaterial({ color: 0x5a4832, roughness: 0.9 });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(1, 2);
  const slatMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9, side: THREE.DoubleSide });

  const postSpacing = 1.3;
  const postCount = Math.max(2, Math.round(length / postSpacing) + 1);
  const postGeo = new THREE.BoxGeometry(0.08, height, 0.08);
  for (let i = 0; i < postCount; i++) {
    const z = -length / 2 + (i / (postCount - 1)) * length;
    const post = new THREE.Mesh(postGeo, i % 4 === 0 ? woodMatDark : woodMat);
    post.position.set(0, height / 2, z);
    if (i % 6 === 2) post.rotation.z = 0.07;
    group.add(post);
  }

  const railGeo = new THREE.BoxGeometry(0.04, 0.05, length);
  for (const ry of [height * 0.3, height * 0.75]) {
    const rail = new THREE.Mesh(railGeo, woodMat);
    rail.position.set(0, ry, 0);
    group.add(rail);
  }

  const segLen = length / (postCount - 1);
  for (let i = 0; i < postCount - 1; i++) {
    if (i % 4 === 2) continue;
    const z0 = -length / 2 + (i / (postCount - 1)) * length;
    const slatH = height * (i % 3 === 0 ? 0.7 : 0.88);
    const slat = new THREE.Mesh(new THREE.PlaneGeometry(segLen * 0.85, slatH), slatMat);
    slat.position.set(0.012, slatH / 2 + 0.03, z0 + segLen / 2);
    group.add(slat);
  }

  return group;
}

/** 井戸（石組みの輪+小さな屋根） */
export function buildWell(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6a665c, roughness: 0.9 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.4, 14), stoneMat);
  rim.position.y = 0.2;
  const rimTop = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 6, 16), stoneMat);
  rimTop.rotation.x = Math.PI / 2;
  rimTop.position.y = 0.4;
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.85 });
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), woodMat);
  postL.position.set(-0.28, 0.65, 0);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), woodMat);
  postR.position.set(0.28, 0.65, 0);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.66, 6), woodMat);
  beam.rotation.z = Math.PI / 2;
  beam.position.set(0, 1.08, 0);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.26, 4), new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.9 }));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.25;
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.1, 8), woodMat);
  bucket.position.y = 0.85;
  group.add(rim, rimTop, postL, postR, beam, roof, bucket);
  return group;
}

/** 地蔵（丸みのある石像+赤い前掛け） */
export function buildJizoStatue(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8678, roughness: 0.9 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.06, 12), stoneMat);
  base.position.y = 0.03;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.32, 6, 10), stoneMat);
  body.position.y = 0.3;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 12), stoneMat);
  head.position.y = 0.52;
  const bibMat = new THREE.MeshStandardMaterial({ color: 0x9a2a2a, roughness: 0.8 });
  const bib = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 10), bibMat);
  bib.position.y = 0.36;
  group.add(base, body, head, bib);
  return group;
}

/** 案山子の顔。showFaceで布袋に粗く描かれた顔が浮かび上がる異変になる */
export function makeScarecrowFaceTexture(showFace: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(96, 96);
  noiseFill(ctx, 96, 96, "#cfc49e", 10);
  ctx.strokeStyle = "rgba(90,80,50,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 92, 92);
  if (showFace) {
    ctx.strokeStyle = "#2a2018";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(28, 38);
    ctx.lineTo(40, 48);
    ctx.moveTo(40, 38);
    ctx.lineTo(28, 48);
    ctx.moveTo(56, 38);
    ctx.lineTo(68, 48);
    ctx.moveTo(68, 38);
    ctx.lineTo(56, 48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(30, 68);
    ctx.quadraticCurveTo(48, 54, 66, 68);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface ScarecrowHandle {
  group: THREE.Group;
  faceMat: THREE.MeshBasicMaterial;
}

/** 案山子。faceMatのmapを差し替えて「顔が浮かび上がる」異変を表現する */
export function buildScarecrow(initialFaceTex: THREE.Texture): ScarecrowHandle {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a4428, roughness: 0.9 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.3, 6), woodMat);
  post.position.y = 0.65;
  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), woodMat);
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position.y = 1.0;

  const strawMat = new THREE.MeshStandardMaterial({ color: 0xc9a84a, roughness: 1 });
  const bodyStraw = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.55, 8), strawMat);
  bodyStraw.position.y = 0.75;
  const sackMat = new THREE.MeshStandardMaterial({ color: 0xcfc49e, roughness: 0.95 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), sackMat);
  head.position.y = 1.15;

  const faceMat = new THREE.MeshBasicMaterial({ map: initialFaceTex, toneMapped: false });
  const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), faceMat);
  facePlane.position.set(0, 1.15, 0.11);

  const sleeveMat = strawMat;
  const sleeveGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.4, 6);
  const sleeveL = new THREE.Mesh(sleeveGeo, sleeveMat);
  sleeveL.position.set(-0.32, 0.98, 0);
  sleeveL.rotation.z = 0.3;
  const sleeveR = new THREE.Mesh(sleeveGeo, sleeveMat);
  sleeveR.position.set(0.32, 0.98, 0);
  sleeveR.rotation.z = -0.3;

  group.add(post, crossbar, bodyStraw, head, facePlane, sleeveL, sleeveR);
  return { group, faceMat };
}

/** 布に浮かぶ人影。withShadowで洗濯物の奥に人影が透ける異変を描き足す */
export function makeLaundrySheetTexture(withShadow: boolean): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(96, 128);
  ctx.fillStyle = "#d8d4c4";
  ctx.fillRect(0, 0, 96, 128);
  ctx.strokeStyle = "rgba(160,156,140,0.5)";
  ctx.lineWidth = 2;
  for (let y = 10; y < 128; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(96, y + 4);
    ctx.stroke();
  }
  if (withShadow) {
    ctx.fillStyle = "rgba(20,18,16,0.55)";
    ctx.beginPath();
    ctx.ellipse(48, 42, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(26, 120);
    ctx.lineTo(34, 60);
    ctx.lineTo(62, 60);
    ctx.lineTo(70, 120);
    ctx.closePath();
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface LaundryLineHandle {
  group: THREE.Group;
  sheetMat: THREE.MeshBasicMaterial;
}

/** 物干し竿。sheetMatのmapを差し替えて「人影が透ける」異変を表現する */
export function buildLaundryLine(initialSheetTex: THREE.Texture): LaundryLineHandle {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.5 });
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6), poleMat);
  poleL.position.set(-0.55, 0.7, 0);
  const poleR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 6), poleMat);
  poleR.position.set(0.55, 0.7, 0);
  const lineMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.4 });
  const line = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.1, 6), lineMat);
  line.rotation.z = Math.PI / 2;
  line.position.set(0, 1.35, 0);

  const plainSheetMat = new THREE.MeshBasicMaterial({ color: 0xe8e4d4, toneMapped: false, side: THREE.DoubleSide });
  const sheetA = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), plainSheetMat);
  sheetA.position.set(-0.35, 1.0, 0);
  const sheetC = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.4), plainSheetMat.clone());
  sheetC.position.set(0.35, 1.05, 0);

  const sheetMat = new THREE.MeshBasicMaterial({ map: initialSheetTex, toneMapped: false, side: THREE.DoubleSide });
  const sheetB = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.5), sheetMat);
  sheetB.position.set(0, 1.0, 0);

  group.add(poleL, poleR, line, sheetA, sheetB, sheetC);
  return { group, sheetMat };
}

/** 村の掲示板。variantで通常の張り紙/「あなたの写真」が貼られた異変を切り替える */
export function makeVillageBulletinTexture(variant: "normal" | "photo"): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(160, 112);
  ctx.fillStyle = "#4a3a28";
  ctx.fillRect(0, 0, 160, 112);
  ctx.strokeStyle = "#241a10";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 156, 108);

  if (variant === "normal") {
    const notices = [
      ["寄り合いのお知らせ", "今夜、集会所にて"],
      ["害獣注意", "日没後の外出は控えること"],
      ["道普請", "村総出にて行う"],
    ];
    let y = 14;
    for (const [title, body] of notices) {
      ctx.fillStyle = "#e8e0c8";
      ctx.fillRect(10, y, 140, 28);
      ctx.fillStyle = "#1c1810";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(title, 14, y + 12);
      ctx.font = "9px sans-serif";
      ctx.fillText(body, 14, y + 23);
      y += 34;
    }
  } else {
    ctx.fillStyle = "#e8e0c8";
    ctx.fillRect(44, 12, 72, 88);
    ctx.fillStyle = "#15131a";
    ctx.fillRect(50, 18, 60, 60);
    // 粗いシルエットの肖像（プレイヤー自身を思わせる）
    ctx.fillStyle = "#c9b9a3";
    ctx.beginPath();
    ctx.ellipse(80, 40, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(62, 78);
    ctx.lineTo(68, 52);
    ctx.lineTo(92, 52);
    ctx.lineTo(98, 78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2a2018";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("おかえりなさい", 80, 92);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface VillageBulletinHandle {
  group: THREE.Group;
  boardMat: THREE.MeshBasicMaterial;
}

/** 村の掲示板。boardMatのmapを差し替えて張り紙の異変を表現する */
export function buildVillageBulletinBoard(initialTex: THREE.Texture): VillageBulletinHandle {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a2c1c, roughness: 0.85 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.5, 0.04), frameMat);
  frame.position.y = 1.0;
  const boardMat = new THREE.MeshBasicMaterial({ map: initialTex, toneMapped: false });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.42), boardMat);
  board.position.set(0, 1.0, 0.023);
  const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6);
  const postL = new THREE.Mesh(postGeo, frameMat);
  postL.position.set(-0.28, 0.5, 0);
  const postR = new THREE.Mesh(postGeo, frameMat);
  postR.position.set(0.28, 0.5, 0);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.05, 0.2), frameMat);
  roof.position.set(0, 1.27, 0);
  group.add(frame, board, postL, postR, roof);
  return { group, boardMat };
}

export interface VillageBellHandle {
  group: THREE.Group;
  ropePivot: THREE.Object3D;
}

/** 村はずれの鐘楼。ropePivotを揺らすと「鐘が鳴る」異変の演出になる */
export function buildVillageBell(): VillageBellHandle {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3828, roughness: 0.88 });
  const postPositions: [number, number][] = [
    [-0.32, -0.22],
    [0.32, -0.22],
    [-0.32, 0.22],
    [0.32, 0.22],
  ];
  for (const [px, pz] of postPositions) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.8, 6), woodMat);
    post.position.set(px, 0.9, pz);
    group.add(post);
  }
  const beamGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.64, 6);
  const beamZ = new THREE.Mesh(beamGeo, woodMat);
  beamZ.rotation.x = Math.PI / 2;
  beamZ.position.set(-0.32, 1.78, 0);
  const beamZ2 = beamZ.clone();
  beamZ2.position.x = 0.32;
  const beamX = new THREE.Mesh(beamGeo, woodMat);
  beamX.rotation.z = Math.PI / 2;
  beamX.position.set(0, 1.78, -0.22);
  const beamX2 = beamX.clone();
  beamX2.position.z = 0.22;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.3, 4), new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.9 }));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 2.0;

  const ropePivot = new THREE.Object3D();
  ropePivot.position.set(0, 1.76, 0);
  const bellMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.4, metalness: 0.6 });
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.3, 12), bellMat);
  bell.position.y = -0.2;
  ropePivot.add(bell);

  group.add(beamZ, beamZ2, beamX, beamX2, roof, ropePivot);
  return { group, ropePivot };
}

export interface PaperLanternHandle {
  group: THREE.Group;
  lampMat: THREE.MeshStandardMaterial;
  light: THREE.PointLight;
}

/** 吊り提灯。lampMatのemissiveを差し替えると色の異変になる */
export function buildPaperLantern(): PaperLanternHandle {
  const group = new THREE.Group();
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xf0d8a0, emissive: 0xffb347, emissiveIntensity: 1.1, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), lampMat);
  body.scale.y = 1.2;
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.7 });
  for (let i = 0; i < 4; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.004, 4, 16), ribMat);
    rib.rotation.y = (i / 4) * Math.PI;
    group.add(rib);
  }
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.04, 8), ribMat);
  capTop.position.y = 0.17;
  const capBottom = capTop.clone();
  capBottom.position.y = -0.17;
  const light = new THREE.PointLight(0xffb347, 1.2, 2.4, 2);
  light.position.set(0, 0, 0);
  group.add(body, capTop, capBottom, light);
  return { group, lampMat, light };
}

const VILLAGER_COLORS: HumanoidColors = { skin: 0xc9b9a3, outfit: 0x3a4436, legs: 0x2a2822 };

/** 村人風の人影（STAGE08用） */
export function buildVillagerFigure(): THREE.Group {
  return buildHumanoidFigure(VILLAGER_COLORS);
}

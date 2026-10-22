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

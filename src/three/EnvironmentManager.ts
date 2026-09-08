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

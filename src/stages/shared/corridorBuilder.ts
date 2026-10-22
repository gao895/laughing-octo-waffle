import * as THREE from "three";
import type { CorridorBounds } from "../../game/PlayerController";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";

/**
 * 各ステージ共通の「可変幅の一本道ループ」構造を組み立てるための共有ヘルパー。
 * 床・天井・壁のセグメント生成、天井灯の配置、出口扉/看板といった
 * ステージ間で繰り返す部分をここに集約し、各stageXX/build.tsは
 * 独自の小道具・異変ロジックにのみ専念できるようにする。
 */

export interface CorridorShellParams {
  zMin: number;
  zMax: number;
  halfWidthAt: (z: number) => number;
  wallMat: THREE.Material;
  floorMat: THREE.Material;
  ceilMat: THREE.Material;
  ceilingHeight?: number;
  segmentLength?: number;
}

export function buildCorridorShell(params: CorridorShellParams): { group: THREE.Group; bounds: CorridorBounds } {
  const { zMin, zMax, halfWidthAt, wallMat, floorMat, ceilMat } = params;
  const ceilingHeight = params.ceilingHeight ?? 2.6;
  const segmentLength = params.segmentLength ?? 1;
  const group = new THREE.Group();

  for (let z = zMin; z < zMax; z += segmentLength) {
    const centerZ = z + segmentLength / 2;
    const hw = halfWidthAt(centerZ);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.1, segmentLength + 0.02), floorMat);
    floor.position.set(0, -0.05, centerZ);
    floor.receiveShadow = true;

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.1, segmentLength + 0.02), ceilMat);
    ceiling.position.set(0, ceilingHeight, centerZ);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, ceilingHeight, segmentLength + 0.02), wallMat);
    leftWall.position.set(-hw - 0.075, ceilingHeight / 2, centerZ);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, ceilingHeight, segmentLength + 0.02), wallMat);
    rightWall.position.set(hw + 0.075, ceilingHeight / 2, centerZ);

    group.add(floor, ceiling, leftWall, rightWall);
  }

  const bounds: CorridorBounds = {
    halfWidthAt,
    minZ: zMin + 0.5,
    maxZ: zMax - 0.5,
    centerX: 0,
  };

  return { group, bounds };
}

export function addCorridorLights(
  scene: THREE.Scene,
  lighting: LightingManager,
  zs: number[],
  y = 2.3,
  intensity = 5.5,
  color?: number
): CorridorLight[] {
  return zs.map((z) => lighting.addCorridorLight(scene, new THREE.Vector3(0, y, z), intensity, color));
}

export interface DoorAndSign {
  doorFrame: THREE.Mesh;
  signPlane: THREE.Mesh;
  signMat: THREE.MeshBasicMaterial;
}

/** 出口扉＋看板（テクスチャは呼び出し側で用意して渡す＝異変での差し替えに対応） */
export function buildDoorAndSign(doorZ: number, initialTexture: THREE.Texture, doorColor = 0x3a2f26): DoorAndSign {
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.2, 0.12),
    new THREE.MeshStandardMaterial({ color: doorColor, roughness: 0.6 })
  );
  doorFrame.position.set(0, 1.1, doorZ - 0.3);

  const signMat = new THREE.MeshBasicMaterial({ map: initialTexture, toneMapped: false });
  const signPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), signMat);
  signPlane.position.set(0, 2.35, doorZ - 0.36);

  return { doorFrame, signPlane, signMat };
}

export function gaussianBump(z: number, center: number, sigma: number, amp: number): number {
  const d = z - center;
  return amp * Math.exp(-(d * d) / (2 * sigma * sigma));
}

export interface WallDecorParams {
  /** 開始Z座標（通常はスポーン寄りの大きい値） */
  zFrom: number;
  /** 終了Z座標（通常は扉寄りの小さい値） */
  zTo: number;
  step: number;
  width: number;
  height: number;
  y: number;
  /** 壁からの余白。既定0.03（ほぼ壁に貼り付く） */
  margin?: number;
  /** この範囲(両端含む)は固有の小道具があるため配置をスキップする */
  skipZRanges?: [number, number][];
}

/**
 * 通路の壁沿いに同じようなポスター/掲示物を繰り返し配置する。
 * 8番出口のように「毎回同じはずのもの」で画面を満たし、
 * 異変（違い）を見比べる密度を作るための共通ヘルパー。
 * textures配列を周回しながら左右交互に貼っていく。
 */
export function scatterWallDecor(
  group: THREE.Group,
  halfWidthAt: (z: number) => number,
  textures: THREE.Texture[],
  params: WallDecorParams
): THREE.Mesh[] {
  const margin = params.margin ?? 0.03;
  const meshes: THREE.Mesh[] = [];
  let side: 1 | -1 = 1;
  let texIndex = 0;

  for (let z = params.zFrom; z >= params.zTo; z -= params.step) {
    const skipped = (params.skipZRanges ?? []).some(([lo, hi]) => z >= lo && z <= hi);
    if (!skipped) {
      const hw = halfWidthAt(z);
      const mat = new THREE.MeshBasicMaterial({ map: textures[texIndex % textures.length], toneMapped: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(params.width, params.height), mat);
      if (side === 1) {
        mesh.position.set(hw - margin, params.y, z);
        mesh.rotation.y = -Math.PI / 2;
      } else {
        mesh.position.set(-(hw - margin), params.y, z);
        mesh.rotation.y = Math.PI / 2;
      }
      group.add(mesh);
      meshes.push(mesh);
      texIndex += 1;
    }
    side = side === 1 ? -1 : 1;
  }

  return meshes;
}

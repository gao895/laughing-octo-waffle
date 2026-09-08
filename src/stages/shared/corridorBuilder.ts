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

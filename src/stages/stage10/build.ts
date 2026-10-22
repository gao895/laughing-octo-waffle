import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeOtherworldWallTexture,
  makeOtherworldFloorTexture,
  makeCeilingTexture,
  makeSignTexture,
  makeConcreteTexture,
  makeHospitalWallTexture,
  makeSchoolWallTexture,
  makeHedgeWallTexture,
  makeHotelWallpaperTexture,
  makeTrainWallTexture,
  makeParkFenceTexture,
  makeVillagePathTexture,
  makeHomeWallTexture,
  buildOtherworldEntity,
  buildHumanSilhouette,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign } from "../shared/corridorBuilder";

const Z_MIN = -25.5;
const Z_MAX = 17.25;
const SPAWN_Z = 12.75;
const DOOR_Z = -24.6;
// 8番出口のような「一本道」を再現するため、異界の通路の幅は一定にする
const HALF_WIDTH = 1.3;

function halfWidthAt(_z: number): number {
  return HALF_WIDTH;
}

// ボス異変で人影がプレイヤーへ走って向かってくる演出の共通パラメータ
const BOSS_CHARGE_SPEED = 2.6;
const BOSS_CHARGE_STOP_DIST = 0.55;
const BOSS_CHARGE_FOOTSTEP_INTERVAL = 0.28;

/** 右壁(side=1)/左壁(side=-1)に置く物の向きを、通路中央を向くよう揃える */
function sideRotationY(side: 1 | -1): number {
  return side === 1 ? -Math.PI / 2 : Math.PI / 2;
}

interface MemoryPane {
  mesh: THREE.Mesh;
  tex: THREE.Texture;
}

export function buildStage10(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const wallTex = makeOtherworldWallTexture();
  wallTex.repeat.set(1, 2);
  const floorTex = makeOtherworldFloorTexture();
  const ceilTex = makeCeilingTexture();

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, metalness: 0.05 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.05 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 1 });

  // --- 通路本体 ---
  const { group, bounds } = buildCorridorShell({
    zMin: Z_MIN,
    zMax: Z_MAX,
    halfWidthAt,
    wallMat,
    floorMat,
    ceilMat,
    ceilingHeight: 2.5,
  });
  group.name = "stage10";

  // --- 疎らで冷たい明かり（通常の部屋よりも暗闇が多い） ---
  const lightZs = [11, 3, -5, -13, -20];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs, 2.3, 4.2, 0x8ab0ff);

  // --- 出口扉と看板 ---
  const signTexNormal = makeSignTexture("EXIT", "#ff2a2a");
  const { doorFrame, signPlane } = buildDoorAndSign(DOOR_Z, signTexNormal, 0x1c1a20);
  group.add(doorFrame, signPlane);

  const memoryTextures: THREE.Texture[] = [];
  const memoryPanes = new Map<string, MemoryPane>();

  /** これまでのステージの記憶が透けて見える壁の断片を1枚追加する */
  function addMemoryPane(id: string, side: 1 | -1, z: number, tex: THREE.Texture, w = 0.75, h = 1.7): void {
    memoryTextures.push(tex);
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(side === 1 ? HALF_WIDTH - 0.015 : -(HALF_WIDTH - 0.015), h / 2 + 0.05, z);
    mesh.rotation.y = sideRotationY(side);
    mesh.visible = false;
    group.add(mesh);
    memoryPanes.set(id, { mesh, tex });
  }

  const hospitalTex = makeHospitalWallTexture();
  addMemoryPane("memory_hospital", 1, 10, hospitalTex);
  const schoolTex = makeSchoolWallTexture();
  addMemoryPane("memory_school", -1, 6.5, schoolTex);
  const shrineTex = makeHedgeWallTexture();
  addMemoryPane("memory_shrine", 1, 3, shrineTex);
  const hotelTex = makeHotelWallpaperTexture();
  addMemoryPane("memory_hotel", -1, -0.5, hotelTex);
  const trainTex = makeTrainWallTexture();
  addMemoryPane("memory_train", 1, -4, trainTex);
  const parkTex = makeParkFenceTexture();
  addMemoryPane("memory_park", -1, -7.5, parkTex);
  const villageTex = makeVillagePathTexture();
  addMemoryPane("memory_village", 1, -11, villageTex);
  const homeTex = makeHomeWallTexture();
  addMemoryPane("memory_home", -1, -14.5, homeTex);

  // --- SPECIAL: 最初の記憶（地下通路+歩く自分自身） ---
  const UNDERGROUND_Z = -18;
  const undergroundTex = makeConcreteTexture("#26282e");
  addMemoryPane("memory_underground", 1, UNDERGROUND_Z, undergroundTex, 0.95, 1.9);
  const walkingSelf = buildHumanSilhouette(0x050505, 1);
  walkingSelf.scale.set(0.55, 0.55, 0.55);
  walkingSelf.position.set(HALF_WIDTH - 0.08, 0, UNDERGROUND_Z);
  walkingSelf.rotation.y = sideRotationY(1);
  walkingSelf.visible = false;
  group.add(walkingSelf);

  // --- ボス: 誰でもない誰か（z=DOOR_Z+2.4） ---
  const BOSS_Z = DOOR_Z + 2.4;
  const entity = buildOtherworldEntity();
  entity.position.set(0, 0, BOSS_Z);
  entity.visible = false;
  group.add(entity);
  // 虚無に溶け込んで見えなくならないよう、出現時だけ逆光気味に照らす
  const entityLight = new THREE.PointLight(0xaac0ff, 0, 3.5, 2);
  entityLight.position.set(0, 1.7, BOSS_Z - 0.5);
  group.add(entityLight);
  const entityBasePos = entity.position.clone();
  let entityCharging = false;
  let entityFootstepTimer = 0;

  // --- 状態管理 ---
  let heartbeatTimer = 0;
  let heartbeatActive = false;

  const runtime: StageRuntime = {
    group,
    bounds,
    spawnPosition: new THREE.Vector3(0, 0, SPAWN_Z),
    spawnYaw: 0,
    doorInteractPoint: new THREE.Vector3(0, 0, DOOR_Z + 1.4),
    startGateInteractPoint: new THREE.Vector3(0, 0, SPAWN_Z + 2.3),
    interactRadius: 1.7,

    applyAnomaly(id: string | null) {
      for (const pane of memoryPanes.values()) pane.mesh.visible = false;
      walkingSelf.visible = false;
      entity.visible = false;
      entity.position.copy(entityBasePos);
      entity.rotation.y = 0;
      entityLight.intensity = 0;
      entityLight.position.set(entityBasePos.x, 1.7, entityBasePos.z - 0.5);
      entityCharging = false;
      entityFootstepTimer = 0;
      heartbeatActive = false;
      heartbeatTimer = 0;

      if (id && memoryPanes.has(id)) {
        memoryPanes.get(id)!.mesh.visible = true;
      }

      switch (id) {
        case "memory_underground":
          walkingSelf.visible = true;
          audio.playWhisper();
          break;
        case "true_self":
          for (const pane of memoryPanes.values()) pane.mesh.visible = true;
          walkingSelf.visible = true;
          entity.visible = true;
          entityLight.intensity = 3.2;
          entityCharging = true;
          heartbeatActive = true;
          audio.playStinger();
          break;
        default:
          break;
      }
    },

    update(dt: number, playerPos: THREE.Vector3) {
      if (entityCharging) {
        const dx = playerPos.x - entity.position.x;
        const dz = playerPos.z - entity.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > BOSS_CHARGE_STOP_DIST) {
          entity.position.x += (dx / dist) * BOSS_CHARGE_SPEED * dt;
          entity.position.z += (dz / dist) * BOSS_CHARGE_SPEED * dt;
          entity.rotation.y = Math.atan2(dx, dz);
          entityLight.position.x = entity.position.x;
          entityLight.position.z = entity.position.z - 0.5;
        }
        entityFootstepTimer -= dt;
        if (entityFootstepTimer <= 0) {
          entityFootstepTimer = BOSS_CHARGE_FOOTSTEP_INTERVAL;
          audio.playFootstep();
        }
      }

      if (heartbeatActive) {
        heartbeatTimer -= dt;
        if (heartbeatTimer <= 0) {
          const interval = audio.playHeartbeat(88) ?? 0.7;
          heartbeatTimer = interval;
        }
      }
    },

    dispose() {
      wallTex.dispose();
      floorTex.dispose();
      ceilTex.dispose();
      signTexNormal.dispose();
      for (const t of memoryTextures) t.dispose();
    },
  };

  return runtime;
}

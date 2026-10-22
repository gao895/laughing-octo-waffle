import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeHomeWallTexture,
  makeWoodPlankTexture,
  makeCeilingTexture,
  makeSignTexture,
  makeArrowSignTexture,
  makeFamilyPhotoTexture,
  makeClockFaceTexture,
  makeMirrorTexture,
  makeCalendarTexture,
  makeTVStaticTexture,
  buildWallClock,
  buildEntranceShoeRack,
  buildKitchenNook,
  buildHomeDoor,
  buildDiningSet,
  buildLivingRoomNook,
  buildHomeIntruderFigure,
  type WallClockHandle,
  type EntranceShoeRackHandle,
  type KitchenNookHandle,
  type HomeDoorHandle,
  type DiningSetHandle,
  type LivingRoomNookHandle,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign, scatterWallDecor } from "../shared/corridorBuilder";

const Z_MIN = -25.5;
const Z_MAX = 16.5;
const SPAWN_Z = 12;
const DOOR_Z = -24.6;
// 8番出口のような「一本道」を再現するため、自宅の廊下の幅は一定にする
const HALF_WIDTH = 1.3;

function halfWidthAt(_z: number): number {
  return HALF_WIDTH;
}

// ボス異変で人影がプレイヤーへ走って向かってくる演出の共通パラメータ
const BOSS_CHARGE_SPEED = 2.6;
const BOSS_CHARGE_STOP_DIST = 0.55;
const BOSS_CHARGE_FOOTSTEP_INTERVAL = 0.28;

/** 右壁(side=1)/左壁(side=-1)に置く物の向きを、廊下中央を向くよう揃える */
function sideRotationY(side: 1 | -1): number {
  return side === 1 ? -Math.PI / 2 : Math.PI / 2;
}

export function buildStage09(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const wallTex = makeHomeWallTexture();
  wallTex.repeat.set(1, 2);
  const floorTex = makeWoodPlankTexture("#8a6a42");
  floorTex.repeat.set(1, 24);
  const ceilTex = makeCeilingTexture();

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0.05 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75, metalness: 0.05 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 1 });

  // --- 廊下本体 ---
  const { group, bounds } = buildCorridorShell({
    zMin: Z_MIN,
    zMax: Z_MAX,
    halfWidthAt,
    wallMat,
    floorMat,
    ceilMat,
    ceilingHeight: 2.5,
  });
  group.name = "stage09";

  // --- 室内灯 ---
  const lightZs = [9, 4.5, 0, -4.5, -9.75, -15, -21];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs, 2.3, 5, 0xfff2d8);

  // --- 玄関（出口扉）と看板 ---
  const signTexNormal = makeSignTexture("EXIT", "#ff2a2a");
  const { doorFrame, signPlane } = buildDoorAndSign(DOOR_Z, signTexNormal, 0x3a2f26);
  group.add(doorFrame, signPlane);

  // --- 玄関の靴箱（z=9, 左） ---
  const SHOE_Z = 9;
  const shoeRack: EntranceShoeRackHandle = buildEntranceShoeRack();
  shoeRack.group.position.set(-(HALF_WIDTH - 0.35), 0, SHOE_Z);
  shoeRack.group.rotation.y = sideRotationY(-1);
  group.add(shoeRack.group);

  // --- 家族写真（z=6, 右） ---
  const PHOTO_Z = 6;
  const photoTexNormal = makeFamilyPhotoTexture(false);
  const photoTexWrong = makeFamilyPhotoTexture(true);
  const photoMat = new THREE.MeshBasicMaterial({ map: photoTexNormal, toneMapped: false });
  const photoPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.33), photoMat);
  photoPlane.position.set(HALF_WIDTH - 0.03, 1.4, PHOTO_Z);
  photoPlane.rotation.y = sideRotationY(1);
  group.add(photoPlane);

  // --- 壁掛け時計（z=3, 左） ---
  const CLOCK_Z = 3;
  const clockFaceTex = makeClockFaceTexture();
  const clock: WallClockHandle = buildWallClock(clockFaceTex);
  clock.group.position.set(-(HALF_WIDTH - 0.03), 1.55, CLOCK_Z);
  clock.group.rotation.y = sideRotationY(-1);
  group.add(clock.group);

  // --- キッチンの一角（z=-1, 右） ---
  const KITCHEN_Z = -1;
  const kitchen: KitchenNookHandle = buildKitchenNook();
  kitchen.group.position.set(HALF_WIDTH - 0.5, 0, KITCHEN_Z);
  kitchen.group.rotation.y = sideRotationY(1);
  group.add(kitchen.group);

  // --- 両親の部屋のドア（z=-5, 左） ---
  const PARENTS_DOOR_Z = -5;
  const parentsDoor: HomeDoorHandle = buildHomeDoor();
  parentsDoor.group.position.set(-(HALF_WIDTH - 0.05), 0, PARENTS_DOOR_Z);
  parentsDoor.group.rotation.y = sideRotationY(-1);
  group.add(parentsDoor.group);

  // --- 浴室の鏡（z=-9, 右） ---
  const MIRROR_Z = -9;
  const mirrorTexNormal = makeMirrorTexture(false);
  const mirrorTexMessage = makeMirrorTexture(true);
  const mirrorMat = new THREE.MeshBasicMaterial({ map: mirrorTexNormal, toneMapped: false });
  const mirrorFrameMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.4, metalness: 0.6 });
  const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.03), mirrorFrameMat);
  mirrorFrame.position.set(HALF_WIDTH - 0.04, 1.4, MIRROR_Z);
  mirrorFrame.rotation.y = sideRotationY(1);
  const mirrorPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), mirrorMat);
  mirrorPlane.position.set(HALF_WIDTH - 0.055, 1.4, MIRROR_Z);
  mirrorPlane.rotation.y = sideRotationY(1);
  group.add(mirrorFrame, mirrorPlane);

  // --- 壁掛けカレンダー（z=-13, 左） ---
  const CALENDAR_Z = -13;
  const calendarTexNormal = makeCalendarTexture(false);
  const calendarTexMarked = makeCalendarTexture(true);
  const calendarMat = new THREE.MeshBasicMaterial({ map: calendarTexNormal, toneMapped: false });
  const calendarPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.34), calendarMat);
  calendarPlane.position.set(-(HALF_WIDTH - 0.03), 1.45, CALENDAR_Z);
  calendarPlane.rotation.y = sideRotationY(-1);
  group.add(calendarPlane);

  // --- ダイニングセット（z=-17, 右） ---
  const DINING_Z = -17;
  const dining: DiningSetHandle = buildDiningSet();
  dining.group.position.set(HALF_WIDTH - 0.55, 0, DINING_Z);
  dining.group.rotation.y = sideRotationY(1);
  group.add(dining.group);
  const movedChairBasePos = dining.movedChair.position.clone();
  const movedChairBaseRot = dining.movedChair.rotation.y;

  // --- リビングの一角（SPECIAL, z=-21, 左） ---
  const LIVING_Z = -21;
  const tvOffTex = makeBlankScreenTexture();
  const tvStaticTex = makeTVStaticTexture();
  const livingRoom: LivingRoomNookHandle = buildLivingRoomNook(tvOffTex);
  livingRoom.group.position.set(-(HALF_WIDTH - 0.55), 0, LIVING_Z);
  livingRoom.group.rotation.y = sideRotationY(-1);
  group.add(livingRoom.group);

  // --- ボス: 自室のドア前に立つ誰か（z=DOOR_Z+2.4） ---
  const BOSS_Z = DOOR_Z + 2.4;
  const ownDoor: HomeDoorHandle = buildHomeDoor();
  ownDoor.group.position.set(0, 0, BOSS_Z);
  group.add(ownDoor.group);
  const intruder = buildHomeIntruderFigure();
  intruder.position.set(0, 0, BOSS_Z + 0.45);
  intruder.visible = false;
  group.add(intruder);
  const intruderBasePos = intruder.position.clone();
  let intruderCharging = false;
  let intruderFootstepTimer = 0;

  // --- 廊下沿いの立て看板 ---
  const arrowTextures = [makeArrowSignTexture("right"), makeArrowSignTexture("left")];
  scatterWallDecor(group, halfWidthAt, arrowTextures, {
    zFrom: 11,
    zTo: -24.3,
    step: 5.4,
    width: 0.3,
    height: 0.15,
    y: 2.0,
    skipZRanges: [
      [8, 10],
      [5, 7],
      [2, 4],
      [-2, 0],
      [-6, -4],
      [-10, -8],
      [-14, -12],
      [-18, -16],
      [-22, -20],
    ],
  });

  // --- 状態管理 ---
  let heartbeatTimer = 0;
  let heartbeatActive = false;
  let clockTicking = true;

  const runtime: StageRuntime = {
    group,
    bounds,
    spawnPosition: new THREE.Vector3(0, 0, SPAWN_Z),
    spawnYaw: 0,
    doorInteractPoint: new THREE.Vector3(0, 0, DOOR_Z + 1.4),
    startGateInteractPoint: new THREE.Vector3(0, 0, SPAWN_Z + 2.3),
    interactRadius: 1.7,

    applyAnomaly(id: string | null) {
      shoeRack.extraShoe.visible = false;
      photoMat.map = photoTexNormal;
      photoMat.needsUpdate = true;
      clockTicking = true;
      kitchen.fridgeLightMat.emissive.set(0x000000);
      kitchen.fridgeLightMat.emissiveIntensity = 0;
      parentsDoor.lightMat.emissive.set(0x000000);
      parentsDoor.lightMat.emissiveIntensity = 0;
      mirrorMat.map = mirrorTexNormal;
      mirrorMat.needsUpdate = true;
      calendarMat.map = calendarTexNormal;
      calendarMat.needsUpdate = true;
      dining.movedChair.position.copy(movedChairBasePos);
      dining.movedChair.rotation.y = movedChairBaseRot;
      livingRoom.tvMat.map = tvOffTex;
      livingRoom.tvMat.needsUpdate = true;
      livingRoom.sittingFigure.visible = false;
      intruder.visible = false;
      intruder.position.copy(intruderBasePos);
      intruderCharging = false;
      intruderFootstepTimer = 0;
      heartbeatActive = false;
      heartbeatTimer = 0;

      switch (id) {
        case "shoe_rack_extra":
          shoeRack.extraShoe.visible = true;
          break;
        case "family_photo_face":
          photoMat.map = photoTexWrong;
          photoMat.needsUpdate = true;
          break;
        case "clock_stopped":
          clockTicking = false;
          break;
        case "fridge_light":
          kitchen.fridgeLightMat.emissive.set(0xaad4ff);
          kitchen.fridgeLightMat.emissiveIntensity = 1.4;
          break;
        case "bedroom_light_on":
          parentsDoor.lightMat.emissive.set(0xffdca0);
          parentsDoor.lightMat.emissiveIntensity = 1.2;
          break;
        case "mirror_message":
          mirrorMat.map = mirrorTexMessage;
          mirrorMat.needsUpdate = true;
          break;
        case "calendar_marked":
          calendarMat.map = calendarTexMarked;
          calendarMat.needsUpdate = true;
          break;
        case "dining_chair_moved":
          dining.movedChair.position.set(movedChairBasePos.x + 0.22, movedChairBasePos.y, movedChairBasePos.z + 0.1);
          dining.movedChair.rotation.y = movedChairBaseRot + 0.5;
          break;
        case "tv_turns_on":
          livingRoom.tvMat.map = tvStaticTex;
          livingRoom.tvMat.needsUpdate = true;
          livingRoom.sittingFigure.visible = true;
          audio.playElectricHum();
          break;
        case "someone_in_your_room":
          intruder.visible = true;
          intruderCharging = true;
          heartbeatActive = true;
          break;
        default:
          break;
      }
    },

    update(dt: number, playerPos: THREE.Vector3) {
      if (clockTicking) {
        clock.handPivot.rotation.z -= dt * 1.2;
      }

      if (intruderCharging) {
        const dx = playerPos.x - intruder.position.x;
        const dz = playerPos.z - intruder.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > BOSS_CHARGE_STOP_DIST) {
          intruder.position.x += (dx / dist) * BOSS_CHARGE_SPEED * dt;
          intruder.position.z += (dz / dist) * BOSS_CHARGE_SPEED * dt;
          intruder.rotation.y = Math.atan2(dx, dz);
        }
        intruderFootstepTimer -= dt;
        if (intruderFootstepTimer <= 0) {
          intruderFootstepTimer = BOSS_CHARGE_FOOTSTEP_INTERVAL;
          audio.playFootstep();
        }
      }

      if (heartbeatActive) {
        heartbeatTimer -= dt;
        if (heartbeatTimer <= 0) {
          const interval = audio.playHeartbeat(78) ?? 0.75;
          heartbeatTimer = interval;
        }
      }
    },

    dispose() {
      wallTex.dispose();
      floorTex.dispose();
      ceilTex.dispose();
      signTexNormal.dispose();
      photoTexNormal.dispose();
      photoTexWrong.dispose();
      clockFaceTex.dispose();
      mirrorTexNormal.dispose();
      mirrorTexMessage.dispose();
      calendarTexNormal.dispose();
      calendarTexMarked.dispose();
      tvOffTex.dispose();
      tvStaticTex.dispose();
      for (const t of arrowTextures) t.dispose();
    },
  };

  return runtime;
}

function makeBlankScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, 8, 8);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

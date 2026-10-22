import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeHotelWallpaperTexture,
  makeHotelCarpetTexture,
  makeCeilingTexture,
  makeSignTexture,
  makeDndTexture,
  makePaintingTexture,
  makeVendingScreenTexture,
  makeHotelNoticeTexture,
  makeArrowSignTexture,
  makeRoomNumberTexture,
  buildElevatorDoors,
  buildLuggageCart,
  buildVendingMachine,
  buildRoomServiceCart,
  buildHotelGuestFigure,
  buildHotelDoorPanel,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign, scatterWallDecor } from "../shared/corridorBuilder";

const Z_MIN = -25.5;
const Z_MAX = 16.5;
const SPAWN_Z = 12;
const DOOR_Z = -24.6;
// 8番出口のような「一本道」を再現するため、廊下の幅は一定にする
const HALF_WIDTH = 1.4;

function halfWidthAt(_z: number): number {
  return HALF_WIDTH;
}

// ボス異変で人影がプレイヤーへ走って向かってくる演出の共通パラメータ
const BOSS_CHARGE_SPEED = 2.6;
const BOSS_CHARGE_STOP_DIST = 0.55;
const BOSS_CHARGE_FOOTSTEP_INTERVAL = 0.28;

export function buildStage05(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const wallTex = makeHotelWallpaperTexture();
  wallTex.repeat.set(1, 2);
  const floorTex = makeHotelCarpetTexture();
  const ceilTex = makeCeilingTexture();

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0.05 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95, metalness: 0 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 1 });

  // --- 通路本体 ---
  const { group, bounds } = buildCorridorShell({ zMin: Z_MIN, zMax: Z_MAX, halfWidthAt, wallMat, floorMat, ceilMat });
  group.name = "stage05";

  // --- 壁の燭台灯 ---
  const lightZs = [9, 4.5, 0, -4.5, -9.75, -15, -21];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs, 2.3, 5.5, 0xffcf9e);
  const flickerLight = lightEntries[3]; // z = -4.5 のライト

  // --- 本館出口の扉と看板 ---
  const signTexNormal = makeSignTexture("EXIT", "#ff2a2a");
  const { doorFrame, signPlane } = buildDoorAndSign(DOOR_Z, signTexNormal, 0x2a1c16);
  group.add(doorFrame, signPlane);
  const finalRoomPlateTex = makeRoomNumberTexture("666", false);
  const finalRoomPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.38, 0.28),
    new THREE.MeshBasicMaterial({ map: finalRoomPlateTex, toneMapped: false })
  );
  finalRoomPlate.position.set(0.5, 1.3, DOOR_Z - 0.28);
  group.add(finalRoomPlate);

  // --- エレベーター（z=9, 左壁） ---
  const ELEVATOR_Z = 9;
  const elevatorIndicatorNormal = makeRoomNumberTexture("1F", false);
  const elevatorIndicatorAnomaly = makeRoomNumberTexture("B6", true);
  const elevator = buildElevatorDoors(elevatorIndicatorNormal);
  elevator.group.position.set(-(halfWidthAt(ELEVATOR_Z) - 0.04), 0, ELEVATOR_Z);
  elevator.group.rotation.y = Math.PI / 2;
  elevator.group.scale.setScalar(1.25);
  group.add(elevator.group);

  // --- 荷物カート（z=6, 右壁） ---
  const LUGGAGE_Z = 6;
  const luggageSlot = new THREE.Group();
  luggageSlot.position.set(halfWidthAt(LUGGAGE_Z) - 0.32, 0, LUGGAGE_Z);
  luggageSlot.rotation.y = -Math.PI / 2;
  luggageSlot.scale.setScalar(1.25);
  group.add(luggageSlot);
  function rebuildLuggage(extra: boolean) {
    luggageSlot.clear();
    luggageSlot.add(buildLuggageCart(extra));
  }
  rebuildLuggage(false);

  // --- 絵画（z=2.25, 左壁） ---
  const PAINTING_Z = 2.25;
  const paintingTexNormal = makePaintingTexture(0);
  const paintingTexAnomaly = makePaintingTexture(1);
  const paintingMat = new THREE.MeshBasicMaterial({ map: paintingTexNormal, toneMapped: false });
  const paintingPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.65), paintingMat);
  paintingPlane.position.set(-(halfWidthAt(PAINTING_Z) - 0.05), 1.4, PAINTING_Z);
  paintingPlane.rotation.y = Math.PI / 2;
  group.add(paintingPlane);

  // --- DNDサインの下がった客室ドア（z=-0.75, 右壁） ---
  const DND_Z = -0.75;
  const dndTexNormal = makeDndTexture(false);
  const dndTexAnomaly = makeDndTexture(true);
  const dndDoorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 1.8, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.6 })
  );
  dndDoorFrame.position.set(halfWidthAt(DND_Z) - 0.02, 0.9, DND_Z);
  dndDoorFrame.scale.setScalar(1.25);
  group.add(dndDoorFrame);
  const dndMat = new THREE.MeshBasicMaterial({ map: dndTexNormal, toneMapped: false });
  const dndPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.33), dndMat);
  dndPlane.position.set(halfWidthAt(DND_Z) - 0.05, 1.3, DND_Z);
  dndPlane.rotation.y = -Math.PI / 2;
  group.add(dndPlane);

  // --- 自動販売機（z=-4.5, 左壁） ---
  const VENDING_Z = -4.5;
  const vendingTexNormal = makeVendingScreenTexture(false);
  const vendingTexAnomaly = makeVendingScreenTexture(true);
  const vending = buildVendingMachine(vendingTexNormal);
  vending.group.position.set(-(halfWidthAt(VENDING_Z) - 0.22), 0, VENDING_Z);
  vending.group.rotation.y = Math.PI / 2;
  vending.group.scale.setScalar(1.25);
  group.add(vending.group);

  // --- ルームサービスカート（z=-8.25, 右壁） ---
  const CART_Z = -8.25;
  const cartSlot = new THREE.Group();
  const CART_BASE_X = halfWidthAt(CART_Z) - 0.35;
  const CART_MOVED_X = halfWidthAt(CART_Z) - 0.7;
  cartSlot.position.set(CART_BASE_X, 0, CART_Z);
  cartSlot.scale.setScalar(1.25);
  cartSlot.add(buildRoomServiceCart());
  group.add(cartSlot);

  // --- 鏡（z=-12, 左壁） ---
  const MIRROR_Z = -12;
  const mirrorHalfWidth = halfWidthAt(MIRROR_Z);
  const mirrorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.1, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x8a7a4a, roughness: 0.4, metalness: 0.6 })
  );
  const mirrorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.98),
    new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.05, metalness: 0.9 })
  );
  mirrorGlass.position.z = 0.03;
  mirrorFrame.add(mirrorGlass);
  mirrorFrame.position.set(-(mirrorHalfWidth - 0.06), 1.3, MIRROR_Z);
  mirrorFrame.rotation.y = Math.PI / 2;
  mirrorFrame.scale.setScalar(1.25);
  group.add(mirrorFrame);
  const mirrorFigure = buildHotelGuestFigure();
  mirrorFigure.scale.set(0.5, 0.5, 0.02);
  mirrorFigure.position.set(-(mirrorHalfWidth - 0.1), 0, MIRROR_Z);
  mirrorFigure.visible = false;
  group.add(mirrorFigure);

  // --- 部屋番号プレート（z=-15.75, 右壁） ---
  const ROOM_NUMBER_Z = -15.75;
  const roomNumTexNormal = makeRoomNumberTexture("664", false);
  const roomNumTexAnomaly = makeRoomNumberTexture("666", true);
  const roomNumDoor = buildHotelDoorPanel(roomNumTexNormal);
  const roomNumMat = roomNumDoor.plateMat;
  roomNumDoor.group.position.set(halfWidthAt(ROOM_NUMBER_Z) - 0.03, 0.98, ROOM_NUMBER_Z);
  roomNumDoor.group.rotation.y = -Math.PI / 2;
  roomNumDoor.group.scale.setScalar(1.25);
  group.add(roomNumDoor.group);

  // --- ボスの人影（本館出口手前, z=-14.8） ---
  const BOSS_Z = DOOR_Z + 2.4;
  const bossFigure = buildHotelGuestFigure();
  bossFigure.position.set(0, 0, BOSS_Z);
  bossFigure.visible = false;
  group.add(bossFigure);
  const bossFigureBasePos = bossFigure.position.clone();
  let bossFigureCharging = false;
  let bossFigureFootstepTimer = 0;

  // --- 廊下沿いの客室ドア（8番出口のように、毎回同じはずのものを並べて密度を作る）。
  // 番号だけのプレートではなく、実際の扉の形（枠+パネル+ノブ+覗き穴）を持たせる。
  const roomDoorTextures = ["601", "602", "603", "605"].map((n) => makeRoomNumberTexture(n, false));
  const roomDoorSkipZRanges: [number, number][] = [
    [8.1, 9.9],
    [5.1, 6.9],
    [1.35, 3.15],
    [-1.65, 0.15],
    [-5.4, -3.6],
    [-9.15, -7.35],
    [-12.9, -11.1],
    [-16.65, -14.85],
    [-23.4, -21],
  ];
  let doorSide: 1 | -1 = 1;
  let doorTexIndex = 0;
  for (let z = 10.5; z >= -24; z -= 3.3) {
    const skipped = roomDoorSkipZRanges.some(([lo, hi]) => z >= lo && z <= hi);
    if (!skipped) {
      const hw = halfWidthAt(z);
      const doorHandle = buildHotelDoorPanel(roomDoorTextures[doorTexIndex % roomDoorTextures.length]);
      if (doorSide === 1) {
        doorHandle.group.position.set(hw - 0.03, 0.98, z);
        doorHandle.group.rotation.y = -Math.PI / 2;
      } else {
        doorHandle.group.position.set(-(hw - 0.03), 0.98, z);
        doorHandle.group.rotation.y = Math.PI / 2;
      }
      doorHandle.group.scale.setScalar(1.25);
      group.add(doorHandle.group);
      doorTexIndex += 1;
    }
    doorSide = doorSide === 1 ? -1 : 1;
  }
  const noticeTextures = [0, 1, 2, 3].map((v) => makeHotelNoticeTexture(v));
  scatterWallDecor(group, halfWidthAt, noticeTextures, {
    zFrom: 11.4,
    zTo: -23.7,
    step: 4.65,
    width: 0.5,
    height: 0.69,
    y: 2.0,
  });
  const arrowTextures = [makeArrowSignTexture("right"), makeArrowSignTexture("left")];
  scatterWallDecor(group, halfWidthAt, arrowTextures, {
    zFrom: 12.45,
    zTo: -24.3,
    step: 6,
    width: 0.38,
    height: 0.19,
    y: 2.3,
  });

  // --- 状態管理 ---
  let heartbeatTimer = 0;
  let heartbeatActive = false;
  let electricHumTimer = 0;
  let vendingGlowBase = vending.glowLight.intensity;

  const runtime: StageRuntime = {
    group,
    bounds,
    spawnPosition: new THREE.Vector3(0, 0, SPAWN_Z),
    spawnYaw: 0,
    doorInteractPoint: new THREE.Vector3(0, 0, DOOR_Z + 1.4),
    startGateInteractPoint: new THREE.Vector3(0, 0, SPAWN_Z + 2.3),
    interactRadius: 1.7,

    applyAnomaly(id: string | null) {
      roomNumMat.map = roomNumTexNormal;
      roomNumMat.needsUpdate = true;
      dndMat.map = dndTexNormal;
      dndMat.needsUpdate = true;
      elevator.indicatorMat.map = elevatorIndicatorNormal;
      elevator.indicatorMat.needsUpdate = true;
      lighting.setFlicker(flickerLight, false);
      rebuildLuggage(false);
      paintingMat.map = paintingTexNormal;
      paintingMat.needsUpdate = true;
      vending.screenMat.map = vendingTexNormal;
      vending.screenMat.needsUpdate = true;
      vending.glowLight.intensity = vendingGlowBase;
      cartSlot.position.x = CART_BASE_X;
      mirrorFigure.visible = false;
      bossFigure.visible = false;
      bossFigure.position.copy(bossFigureBasePos);
      bossFigureCharging = false;
      bossFigureFootstepTimer = 0;
      heartbeatActive = false;
      heartbeatTimer = 0;

      switch (id) {
        case "room_number_666":
          roomNumMat.map = roomNumTexAnomaly;
          roomNumMat.needsUpdate = true;
          break;
        case "dnd_sign_flip":
          dndMat.map = dndTexAnomaly;
          dndMat.needsUpdate = true;
          break;
        case "elevator_light":
          elevator.indicatorMat.map = elevatorIndicatorAnomaly;
          elevator.indicatorMat.needsUpdate = true;
          lighting.setFlicker(flickerLight, true);
          break;
        case "luggage_extra":
          rebuildLuggage(true);
          break;
        case "painting_eyes":
          paintingMat.map = paintingTexAnomaly;
          paintingMat.needsUpdate = true;
          break;
        case "vending_message":
          vending.screenMat.map = vendingTexAnomaly;
          vending.screenMat.needsUpdate = true;
          vending.glowLight.intensity = vendingGlowBase * 1.8;
          break;
        case "cart_moved":
          cartSlot.position.x = CART_MOVED_X;
          break;
        case "phone_ring":
          audio.playNurseCall();
          break;
        case "mirror_wrong_room":
          mirrorFigure.visible = true;
          audio.playWhisper();
          break;
        case "key_double":
          bossFigure.visible = true;
          bossFigureCharging = true;
          heartbeatActive = true;
          break;
        default:
          break;
      }
    },

    update(dt: number, playerPos: THREE.Vector3) {
      if (bossFigureCharging) {
        const dx = playerPos.x - bossFigure.position.x;
        const dz = playerPos.z - bossFigure.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > BOSS_CHARGE_STOP_DIST) {
          bossFigure.position.x += (dx / dist) * BOSS_CHARGE_SPEED * dt;
          bossFigure.position.z += (dz / dist) * BOSS_CHARGE_SPEED * dt;
          bossFigure.rotation.y = Math.atan2(dx, dz);
        }
        bossFigureFootstepTimer -= dt;
        if (bossFigureFootstepTimer <= 0) {
          bossFigureFootstepTimer = BOSS_CHARGE_FOOTSTEP_INTERVAL;
          audio.playFootstep();
        }
      }

      if (heartbeatActive) {
        heartbeatTimer -= dt;
        if (heartbeatTimer <= 0) {
          const interval = audio.playHeartbeat(85) ?? 0.75;
          heartbeatTimer = interval;
        }
      }

      if (flickerLight.flickering) {
        electricHumTimer -= dt;
        if (electricHumTimer <= 0) {
          electricHumTimer = 1.5 + Math.random() * 2;
          audio.playElectricHum();
        }
      }
    },

    dispose() {
      wallTex.dispose();
      floorTex.dispose();
      ceilTex.dispose();
      signTexNormal.dispose();
      finalRoomPlateTex.dispose();
      elevatorIndicatorNormal.dispose();
      elevatorIndicatorAnomaly.dispose();
      paintingTexNormal.dispose();
      paintingTexAnomaly.dispose();
      dndTexNormal.dispose();
      dndTexAnomaly.dispose();
      vendingTexNormal.dispose();
      vendingTexAnomaly.dispose();
      roomNumTexNormal.dispose();
      roomNumTexAnomaly.dispose();
      for (const t of roomDoorTextures) t.dispose();
      for (const t of noticeTextures) t.dispose();
      for (const t of arrowTextures) t.dispose();
    },
  };

  return runtime;
}

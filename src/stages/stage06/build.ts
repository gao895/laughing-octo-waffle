import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeTrainWallTexture,
  makeTrainFloorTexture,
  makeCeilingTexture,
  makeSignTexture,
  makeRouteMapTexture,
  makeTrainAdTexture,
  makePrioritySeatTexture,
  makeArrowSignTexture,
  buildTrainBenchRun,
  buildStanchionPole,
  buildCeilingLightStrip,
  buildStrapRow,
  buildEmergencyButton,
  buildTrainWindow,
  buildTrainPassengerFigure,
  type StrapRowHandle,
  type TrainWindowHandle,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign, scatterWallDecor } from "../shared/corridorBuilder";

const Z_MIN = -25.5;
const Z_MAX = 16.5;
const SPAWN_Z = 12;
const DOOR_Z = -24.6;
// 8番出口のような「一本道」を再現するため、車両通路の幅は一定にする
const HALF_WIDTH = 1.3;

function halfWidthAt(_z: number): number {
  return HALF_WIDTH;
}

// ボス異変で人影がプレイヤーへ走って向かってくる演出の共通パラメータ
const BOSS_CHARGE_SPEED = 2.6;
const BOSS_CHARGE_STOP_DIST = 0.55;
const BOSS_CHARGE_FOOTSTEP_INTERVAL = 0.28;

// 両壁で全く同じ位置・長さのベンチ区画(ベイ)を並べ、実際の通勤電車のように
// 左右対称なロングシート+窓の連続にする。異変用の小道具はこのベイの上に
// 「乗せる」形で後付けし、座席そのものの構造は左右で変えない。
const BAY_CENTERS = [8.5, 4.9, 1.3, -2.3, -5.9, -9.5, -13.1, -16.7];
const BAY_LENGTH = 3.0;

interface BenchBayHandle {
  bench: THREE.Group;
  window: TrainWindowHandle;
  centerZ: number;
}

export function buildStage06(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const wallTex = makeTrainWallTexture();
  wallTex.repeat.set(1, 2);
  const floorTex = makeTrainFloorTexture();
  const ceilTex = makeCeilingTexture();

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.8, metalness: 0.05 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, metalness: 0.1 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 1 });

  // --- 車両本体 ---
  const { group, bounds } = buildCorridorShell({
    zMin: Z_MIN,
    zMax: Z_MAX,
    halfWidthAt,
    wallMat,
    floorMat,
    ceilMat,
    ceilingHeight: 2.4,
  });
  group.name = "stage06";

  // --- 車内灯 ---
  const lightZs = [9, 4.5, 0, -4.5, -9.75, -15, -21];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs, 2.2, 5.5, 0xf2f6ff);
  const flickerLight = lightEntries[3]; // z = -4.5

  // --- 連結部の扉と看板 ---
  const signTexNormal = makeSignTexture("EXIT", "#ff2a2a");
  const { doorFrame, signPlane } = buildDoorAndSign(DOOR_Z, signTexNormal, 0x5a5a56);
  group.add(doorFrame, signPlane);

  // --- つり革の列（車両中央, 天井から） ---
  const strapHandle: StrapRowHandle = buildStrapRow(16, 1.9);
  strapHandle.group.position.set(0, 2.0, -4);
  group.add(strapHandle.group);
  const SWAY_STRAP_INDEX = 8;

  // --- 両壁に左右対称のロングシート区画を並べる ---
  function addBenchBay(side: 1 | -1, centerZ: number, length: number): BenchBayHandle {
    const hw = halfWidthAt(centerZ);
    const divisions = Math.max(2, Math.round(length / 0.9));
    const bench = buildTrainBenchRun(length, divisions);
    const win = buildTrainWindow(length - 0.25, 0.72);
    const poleA = buildStanchionPole(1.9);
    const poleB = buildStanchionPole(1.9);
    const x = side === 1 ? hw - 0.22 : -(hw - 0.22);
    // 窓の奥に流れる夜景プレーンが壁本体(x=hw)より奥に出て隠れないよう、窓ごと壁内側へ下げておく
    const xWin = side === 1 ? hw - 0.15 : -(hw - 0.15);
    const xPole = side === 1 ? hw - 0.05 : -(hw - 0.05);
    // buildTrainBenchRunは奥行き(length)が既にローカルZ軸方向に沿っているため、
    // 壁沿い(ワールドZ軸方向)に向けるには回転させず、背もたれの左右だけを反転する。
    const benchRotY = side === 1 ? Math.PI : 0;
    const winRotY = side === 1 ? -Math.PI / 2 : Math.PI / 2;
    bench.position.set(x, 0, centerZ);
    bench.rotation.y = benchRotY;
    win.group.position.set(xWin, 1.55, centerZ);
    win.group.rotation.y = winRotY;
    poleA.position.set(xPole, 0, centerZ - length / 2);
    poleB.position.set(xPole, 0, centerZ + length / 2);
    group.add(bench, win.group, poleA, poleB);
    return { bench, window: win, centerZ };
  }

  /** 窓の上、天井との間に小さな掲示物プレートを取り付ける */
  function mountPlate(side: 1 | -1, z: number, width: number, height: number, mat: THREE.Material): THREE.Mesh {
    const hw = halfWidthAt(z);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    plane.position.set(side === 1 ? hw - 0.03 : -(hw - 0.03), 2.07, z);
    plane.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
    group.add(plane);
    return plane;
  }

  const rightBays = BAY_CENTERS.map((z) => addBenchBay(1, z, BAY_LENGTH));
  const leftBays = BAY_CENTERS.map((z) => addBenchBay(-1, z, BAY_LENGTH));
  // 窓のローカルX軸は左右の壁で逆向き(ミラー)になっているため、
  // 両側のテクスチャが同じ向きに流れて見えるよう符号を逆にする
  const TRAIN_SCENERY_SPEED = 0.5;

  // --- 路線図（左壁, bay0の上） ---
  const routeMapTexNormal = makeRouteMapTexture(false);
  const routeMapTexAnomaly = makeRouteMapTexture(true);
  const routeMapMat = new THREE.MeshBasicMaterial({ map: routeMapTexNormal, toneMapped: false });
  mountPlate(-1, leftBays[0].centerZ, 0.75, 0.3, routeMapMat);

  // --- 車内広告（右壁, bay1の上） ---
  const adTexNormal = makeTrainAdTexture(false);
  const adTexAnomaly = makeTrainAdTexture(true);
  const adMat = new THREE.MeshBasicMaterial({ map: adTexNormal, toneMapped: false });
  mountPlate(1, rightBays[1].centerZ, 0.62, 0.3, adMat);

  // --- 非常停止ボタン（右壁, bay0とbay1の間の継ぎ目） ---
  const BUTTON_Z = (rightBays[0].centerZ - BAY_LENGTH / 2 + (rightBays[1].centerZ + BAY_LENGTH / 2)) / 2;
  const emergencyButton = buildEmergencyButton();
  emergencyButton.group.position.set(halfWidthAt(BUTTON_Z) - 0.03, 1.3, BUTTON_Z);
  emergencyButton.group.rotation.y = -Math.PI / 2;
  group.add(emergencyButton.group);

  // --- 優先席の表示（右壁, bay3の上） ---
  const PRIORITY_Z = rightBays[3].centerZ;
  const prioritySignTexNormal = makePrioritySeatTexture(false);
  const prioritySignTexAnomaly = makePrioritySeatTexture(true);
  const prioritySignMat = new THREE.MeshBasicMaterial({ map: prioritySignTexNormal, toneMapped: false });
  mountPlate(1, PRIORITY_Z, 0.4, 0.2, prioritySignMat);

  // --- 乗客が増える座席（左壁, bay4） ---
  const PASSENGER_SEAT_Z = leftBays[4].centerZ;
  const extraPassenger = buildTrainPassengerFigure();
  extraPassenger.scale.setScalar(0.92);
  extraPassenger.position.set(-(halfWidthAt(PASSENGER_SEAT_Z) - 0.32), 0.42, PASSENGER_SEAT_Z - 0.8);
  extraPassenger.rotation.y = -Math.PI / 2;
  extraPassenger.visible = false;
  group.add(extraPassenger);

  // --- 車窓（外に人影, 右壁bay5を流用） ---
  const WINDOW_FIGURE_Z = rightBays[5].centerZ;
  const outsideFigure = buildTrainPassengerFigure();
  outsideFigure.scale.set(0.4, 0.4, 0.15);
  outsideFigure.position.set(halfWidthAt(WINDOW_FIGURE_Z) + 0.3, 1.1, WINDOW_FIGURE_Z);
  outsideFigure.visible = false;
  group.add(outsideFigure);
  let windowFigureHiddenByProximity = false;

  // --- 車窓（反射に人影, 左壁bay6を流用） ---
  const WINDOW_REFLECT_Z = leftBays[6].centerZ;
  const reflectFigure = buildTrainPassengerFigure();
  reflectFigure.scale.set(0.5, 0.5, 0.02);
  reflectFigure.position.set(-(halfWidthAt(WINDOW_REFLECT_Z) - 0.1), 0.55, WINDOW_REFLECT_Z);
  reflectFigure.rotation.y = Math.PI / 2;
  reflectFigure.visible = false;
  group.add(reflectFigure);

  // --- ボスの乗客（連結部手前） ---
  const BOSS_Z = DOOR_Z + 2.4;
  const anotherPassenger = buildTrainPassengerFigure();
  anotherPassenger.position.set(0, 0, BOSS_Z);
  anotherPassenger.visible = false;
  group.add(anotherPassenger);
  const anotherPassengerBasePos = anotherPassenger.position.clone();
  let anotherPassengerCharging = false;
  let anotherPassengerFootstepTimer = 0;

  // --- ドア付近の立席スペースに握り棒 ---
  for (const z of [11, -21.5]) {
    const hw = halfWidthAt(z);
    const poleR = buildStanchionPole(1.9);
    poleR.position.set(hw - 0.3, 0, z);
    const poleL = buildStanchionPole(1.9);
    poleL.position.set(-(hw - 0.3), 0, z);
    group.add(poleR, poleL);
  }

  // --- 天井中央の蛍光灯パネル ---
  const lightStrip = buildCeilingLightStrip(Z_MAX - Z_MIN - 8);
  lightStrip.position.set(0, 2.36, (Z_MAX + Z_MIN) / 2 - 2);
  group.add(lightStrip);

  // --- 車内沿いの案内矢印（8番出口のように密度を作る） ---
  const arrowTextures = [makeArrowSignTexture("right"), makeArrowSignTexture("left")];
  scatterWallDecor(group, halfWidthAt, arrowTextures, {
    zFrom: 12.45,
    zTo: -24.3,
    step: 6,
    width: 0.3,
    height: 0.15,
    y: 2.25,
  });

  // --- 走行音ループ（最終電車が走っている雰囲気） ---
  audio.startTrainRunning();

  // --- 状態管理 ---
  let heartbeatTimer = 0;
  let heartbeatActive = false;
  let electricHumTimer = 0;
  let strapSwaying = false;

  const runtime: StageRuntime = {
    group,
    bounds,
    spawnPosition: new THREE.Vector3(0, 0, SPAWN_Z),
    spawnYaw: 0,
    doorInteractPoint: new THREE.Vector3(0, 0, DOOR_Z + 1.4),
    startGateInteractPoint: new THREE.Vector3(0, 0, SPAWN_Z + 2.3),
    interactRadius: 1.7,

    applyAnomaly(id: string | null) {
      extraPassenger.visible = false;
      routeMapMat.map = routeMapTexNormal;
      routeMapMat.needsUpdate = true;
      strapSwaying = false;
      adMat.map = adTexNormal;
      adMat.needsUpdate = true;
      lighting.setFlicker(flickerLight, false);
      emergencyButton.lampMat.emissive.set(0x3a0808);
      emergencyButton.lampMat.emissiveIntensity = 0.3;
      emergencyButton.light.intensity = 0;
      prioritySignMat.map = prioritySignTexNormal;
      prioritySignMat.needsUpdate = true;
      outsideFigure.visible = false;
      windowFigureHiddenByProximity = false;
      reflectFigure.visible = false;
      anotherPassenger.visible = false;
      anotherPassenger.position.copy(anotherPassengerBasePos);
      anotherPassengerCharging = false;
      anotherPassengerFootstepTimer = 0;
      heartbeatActive = false;
      heartbeatTimer = 0;

      switch (id) {
        case "extra_passenger":
          extraPassenger.visible = true;
          break;
        case "route_map_wrong":
          routeMapMat.map = routeMapTexAnomaly;
          routeMapMat.needsUpdate = true;
          break;
        case "strap_sway":
          strapSwaying = true;
          break;
        case "ad_poster_change":
          adMat.map = adTexAnomaly;
          adMat.needsUpdate = true;
          break;
        case "emergency_button_lit":
          emergencyButton.lampMat.emissive.set(0xff2a2a);
          emergencyButton.lampMat.emissiveIntensity = 1.6;
          emergencyButton.light.intensity = 1.2;
          lighting.setFlicker(flickerLight, true);
          audio.playElectricHum();
          break;
        case "priority_seat_sign":
          prioritySignMat.map = prioritySignTexAnomaly;
          prioritySignMat.needsUpdate = true;
          break;
        case "announcement_static":
          audio.playWhisper();
          break;
        case "window_dark_figure":
          outsideFigure.visible = true;
          break;
        case "window_reflection_wrong":
          reflectFigure.visible = true;
          audio.playWhisper();
          break;
        case "another_passenger":
          anotherPassenger.visible = true;
          anotherPassengerCharging = true;
          heartbeatActive = true;
          break;
        default:
          break;
      }
    },

    update(dt: number, playerPos: THREE.Vector3) {
      if (anotherPassengerCharging) {
        const dx = playerPos.x - anotherPassenger.position.x;
        const dz = playerPos.z - anotherPassenger.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > BOSS_CHARGE_STOP_DIST) {
          anotherPassenger.position.x += (dx / dist) * BOSS_CHARGE_SPEED * dt;
          anotherPassenger.position.z += (dz / dist) * BOSS_CHARGE_SPEED * dt;
          anotherPassenger.rotation.y = Math.atan2(dx, dz);
        }
        anotherPassengerFootstepTimer -= dt;
        if (anotherPassengerFootstepTimer <= 0) {
          anotherPassengerFootstepTimer = BOSS_CHARGE_FOOTSTEP_INTERVAL;
          audio.playFootstep();
        }
      }

      if (strapSwaying) {
        const strap = strapHandle.straps[SWAY_STRAP_INDEX];
        strap.rotation.z = Math.sin(performance.now() * 0.004) * 0.5;
      } else {
        for (const strap of strapHandle.straps) strap.rotation.z *= 0.9;
      }

      if (outsideFigure.visible && !windowFigureHiddenByProximity) {
        if (Math.abs(playerPos.z - WINDOW_FIGURE_Z) < 2.2) {
          windowFigureHiddenByProximity = true;
          outsideFigure.visible = false;
        }
      }

      if (heartbeatActive) {
        heartbeatTimer -= dt;
        if (heartbeatTimer <= 0) {
          const interval = audio.playHeartbeat(84) ?? 0.75;
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

      for (const bay of rightBays) bay.window.sceneryTex.offset.x += dt * TRAIN_SCENERY_SPEED;
      for (const bay of leftBays) bay.window.sceneryTex.offset.x -= dt * TRAIN_SCENERY_SPEED;
    },

    dispose() {
      audio.stopTrainRunning();
      wallTex.dispose();
      floorTex.dispose();
      ceilTex.dispose();
      signTexNormal.dispose();
      routeMapTexNormal.dispose();
      routeMapTexAnomaly.dispose();
      adTexNormal.dispose();
      adTexAnomaly.dispose();
      prioritySignTexNormal.dispose();
      prioritySignTexAnomaly.dispose();
      for (const t of arrowTextures) t.dispose();
      for (const bay of [...rightBays, ...leftBays]) bay.window.sceneryTex.dispose();
    },
  };

  return runtime;
}

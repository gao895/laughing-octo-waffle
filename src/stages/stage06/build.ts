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
  buildTrainSeatBench,
  buildStrapRow,
  buildEmergencyButton,
  buildTrainWindow,
  buildTrainPassengerFigure,
  type StrapRowHandle,
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

  // --- 路線図（z=9, 左壁） ---
  const ROUTE_MAP_Z = 9;
  const routeMapTexNormal = makeRouteMapTexture(false);
  const routeMapTexAnomaly = makeRouteMapTexture(true);
  const routeMapMat = new THREE.MeshBasicMaterial({ map: routeMapTexNormal, toneMapped: false });
  const routeMapPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.38), routeMapMat);
  routeMapPlane.position.set(-(halfWidthAt(ROUTE_MAP_Z) - 0.03), 1.85, ROUTE_MAP_Z);
  routeMapPlane.rotation.y = Math.PI / 2;
  group.add(routeMapPlane);
  const routeMapWindow = buildTrainWindow(0.55, 0.42);
  routeMapWindow.group.position.set(-(halfWidthAt(ROUTE_MAP_Z) - 0.01), 1.5, ROUTE_MAP_Z);
  routeMapWindow.group.rotation.y = Math.PI / 2;
  group.add(routeMapWindow.group);

  // --- 車内広告（z=3, 右壁） ---
  const AD_Z = 3;
  const adTexNormal = makeTrainAdTexture(false);
  const adTexAnomaly = makeTrainAdTexture(true);
  const adMat = new THREE.MeshBasicMaterial({ map: adTexNormal, toneMapped: false });
  const adPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.38), adMat);
  adPlane.position.set(halfWidthAt(AD_Z) - 0.03, 1.85, AD_Z);
  adPlane.rotation.y = -Math.PI / 2;
  group.add(adPlane);
  const adWindow = buildTrainWindow(0.55, 0.42);
  adWindow.group.position.set(halfWidthAt(AD_Z) - 0.01, 1.5, AD_Z);
  adWindow.group.rotation.y = -Math.PI / 2;
  group.add(adWindow.group);

  // --- 非常停止ボタン（z=0, 左壁） ---
  const BUTTON_Z = 0;
  const emergencyButton = buildEmergencyButton();
  emergencyButton.group.position.set(-(halfWidthAt(BUTTON_Z) - 0.03), 1.3, BUTTON_Z);
  emergencyButton.group.rotation.y = Math.PI / 2;
  group.add(emergencyButton.group);

  // --- 優先席（z=-3, 右壁） ---
  const PRIORITY_Z = -3;
  const prioritySeat = buildTrainSeatBench(0.9);
  prioritySeat.position.set(halfWidthAt(PRIORITY_Z) - 0.22, 0, PRIORITY_Z);
  prioritySeat.rotation.y = -Math.PI / 2;
  group.add(prioritySeat);
  const prioritySignTexNormal = makePrioritySeatTexture(false);
  const prioritySignTexAnomaly = makePrioritySeatTexture(true);
  const prioritySignMat = new THREE.MeshBasicMaterial({ map: prioritySignTexNormal, toneMapped: false });
  const prioritySignPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), prioritySignMat);
  prioritySignPlane.position.set(halfWidthAt(PRIORITY_Z) - 0.03, 1.75, PRIORITY_Z);
  prioritySignPlane.rotation.y = -Math.PI / 2;
  group.add(prioritySignPlane);
  const priorityWindow = buildTrainWindow(0.55, 0.42);
  priorityWindow.group.position.set(halfWidthAt(PRIORITY_Z) - 0.01, 1.5, PRIORITY_Z);
  priorityWindow.group.rotation.y = -Math.PI / 2;
  group.add(priorityWindow.group);

  // --- 乗客が増える座席（z=-6, 左壁） ---
  const PASSENGER_SEAT_Z = -6;
  const passengerSeat = buildTrainSeatBench(0.9);
  passengerSeat.position.set(-(halfWidthAt(PASSENGER_SEAT_Z) - 0.22), 0, PASSENGER_SEAT_Z);
  passengerSeat.rotation.y = Math.PI / 2;
  group.add(passengerSeat);
  const extraPassenger = buildTrainPassengerFigure();
  extraPassenger.scale.setScalar(0.92);
  extraPassenger.position.set(-(halfWidthAt(PASSENGER_SEAT_Z) - 0.3), 0.42, PASSENGER_SEAT_Z);
  extraPassenger.rotation.y = -Math.PI / 2;
  extraPassenger.visible = false;
  group.add(extraPassenger);
  const passengerWindow = buildTrainWindow(0.55, 0.42);
  passengerWindow.group.position.set(-(halfWidthAt(PASSENGER_SEAT_Z) - 0.01), 1.5, PASSENGER_SEAT_Z);
  passengerWindow.group.rotation.y = Math.PI / 2;
  group.add(passengerWindow.group);

  // --- 車窓（外に人影, z=-9, 右壁） ---
  const WINDOW_FIGURE_Z = -9;
  const windowFigureProp = buildTrainWindow(0.6, 0.45);
  windowFigureProp.group.position.set(halfWidthAt(WINDOW_FIGURE_Z) - 0.01, 1.4, WINDOW_FIGURE_Z);
  windowFigureProp.group.rotation.y = -Math.PI / 2;
  group.add(windowFigureProp.group);
  const outsideFigure = buildTrainPassengerFigure();
  outsideFigure.scale.set(0.4, 0.4, 0.15);
  outsideFigure.position.set(halfWidthAt(WINDOW_FIGURE_Z) + 0.3, 0.9, WINDOW_FIGURE_Z);
  outsideFigure.visible = false;
  group.add(outsideFigure);
  let windowFigureHiddenByProximity = false;

  // --- 車窓（反射に人影, z=-12, 左壁） ---
  const WINDOW_REFLECT_Z = -12;
  const windowReflectProp = buildTrainWindow(0.6, 0.45);
  windowReflectProp.group.position.set(-(halfWidthAt(WINDOW_REFLECT_Z) - 0.01), 1.4, WINDOW_REFLECT_Z);
  windowReflectProp.group.rotation.y = Math.PI / 2;
  group.add(windowReflectProp.group);
  const reflectFigure = buildTrainPassengerFigure();
  reflectFigure.scale.set(0.5, 0.5, 0.02);
  reflectFigure.position.set(-(halfWidthAt(WINDOW_REFLECT_Z) - 0.08), 0.55, WINDOW_REFLECT_Z);
  reflectFigure.rotation.y = Math.PI / 2;
  reflectFigure.visible = false;
  group.add(reflectFigure);

  // --- ボスの乗客（連結部手前, z=-22.2） ---
  const BOSS_Z = DOOR_Z + 2.4;
  const anotherPassenger = buildTrainPassengerFigure();
  anotherPassenger.position.set(0, 0, BOSS_Z);
  anotherPassenger.visible = false;
  group.add(anotherPassenger);

  // --- 一般の座席列（装飾, 両壁に反復配置） ---
  const genericSeatSkipZRanges: [number, number][] = [
    [8, 10],
    [2, 4],
    [-1, 1],
    [-4, -2],
    [-7, -5],
    [-10, -8],
    [-13, -11],
    [-23.4, -21],
  ];
  let seatSide: 1 | -1 = 1;
  for (let z = 10.5; z >= -14; z -= 1.3) {
    const skipped = genericSeatSkipZRanges.some(([lo, hi]) => z >= lo && z <= hi);
    if (!skipped) {
      const hw = halfWidthAt(z);
      const bench = buildTrainSeatBench(0.9);
      const window = buildTrainWindow(0.55, 0.42);
      if (seatSide === 1) {
        bench.position.set(hw - 0.22, 0, z);
        bench.rotation.y = -Math.PI / 2;
        window.group.position.set(hw - 0.01, 1.5, z);
        window.group.rotation.y = -Math.PI / 2;
      } else {
        bench.position.set(-(hw - 0.22), 0, z);
        bench.rotation.y = Math.PI / 2;
        window.group.position.set(-(hw - 0.01), 1.5, z);
        window.group.rotation.y = Math.PI / 2;
      }
      group.add(bench, window.group);
    }
    seatSide = seatSide === 1 ? -1 : 1;
  }

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
          heartbeatActive = true;
          break;
        default:
          break;
      }
    },

    update(dt: number, playerPos: THREE.Vector3) {
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
    },

    dispose() {
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
    },
  };

  return runtime;
}

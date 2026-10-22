import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeShrinePathTexture,
  makeHedgeWallTexture,
  makeNightSkyTexture,
  makeSignTexture,
  makeEmaTexture,
  makeShrineNoticeTexture,
  makeArrowSignTexture,
  buildToriiGate,
  buildStoneLantern,
  buildKomainu,
  buildChozuya,
  buildShimenawaGate,
  buildStoneSteps,
  buildFacelessFigure,
  type StoneLanternHandle,
  type KomainuHandle,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign, scatterWallDecor } from "../shared/corridorBuilder";

const Z_MIN = -25.5;
const Z_MAX = 17.25;
const SPAWN_Z = 12.75;
const DOOR_Z = -24.6;
// 8番出口のような「一本道」を再現するため、参道の幅は一定にする
const HALF_WIDTH = 1.5;

function halfWidthAt(_z: number): number {
  return HALF_WIDTH;
}

const SHIDE_DEFAULT_COUNT = 5;
const STEPS_DEFAULT_COUNT = 4;

export function buildStage04(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const pathTex = makeShrinePathTexture();
  const hedgeTex = makeHedgeWallTexture();
  hedgeTex.repeat.set(1, 2);
  const skyTex = makeNightSkyTexture();

  const pathMat = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.95, metalness: 0 });
  const hedgeMat = new THREE.MeshStandardMaterial({ map: hedgeTex, roughness: 1 });
  const skyMat = new THREE.MeshStandardMaterial({ map: skyTex, roughness: 1, emissive: 0x08080c, emissiveIntensity: 0.6 });

  // --- 参道本体（屋外のため天井は高く夜空として扱う） ---
  const { group, bounds } = buildCorridorShell({
    zMin: Z_MIN,
    zMax: Z_MAX,
    halfWidthAt,
    wallMat: hedgeMat,
    floorMat: pathMat,
    ceilMat: skyMat,
    ceilingHeight: 5.5,
  });
  group.name = "stage04";

  // --- 灯籠の明かり（天井灯の代わり） ---
  const lightZs = [9, 2.25, -6, -10.5, -15, -21.75];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs, 2.4, 7, 0xffb86c);

  // --- 本殿入口（出口扉）と看板 ---
  const signTexNormal = makeSignTexture("EXIT", "#ff2a2a");
  const { doorFrame, signPlane } = buildDoorAndSign(DOOR_Z, signTexNormal, 0x4a1c14);
  group.add(doorFrame, signPlane);

  // --- 入口の鳥居（z=14.25） ---
  const TORII_Z = 14.25;
  const toriiSlot = new THREE.Group();
  toriiSlot.position.z = TORII_Z;
  group.add(toriiSlot);
  function rebuildEntranceTorii(tilted: boolean) {
    toriiSlot.clear();
    const torii = buildToriiGate(2.6, 2.8);
    if (tilted) torii.rotation.z = 0.08;
    toriiSlot.add(torii);
  }
  rebuildEntranceTorii(false);

  // --- 石灯籠（左右一対, z=9） ---
  const LANTERN_Z = 9;
  const lanternL: StoneLanternHandle = buildStoneLantern();
  lanternL.group.position.set(-(halfWidthAt(LANTERN_Z) - 0.3), 0, LANTERN_Z);
  const lanternR: StoneLanternHandle = buildStoneLantern();
  lanternR.group.position.set(halfWidthAt(LANTERN_Z) - 0.3, 0, LANTERN_Z);
  group.add(lanternL.group, lanternR.group);

  // --- 絵馬掛け（z=6, 右壁） ---
  const EMA_Z = 6;
  const emaTexNormal = makeEmaTexture("");
  const emaTexAnomaly = makeEmaTexture("かえりたい");
  const emaMat = new THREE.MeshBasicMaterial({ map: emaTexNormal, toneMapped: false });
  const emaPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.37), emaMat);
  emaPlane.position.set(halfWidthAt(EMA_Z) - 0.1, 1.2, EMA_Z);
  emaPlane.rotation.y = -Math.PI / 2;
  group.add(emaPlane);
  // 周囲に反応しない絵馬を数枚添えて密度を作る
  const emaDecorTex = makeEmaTexture("");
  for (const dz of [-0.28, 0.28]) {
    const deco = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.32), new THREE.MeshBasicMaterial({ map: emaDecorTex, toneMapped: false }));
    deco.position.set(halfWidthAt(EMA_Z + dz) - 0.1, 1.15, EMA_Z + dz);
    deco.rotation.y = -Math.PI / 2;
    group.add(deco);
  }

  // --- 狛犬（左右一対, z=2.25） ---
  const KOMAINU_Z = 2.25;
  const komainuL: KomainuHandle = buildKomainu(false);
  komainuL.group.position.set(-(halfWidthAt(KOMAINU_Z) - 0.35), 0, KOMAINU_Z);
  komainuL.group.rotation.y = Math.PI / 2;
  const komainuR: KomainuHandle = buildKomainu(true);
  komainuR.group.position.set(halfWidthAt(KOMAINU_Z) - 0.35, 0, KOMAINU_Z);
  komainuR.group.rotation.y = -Math.PI / 2;
  group.add(komainuL.group, komainuR.group);

  // --- 手水舎（z=-1.5, 左壁） ---
  const CHOZUYA_Z = -1.5;
  const chozuya = buildChozuya();
  chozuya.group.position.set(-(halfWidthAt(CHOZUYA_Z) - 0.55), 0, CHOZUYA_Z);
  group.add(chozuya.group);
  const waterColorNormal = chozuya.waterMat.color.clone();
  const waterColorAnomaly = new THREE.Color(0x5a1414);

  // --- しめ縄ゲート（z=-6, 参道をまたぐ） ---
  const SHIMENAWA_Z = -6;
  const shimenawaSlot = new THREE.Group();
  shimenawaSlot.position.set(0, 2.1, SHIMENAWA_Z);
  group.add(shimenawaSlot);
  function rebuildShimenawa(count: number) {
    shimenawaSlot.clear();
    shimenawaSlot.add(buildShimenawaGate(count));
  }
  rebuildShimenawa(SHIDE_DEFAULT_COUNT);

  // --- 石段（装飾, z=-10.5, 右脇） ---
  const STEPS_Z = -10.5;
  const stepsSlot = new THREE.Group();
  stepsSlot.position.set(halfWidthAt(STEPS_Z) - 0.3, 0, STEPS_Z + 0.4);
  stepsSlot.rotation.y = -Math.PI / 2;
  group.add(stepsSlot);
  function rebuildSteps(count: number) {
    stepsSlot.clear();
    stepsSlot.add(buildStoneSteps(count));
  }
  rebuildSteps(STEPS_DEFAULT_COUNT);

  // --- 鈴（本殿手前, z=-15.75） ---
  const BELL_Z = -15.75;
  const bellGroup = new THREE.Group();
  const bellRopePivot = new THREE.Object3D();
  const bellRope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6),
    new THREE.MeshStandardMaterial({ color: 0xd8c9a0, roughness: 0.9 })
  );
  bellRope.position.y = -0.35;
  bellRopePivot.add(bellRope);
  bellRopePivot.position.y = 2.1;
  const bellBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x7a6a3a, roughness: 0.4, metalness: 0.6 })
  );
  bellBody.position.y = 1.65;
  bellGroup.add(bellRopePivot, bellBody);
  bellGroup.position.set(0, 0, BELL_Z);
  group.add(bellGroup);

  // --- 最終鳥居とボスの顔のない人影（本殿手前, z=-14.8） ---
  const FINAL_TORII_Z = DOOR_Z + 2.4;
  const finalTorii = buildToriiGate(2.4, 2.6);
  finalTorii.position.set(0, 0, FINAL_TORII_Z);
  group.add(finalTorii);
  const facelessFigure = buildFacelessFigure();
  facelessFigure.position.set(0, 0, FINAL_TORII_Z - 0.4);
  facelessFigure.visible = false;
  group.add(facelessFigure);

  // --- 参道沿いの案内札（8番出口のように、毎回同じはずのものを並べて密度を作る） ---
  const noticeTextures = [0, 1, 2, 3].map((v) => makeShrineNoticeTexture(v));
  scatterWallDecor(group, halfWidthAt, noticeTextures, {
    zFrom: 10.95,
    zTo: -24,
    step: 3.45,
    width: 0.38,
    height: 0.55,
    y: 1.1,
    skipZRanges: [
      [8.1, 9.9],
      [1.35, 3.15],
      [-2.4, -0.6],
      [-6.9, -5.1],
      [-11.4, -9.6],
      [-16.65, -14.85],
      [-23.4, -21],
    ],
  });
  const arrowTextures = [makeArrowSignTexture("right"), makeArrowSignTexture("left")];
  scatterWallDecor(group, halfWidthAt, arrowTextures, {
    zFrom: 12,
    zTo: -24.3,
    step: 5.7,
    width: 0.3,
    height: 0.15,
    y: 1.9,
  });

  // --- 状態管理 ---
  let heartbeatTimer = 0;
  let heartbeatActive = false;
  let bellHumTimer = 0;
  let bellSwaying = false;

  const runtime: StageRuntime = {
    group,
    bounds,
    spawnPosition: new THREE.Vector3(0, 0, SPAWN_Z),
    spawnYaw: 0,
    doorInteractPoint: new THREE.Vector3(0, 0, DOOR_Z + 1.4),
    startGateInteractPoint: new THREE.Vector3(0, 0, SPAWN_Z + 2.3),
    interactRadius: 1.7,

    applyAnomaly(id: string | null) {
      rebuildEntranceTorii(false);
      lanternR.flame.visible = true;
      lanternR.flameLight.visible = true;
      lanternL.flame.visible = true;
      lanternL.flameLight.visible = true;
      emaMat.map = emaTexNormal;
      emaMat.needsUpdate = true;
      komainuL.headPivot.rotation.y = 0;
      komainuR.headPivot.rotation.y = 0;
      chozuya.waterMat.color.copy(waterColorNormal);
      rebuildShimenawa(SHIDE_DEFAULT_COUNT);
      rebuildSteps(STEPS_DEFAULT_COUNT);
      bellSwaying = false;
      bellHumTimer = 0;
      facelessFigure.visible = false;
      heartbeatActive = false;
      heartbeatTimer = 0;

      switch (id) {
        case "torii_tilt":
          rebuildEntranceTorii(true);
          break;
        case "lantern_extinguish":
          lanternR.flame.visible = false;
          lanternR.flameLight.visible = false;
          break;
        case "ema_message":
          emaMat.map = emaTexAnomaly;
          emaMat.needsUpdate = true;
          break;
        case "komainu_face":
          komainuR.headPivot.rotation.y = Math.PI / 2 + 0.3;
          break;
        case "chozuya_water":
          chozuya.waterMat.color.copy(waterColorAnomaly);
          break;
        case "shimenawa_extra":
          rebuildShimenawa(SHIDE_DEFAULT_COUNT + 4);
          break;
        case "steps_count":
          rebuildSteps(STEPS_DEFAULT_COUNT + 3);
          break;
        case "bell_rope_sway":
          bellSwaying = true;
          audio.playElectricHum();
          break;
        case "footsteps_behind":
          audio.playWhisper();
          break;
        case "faceless_self":
          facelessFigure.visible = true;
          heartbeatActive = true;
          break;
        default:
          break;
      }
    },

    update(dt: number) {
      if (bellSwaying) {
        bellRopePivot.rotation.z = Math.sin(performance.now() * 0.006) * 0.18;
        bellHumTimer -= dt;
        if (bellHumTimer <= 0) {
          bellHumTimer = 1.8 + Math.random() * 1.5;
          audio.playElectricHum();
        }
      } else {
        bellRopePivot.rotation.z *= 0.9;
      }

      if (heartbeatActive) {
        heartbeatTimer -= dt;
        if (heartbeatTimer <= 0) {
          const interval = audio.playHeartbeat(80) ?? 0.75;
          heartbeatTimer = interval;
        }
      }
    },

    dispose() {
      pathTex.dispose();
      hedgeTex.dispose();
      skyTex.dispose();
      signTexNormal.dispose();
      emaTexNormal.dispose();
      emaTexAnomaly.dispose();
      emaDecorTex.dispose();
      for (const t of noticeTextures) t.dispose();
      for (const t of arrowTextures) t.dispose();
    },
  };

  return runtime;
}

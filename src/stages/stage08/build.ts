import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeVillagePathTexture,
  makeVillageRoofTexture,
  makeVillageWindowTexture,
  makeWoodPlankTexture,
  makeNightSkyTexture,
  makeSignTexture,
  makeArrowSignTexture,
  makeScarecrowFaceTexture,
  makeLaundrySheetTexture,
  makeVillageBulletinTexture,
  buildVillageHouse,
  buildWoodenFenceWall,
  buildWell,
  buildJizoStatue,
  buildScarecrow,
  buildLaundryLine,
  buildVillageBulletinBoard,
  buildVillageBell,
  buildPaperLantern,
  buildVillagerFigure,
  type VillageHouseHandle,
  type ScarecrowHandle,
  type LaundryLineHandle,
  type VillageBulletinHandle,
  type VillageBellHandle,
  type PaperLanternHandle,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign, scatterWallDecor } from "../shared/corridorBuilder";

const Z_MIN = -25.5;
const Z_MAX = 17.25;
const SPAWN_Z = 12.75;
const DOOR_Z = -24.6;
// 8番出口のような「一本道」を再現するため、村道の幅は一定にする
const HALF_WIDTH = 1.7;

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

export function buildStage08(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const pathTex = makeVillagePathTexture();
  const skyTex = makeNightSkyTexture();
  const roofTex = makeVillageRoofTexture();
  const houseWallTex = makeWoodPlankTexture("#4a3c2a");
  const fenceWoodTex = makeWoodPlankTexture("#5a4a34");

  const pathMat = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.95, metalness: 0 });
  const invisibleWallMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const skyMat = new THREE.MeshStandardMaterial({ map: skyTex, roughness: 1, emissive: 0x08080c, emissiveIntensity: 0.6 });

  // --- 村道本体（屋外のため天井は高く夜空として扱う） ---
  const { group, bounds } = buildCorridorShell({
    zMin: Z_MIN,
    zMax: Z_MAX,
    halfWidthAt,
    wallMat: invisibleWallMat,
    floorMat: pathMat,
    ceilMat: skyMat,
    ceilingHeight: 5,
  });
  group.name = "stage08";

  // --- 朽ちた木塀（壁の代わり） ---
  const FENCE_LENGTH = Z_MAX - Z_MIN;
  const FENCE_CENTER_Z = (Z_MAX + Z_MIN) / 2;
  const FENCE_HEIGHT = 2.1;
  const fenceRight = buildWoodenFenceWall(FENCE_LENGTH, FENCE_HEIGHT, fenceWoodTex);
  fenceRight.position.set(HALF_WIDTH, 0, FENCE_CENTER_Z);
  const fenceLeft = buildWoodenFenceWall(FENCE_LENGTH, FENCE_HEIGHT, fenceWoodTex);
  fenceLeft.position.set(-HALF_WIDTH, 0, FENCE_CENTER_Z);
  group.add(fenceRight, fenceLeft);

  // --- 村灯り ---
  const lightZs = [11, 5, -1, -7, -13, -19, -24];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs, 2.4, 6.8, 0xffcf8a);

  // --- 出口ゲートと看板 ---
  const signTexNormal = makeSignTexture("EXIT", "#ff2a2a");
  const { doorFrame, signPlane } = buildDoorAndSign(DOOR_Z, signTexNormal, 0x3a2f26);
  group.add(doorFrame, signPlane);

  // --- 廃屋（z=9, 右） ---
  const HOUSE_Z = 9;
  const windowTexNormal = makeVillageWindowTexture(false);
  const windowTexFace = makeVillageWindowTexture(true);
  const house: VillageHouseHandle = buildVillageHouse(houseWallTex, roofTex, windowTexNormal);
  house.group.position.set(HALF_WIDTH - 0.65, 0, HOUSE_Z);
  house.group.rotation.y = sideRotationY(1);
  group.add(house.group);

  // --- 吊り提灯（通路沿いに点在。1つだけ異変で色が変わる） ---
  const LANTERN_ZS = [13, 5.5, 1.5, -5, -9.5, -13.5, -17.5, -21];
  const LANTERN_ANOMALY_INDEX = 2;
  const lanterns: PaperLanternHandle[] = LANTERN_ZS.map((z, i) => {
    const lantern = buildPaperLantern();
    const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
    lantern.group.position.set(side * (HALF_WIDTH - 0.2), 1.95, z);
    group.add(lantern.group);
    return lantern;
  });
  const lanternColorNormal = lanterns[LANTERN_ANOMALY_INDEX].lampMat.emissive.clone();
  const lanternColorAnomaly = new THREE.Color(0x8a0a0a);

  // --- 井戸（z=1, 左） ---
  const WELL_Z = 1;
  const well = buildWell();
  well.position.set(-(HALF_WIDTH - 0.55), 0, WELL_Z);
  group.add(well);

  // --- 地蔵（z=-3, 右。普段3体、異変時は4体） ---
  const JIZO_Z = -3;
  const jizoGroup = new THREE.Group();
  jizoGroup.position.set(HALF_WIDTH - 0.4, 0, JIZO_Z);
  jizoGroup.rotation.y = sideRotationY(1);
  const jizoSpacing = 0.26;
  const jizoCount = 3;
  for (let i = 0; i < jizoCount; i++) {
    const jizo = buildJizoStatue();
    jizo.position.x = (i - (jizoCount - 1) / 2) * jizoSpacing;
    jizoGroup.add(jizo);
  }
  const extraJizo = buildJizoStatue();
  extraJizo.position.x = ((jizoCount - 1) / 2 + 1) * jizoSpacing;
  extraJizo.visible = false;
  jizoGroup.add(extraJizo);
  group.add(jizoGroup);

  // --- 案山子（z=-7, 左） ---
  const SCARECROW_Z = -7;
  const scarecrowFaceTexBlank = makeScarecrowFaceTexture(false);
  const scarecrowFaceTexFace = makeScarecrowFaceTexture(true);
  const scarecrow: ScarecrowHandle = buildScarecrow(scarecrowFaceTexBlank);
  scarecrow.group.position.set(-(HALF_WIDTH - 0.45), 0, SCARECROW_Z);
  scarecrow.group.rotation.y = sideRotationY(-1);
  group.add(scarecrow.group);

  // --- 村の掲示板（z=-11, 右） ---
  const BULLETIN_Z = -11;
  const bulletinTexNormal = makeVillageBulletinTexture("normal");
  const bulletinTexPhoto = makeVillageBulletinTexture("photo");
  const bulletin: VillageBulletinHandle = buildVillageBulletinBoard(bulletinTexNormal);
  bulletin.group.position.set(HALF_WIDTH - 0.3, 0, BULLETIN_Z);
  bulletin.group.rotation.y = sideRotationY(1);
  group.add(bulletin.group);

  // --- 物干し竿（z=-15, 左） ---
  const LAUNDRY_Z = -15;
  const laundryTexPlain = makeLaundrySheetTexture(false);
  const laundryTexShadow = makeLaundrySheetTexture(true);
  const laundry: LaundryLineHandle = buildLaundryLine(laundryTexPlain);
  laundry.group.position.set(-(HALF_WIDTH - 0.65), 0, LAUNDRY_Z);
  laundry.group.rotation.y = sideRotationY(-1);
  group.add(laundry.group);

  // --- 鐘楼（z=-19, 右） ---
  const BELL_Z = -19;
  const villageBell: VillageBellHandle = buildVillageBell();
  villageBell.group.position.set(HALF_WIDTH - 0.6, 0, BELL_Z);
  group.add(villageBell.group);

  // --- 名前を知る村人（SPECIAL, z=-21.5, 左） ---
  const SPECIAL_VILLAGER_Z = -21.5;
  const specialVillager = buildVillagerFigure();
  specialVillager.position.set(-(HALF_WIDTH - 0.5), 0, SPECIAL_VILLAGER_Z);
  specialVillager.rotation.y = sideRotationY(-1);
  group.add(specialVillager);
  const specialVillagerBaseYaw = specialVillager.rotation.y;

  // --- ボス: 出口前に集まった村人たち（z=DOOR_Z+2.4） ---
  const BOSS_Z = DOOR_Z + 2.4;
  const VILLAGER_OFFSETS = [-0.45, 0, 0.45];
  const gatheredVillagers = VILLAGER_OFFSETS.map((dx) => {
    const villager = buildVillagerFigure();
    villager.position.set(dx, 0, BOSS_Z);
    villager.visible = false;
    group.add(villager);
    return villager;
  });
  const villagersGroupPos = new THREE.Vector3(0, 0, BOSS_Z);
  let villagersCharging = false;
  let villagersFootstepTimer = 0;

  // --- 村道沿いの立て看板 ---
  const arrowTextures = [makeArrowSignTexture("right"), makeArrowSignTexture("left")];
  scatterWallDecor(group, halfWidthAt, arrowTextures, {
    zFrom: 12,
    zTo: -24.3,
    step: 5.9,
    width: 0.34,
    height: 0.17,
    y: 1.85,
    skipZRanges: [
      [8, 10],
      [-2, 0],
      [-8, -6],
      [-20, -18],
    ],
  });

  // --- 状態管理 ---
  let heartbeatTimer = 0;
  let heartbeatActive = false;
  let bellSwaying = false;
  let villagerWatching = false;

  const runtime: StageRuntime = {
    group,
    bounds,
    spawnPosition: new THREE.Vector3(0, 0, SPAWN_Z),
    spawnYaw: 0,
    doorInteractPoint: new THREE.Vector3(0, 0, DOOR_Z + 1.4),
    startGateInteractPoint: new THREE.Vector3(0, 0, SPAWN_Z + 2.3),
    interactRadius: 1.7,

    applyAnomaly(id: string | null) {
      house.windowMat.map = windowTexNormal;
      house.windowMat.needsUpdate = true;
      lanterns[LANTERN_ANOMALY_INDEX].lampMat.emissive.copy(lanternColorNormal);
      extraJizo.visible = false;
      scarecrow.faceMat.map = scarecrowFaceTexBlank;
      scarecrow.faceMat.needsUpdate = true;
      bulletin.boardMat.map = bulletinTexNormal;
      bulletin.boardMat.needsUpdate = true;
      laundry.sheetMat.map = laundryTexPlain;
      laundry.sheetMat.needsUpdate = true;
      bellSwaying = false;
      villagerWatching = false;
      specialVillager.rotation.y = specialVillagerBaseYaw;
      for (const v of gatheredVillagers) v.visible = false;
      villagersGroupPos.set(0, 0, BOSS_Z);
      for (let i = 0; i < gatheredVillagers.length; i++) {
        gatheredVillagers[i].position.set(VILLAGER_OFFSETS[i], 0, BOSS_Z);
        gatheredVillagers[i].rotation.y = 0;
      }
      villagersCharging = false;
      villagersFootstepTimer = 0;
      heartbeatActive = false;
      heartbeatTimer = 0;

      switch (id) {
        case "house_window_figure":
          house.windowMat.map = windowTexFace;
          house.windowMat.needsUpdate = true;
          break;
        case "lantern_color_wrong":
          lanterns[LANTERN_ANOMALY_INDEX].lampMat.emissive.copy(lanternColorAnomaly);
          break;
        case "well_sound":
          audio.playWhisper();
          break;
        case "jizo_count_wrong":
          extraJizo.visible = true;
          break;
        case "scarecrow_face":
          scarecrow.faceMat.map = scarecrowFaceTexFace;
          scarecrow.faceMat.needsUpdate = true;
          break;
        case "bulletin_board_photo":
          bulletin.boardMat.map = bulletinTexPhoto;
          bulletin.boardMat.needsUpdate = true;
          break;
        case "laundry_shape":
          laundry.sheetMat.map = laundryTexShadow;
          laundry.sheetMat.needsUpdate = true;
          break;
        case "village_bell_rings":
          bellSwaying = true;
          audio.playKnock();
          break;
        case "villager_knows_name":
          villagerWatching = true;
          audio.playWhisper();
          break;
        case "villagers_gathered":
          for (const v of gatheredVillagers) v.visible = true;
          villagersCharging = true;
          heartbeatActive = true;
          break;
        default:
          break;
      }
    },

    update(dt: number, playerPos: THREE.Vector3) {
      if (villagersCharging) {
        const dx = playerPos.x - villagersGroupPos.x;
        const dz = playerPos.z - villagersGroupPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > BOSS_CHARGE_STOP_DIST) {
          villagersGroupPos.x += (dx / dist) * BOSS_CHARGE_SPEED * dt;
          villagersGroupPos.z += (dz / dist) * BOSS_CHARGE_SPEED * dt;
          const yaw = Math.atan2(dx, dz);
          for (let i = 0; i < gatheredVillagers.length; i++) {
            gatheredVillagers[i].position.set(villagersGroupPos.x + VILLAGER_OFFSETS[i], 0, villagersGroupPos.z);
            gatheredVillagers[i].rotation.y = yaw;
          }
        }
        villagersFootstepTimer -= dt;
        if (villagersFootstepTimer <= 0) {
          villagersFootstepTimer = BOSS_CHARGE_FOOTSTEP_INTERVAL;
          audio.playFootstep();
        }
      }

      if (bellSwaying) {
        villageBell.ropePivot.rotation.z = Math.sin(performance.now() * 0.005) * 0.3;
      } else {
        villageBell.ropePivot.rotation.z *= 0.9;
      }

      if (villagerWatching) {
        const offset = THREE.MathUtils.clamp((playerPos.z - SPECIAL_VILLAGER_Z) * 0.3, -1.1, 1.1);
        specialVillager.rotation.y = THREE.MathUtils.lerp(specialVillager.rotation.y, specialVillagerBaseYaw + offset, Math.min(1, dt * 1.8));
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
      skyTex.dispose();
      roofTex.dispose();
      houseWallTex.dispose();
      fenceWoodTex.dispose();
      signTexNormal.dispose();
      windowTexNormal.dispose();
      windowTexFace.dispose();
      scarecrowFaceTexBlank.dispose();
      scarecrowFaceTexFace.dispose();
      bulletinTexNormal.dispose();
      bulletinTexPhoto.dispose();
      laundryTexPlain.dispose();
      laundryTexShadow.dispose();
      for (const t of arrowTextures) t.dispose();
    },
  };

  return runtime;
}

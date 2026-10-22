import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeSchoolWallTexture,
  makeSchoolFloorTexture,
  makeCeilingTexture,
  makeSignTexture,
  makeChalkboardTexture,
  makeClassPortraitTexture,
  makeShoeCubbyTexture,
  makeSchoolNoticeTexture,
  makeArrowSignTexture,
  makeRoomNumberTexture,
  buildLockerRow,
  buildDeskRow,
  buildStudentFigure,
  buildNurseSpeaker,
  buildSchoolDoorPanel,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign, scatterWallDecor } from "../shared/corridorBuilder";

const Z_MIN = -25.5;
const Z_MAX = 16.5;
const SPAWN_Z = 12;
const DOOR_Z = -24.6;
// 8番出口のような「一本道」を再現するため、通路幅は一定にする
const HALF_WIDTH = 1.3;

function halfWidthAt(_z: number): number {
  return HALF_WIDTH;
}

const DESK_DEFAULT_COUNT = 4;

/**
 * 教室の窓（枠+ガラス+奥の黒板+机+生徒シルエット）を1セット組み立てる。
 * STAGE03内の2箇所（通常の異変用/ボス用）で使い回す。
 */
function buildClassroomWindow() {
  const group = new THREE.Group();

  // 窓枠は中が空いた「縁」のみ（4本の棒）で構成し、奥の教室が見えるようにする
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.7 });
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 0.04), frameMat);
  frameTop.position.y = 0.51;
  const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 0.04), frameMat);
  frameBottom.position.y = -0.51;
  const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.04), frameMat);
  frameLeft.position.x = -0.46;
  const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.04), frameMat);
  frameRight.position.x = 0.46;
  group.add(frameTop, frameBottom, frameLeft, frameRight);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x9fc2d8,
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.9), glassMat);
  glass.position.z = 0.05;
  group.add(glass);

  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.03), frameMat);
  vBar.position.z = 0.055;
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.03), frameMat);
  hBar.position.z = 0.055;
  group.add(vBar, hBar);

  // 奥行きは「壁の実体に突き当たらない」浅い範囲(数cm)に収め、
  // 窓越しに常に見えるようにする（壁本体のメッシュがこの手前にあるため）
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x242220, roughness: 0.95 })
  );
  backWall.position.z = -0.1;
  group.add(backWall);

  const chalkboardMat = new THREE.MeshBasicMaterial({ map: makeChalkboardTexture(""), toneMapped: false });
  const chalkboard = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.3), chalkboardMat);
  chalkboard.position.set(0, 0.15, -0.09);
  group.add(chalkboard);

  const deskSlot = new THREE.Group();
  deskSlot.position.set(0, -0.55, -0.06);
  group.add(deskSlot);
  function rebuildDesks(count: number) {
    deskSlot.clear();
    if (count > 0) deskSlot.add(buildDeskRow(count));
  }
  rebuildDesks(DESK_DEFAULT_COUNT);

  const silhouette = buildStudentFigure();
  silhouette.scale.set(0.5, 0.45, 0.5);
  silhouette.position.set(0.12, -0.72, -0.04);
  silhouette.visible = false;
  group.add(silhouette);

  return { group, chalkboardMat, rebuildDesks, silhouette };
}

export function buildStage03(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const wallTex = makeSchoolWallTexture();
  wallTex.repeat.set(1, 2);
  const floorTex = makeSchoolFloorTexture();
  const ceilTex = makeCeilingTexture();

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92, metalness: 0.02 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8, metalness: 0.03 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 1 });

  // --- 通路本体 ---
  const { group, bounds } = buildCorridorShell({ zMin: Z_MIN, zMax: Z_MAX, halfWidthAt, wallMat, floorMat, ceilMat });
  group.name = "stage03";

  // --- 天井の蛍光灯 ---
  const lightZs = [9, 4.5, 0, -5.25, -11.25, -16.5, -21.75];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs);
  const flickerLight = lightEntries[4]; // z = -11.25

  // --- 出口扉と看板 ---
  const signTexNormal = makeSignTexture("EXIT", "#ff2a2a");
  const { doorFrame, signPlane } = buildDoorAndSign(DOOR_Z, signTexNormal);
  group.add(doorFrame, signPlane);

  // --- 下駄箱（START付近, z=9.45） ---
  const SHOE_Z = 9.45;
  const shoeTexNormal = makeShoeCubbyTexture(false);
  const shoeTexAnomaly = makeShoeCubbyTexture(true);
  const shoeMat = new THREE.MeshBasicMaterial({ map: shoeTexNormal, toneMapped: false });
  const shoePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.65), shoeMat);
  shoePlane.position.set(-(halfWidthAt(SHOE_Z) - 0.04), 1.05, SHOE_Z);
  shoePlane.rotation.y = Math.PI / 2;
  group.add(shoePlane);

  // --- 集合写真（反対側の壁, z=5.25） ---
  const PORTRAIT_Z = 5.25;
  const portraitTexNormal = makeClassPortraitTexture(false);
  const portraitTexAnomaly = makeClassPortraitTexture(true);
  const portraitMat = new THREE.MeshBasicMaterial({ map: portraitTexNormal, toneMapped: false });
  const portraitPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.63), portraitMat);
  portraitPlane.position.set(halfWidthAt(PORTRAIT_Z) - 0.04, 1.5, PORTRAIT_Z);
  portraitPlane.rotation.y = -Math.PI / 2;
  group.add(portraitPlane);

  // --- ロッカー列（z=1.2） ---
  const LOCKER_Z = 1.2;
  const LOCKER_COUNT = 5;
  const lockerSlot = new THREE.Group();
  lockerSlot.position.set(-(halfWidthAt(LOCKER_Z) - 0.16), 0, LOCKER_Z + ((LOCKER_COUNT - 1) * 0.32) / 2);
  lockerSlot.rotation.y = Math.PI / 2;
  lockerSlot.scale.setScalar(1.25);
  group.add(lockerSlot);
  function rebuildLockers(ajarIndex: number | null) {
    lockerSlot.clear();
    lockerSlot.add(buildLockerRow(LOCKER_COUNT, ajarIndex));
  }
  rebuildLockers(null);

  // --- 教室の窓A（異変の主舞台, z=-3） ---
  const WINDOW_A_Z = -3;
  const windowA = buildClassroomWindow();
  windowA.group.position.set(halfWidthAt(WINDOW_A_Z) - 0.22, 1.35, WINDOW_A_Z);
  windowA.group.rotation.y = -Math.PI / 2;
  windowA.group.scale.setScalar(1.25);
  group.add(windowA.group);
  const chalkboardBlankTex = makeChalkboardTexture("");
  const chalkboardMessageTex = makeChalkboardTexture("おかえり");
  let windowSilhouetteHiddenByProximity = false;

  // --- 窓に映る影（z=-9） ---
  const REFLECT_Z = -9;
  const reflectHalfWidth = halfWidthAt(REFLECT_Z);
  const reflectFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.1, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 })
  );
  const reflectGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 1.0),
    new THREE.MeshStandardMaterial({
      color: 0x1a2230,
      roughness: 0.08,
      metalness: 0.85,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })
  );
  reflectGlass.position.z = 0.03;
  reflectFrame.add(reflectGlass);
  reflectFrame.position.set(reflectHalfWidth - 0.06, 1.3, REFLECT_Z);
  reflectFrame.rotation.y = -Math.PI / 2;
  reflectFrame.scale.setScalar(1.25);
  group.add(reflectFrame);

  const reflectFigure = buildStudentFigure();
  reflectFigure.scale.set(0.5, 0.5, 0.02);
  reflectFigure.position.set(reflectHalfWidth - 0.02, 0.55, REFLECT_Z);
  reflectFigure.rotation.y = -Math.PI / 2;
  reflectFigure.visible = false;
  group.add(reflectFigure);

  // --- 放送スピーカー（天井, z=-16.5） ---
  const speaker = buildNurseSpeaker();
  speaker.position.set(0, 2.45, -16.5);
  speaker.rotation.x = Math.PI / 2;
  speaker.scale.setScalar(1.25);
  group.add(speaker);

  // --- 教室の窓B（ボス異変専用, ドア手前 z=-14.8） ---
  const WINDOW_B_Z = DOOR_Z + 2.4;
  const windowB = buildClassroomWindow();
  windowB.group.position.set(-(halfWidthAt(WINDOW_B_Z) - 0.22), 1.35, WINDOW_B_Z);
  windowB.group.rotation.y = Math.PI / 2;
  windowB.group.scale.setScalar(1.25);
  group.add(windowB.group);
  const bossChalkboardTex = makeChalkboardTexture("おかえりなさい");

  // --- 壁沿いの掲示物（8番出口のように、毎回同じはずのものを並べて密度を作る） ---
  const noticeTextures = [0, 1, 2, 3].map((v) => makeSchoolNoticeTexture(v));
  scatterWallDecor(group, halfWidthAt, noticeTextures, {
    zFrom: 10.95,
    zTo: -23.7,
    step: 3.15,
    width: 0.5,
    height: 0.69,
    y: 1.3,
    skipZRanges: [
      [8.55, 10.35],
      [4.35, 6.15],
      [-0.3, 2.85],
      [-4.2, -1.8],
      [-10.2, -7.8],
      [-23.4, -21],
    ],
  });
  const arrowTextures = [makeArrowSignTexture("right"), makeArrowSignTexture("left")];
  scatterWallDecor(group, halfWidthAt, arrowTextures, {
    zFrom: 12.45,
    zTo: -24,
    step: 5.4,
    width: 0.4,
    height: 0.2,
    y: 2.0,
  });
  // 番号だけのプレートではなく、実際の引き戸の形（枠+ガラス窓+腰板+取っ手）を持たせる。
  const classDoorTextures = ["1-A", "1-B", "1-C", "1-D"].map((t) => makeRoomNumberTexture(t, false));
  const classDoorSkipZRanges: [number, number][] = [
    [-10.2, -7.8],
    [-23.4, -21],
  ];
  let classDoorSide: 1 | -1 = 1;
  let classDoorTexIndex = 0;
  for (let z = -5.4; z >= -20.4; z -= 4.2) {
    const skipped = classDoorSkipZRanges.some(([lo, hi]) => z >= lo && z <= hi);
    if (!skipped) {
      const hw = halfWidthAt(z);
      const doorHandle = buildSchoolDoorPanel(classDoorTextures[classDoorTexIndex % classDoorTextures.length]);
      if (classDoorSide === 1) {
        doorHandle.group.position.set(hw - 0.03, 1.0, z);
        doorHandle.group.rotation.y = -Math.PI / 2;
      } else {
        doorHandle.group.position.set(-(hw - 0.03), 1.0, z);
        doorHandle.group.rotation.y = Math.PI / 2;
      }
      doorHandle.group.scale.setScalar(1.25);
      group.add(doorHandle.group);
      classDoorTexIndex += 1;
    }
    classDoorSide = classDoorSide === 1 ? -1 : 1;
  }

  // --- 状態管理 ---
  let heartbeatTimer = 0;
  let heartbeatActive = false;
  let electricHumTimer = 0;

  const runtime: StageRuntime = {
    group,
    bounds,
    spawnPosition: new THREE.Vector3(0, 0, SPAWN_Z),
    spawnYaw: 0,
    doorInteractPoint: new THREE.Vector3(0, 0, DOOR_Z + 1.4),
    startGateInteractPoint: new THREE.Vector3(0, 0, SPAWN_Z + 2.3),
    interactRadius: 1.7,

    applyAnomaly(id: string | null) {
      shoeMat.map = shoeTexNormal;
      shoeMat.needsUpdate = true;
      portraitMat.map = portraitTexNormal;
      portraitMat.needsUpdate = true;
      rebuildLockers(null);
      windowA.rebuildDesks(DESK_DEFAULT_COUNT);
      windowA.silhouette.visible = false;
      windowSilhouetteHiddenByProximity = false;
      windowA.chalkboardMat.map = chalkboardBlankTex;
      windowA.chalkboardMat.needsUpdate = true;
      lighting.setFlicker(flickerLight, false);
      reflectFigure.visible = false;
      windowB.silhouette.visible = false;
      windowB.chalkboardMat.map = chalkboardBlankTex;
      windowB.chalkboardMat.needsUpdate = true;
      heartbeatActive = false;
      heartbeatTimer = 0;

      switch (id) {
        case "shoe_extra":
          shoeMat.map = shoeTexAnomaly;
          shoeMat.needsUpdate = true;
          break;
        case "portrait_stranger":
          portraitMat.map = portraitTexAnomaly;
          portraitMat.needsUpdate = true;
          break;
        case "locker_ajar":
          rebuildLockers(2);
          audio.playKnock();
          break;
        case "desk_increase":
          windowA.rebuildDesks(DESK_DEFAULT_COUNT + 4);
          break;
        case "window_silhouette":
          windowA.silhouette.visible = true;
          break;
        case "chalkboard_message":
          windowA.chalkboardMat.map = chalkboardMessageTex;
          windowA.chalkboardMat.needsUpdate = true;
          break;
        case "hallway_light_flicker":
          lighting.setFlicker(flickerLight, true);
          audio.playElectricHum();
          break;
        case "corridor_whisper":
          audio.playWhisper();
          break;
        case "window_reflection":
          reflectFigure.visible = true;
          audio.playWhisper();
          break;
        case "nonexistent_student":
          windowB.silhouette.visible = true;
          windowB.chalkboardMat.map = bossChalkboardTex;
          windowB.chalkboardMat.needsUpdate = true;
          heartbeatActive = true;
          break;
        default:
          break;
      }
    },

    update(dt: number, playerPos: THREE.Vector3) {
      if (windowA.silhouette.visible && !windowSilhouetteHiddenByProximity) {
        if (Math.abs(playerPos.z - WINDOW_A_Z) < 2.2) {
          windowSilhouetteHiddenByProximity = true;
          windowA.silhouette.visible = false;
        }
      }

      if (heartbeatActive) {
        heartbeatTimer -= dt;
        if (heartbeatTimer <= 0) {
          const interval = audio.playHeartbeat(82) ?? 0.75;
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
      shoeTexNormal.dispose();
      shoeTexAnomaly.dispose();
      portraitTexNormal.dispose();
      portraitTexAnomaly.dispose();
      chalkboardBlankTex.dispose();
      chalkboardMessageTex.dispose();
      bossChalkboardTex.dispose();
      for (const t of noticeTextures) t.dispose();
      for (const t of arrowTextures) t.dispose();
      for (const t of classDoorTextures) t.dispose();
    },
  };

  return runtime;
}

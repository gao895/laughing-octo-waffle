import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeParkPathTexture,
  makeNightSkyTexture,
  makeSignTexture,
  makeParkNoticeTexture,
  makeArrowSignTexture,
  makeCarouselCanopyTexture,
  makeCutoutBoardTexture,
  makePrizeShelfTexture,
  makeMascotFaceTexture,
  makeWoodPlankTexture,
  makeShutterTexture,
  makeRustMetalTexture,
  buildTicketBooth,
  buildCarousel,
  buildCutoutBoard,
  buildMascotStatue,
  buildBalloonCart,
  buildFerrisWheel,
  buildMascotCostumeFigure,
  buildRustedFenceWall,
  type CarouselHandle,
  type CutoutBoardHandle,
  type MascotStatueHandle,
  type BalloonCartHandle,
  type MascotCostumeHandle,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign, scatterWallDecor } from "../shared/corridorBuilder";

const Z_MIN = -25.5;
const Z_MAX = 17.25;
const SPAWN_Z = 12.75;
const DOOR_Z = -24.6;
// 8番出口のような「一本道」を再現するため、園内通路の幅は一定にする
const HALF_WIDTH = 1.8;

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

const HORSE_COUNT = 5;
const REVERSE_HORSE_INDEX = 1;

export function buildStage07(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const pathTex = makeParkPathTexture();
  const skyTex = makeNightSkyTexture();

  const pathMat = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.95, metalness: 0 });
  // 壁本体は骨組みフェンスに置き換えるため不可視にし、構造上の境界(衝突判定用)としてのみ残す
  const invisibleWallMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const skyMat = new THREE.MeshStandardMaterial({ map: skyTex, roughness: 1, emissive: 0x08080c, emissiveIntensity: 0.6 });

  // --- 園内通路本体（屋外のため天井は高く夜空として扱う） ---
  const { group, bounds } = buildCorridorShell({
    zMin: Z_MIN,
    zMax: Z_MAX,
    halfWidthAt,
    wallMat: invisibleWallMat,
    floorMat: pathMat,
    ceilMat: skyMat,
    ceilingHeight: 6,
  });
  group.name = "stage07";

  // --- 錆びた骨組みだけのフェンス（壁の代わり。隙間から奥の暗闇が見える） ---
  const FENCE_LENGTH = Z_MAX - Z_MIN;
  const FENCE_CENTER_Z = (Z_MAX + Z_MIN) / 2;
  const FENCE_HEIGHT = 2.5;
  const rustTex = makeRustMetalTexture();
  const fenceRight = buildRustedFenceWall(FENCE_LENGTH, FENCE_HEIGHT, rustTex);
  fenceRight.position.set(HALF_WIDTH, 0, FENCE_CENTER_Z);
  const fenceLeft = buildRustedFenceWall(FENCE_LENGTH, FENCE_HEIGHT, rustTex);
  fenceLeft.position.set(-HALF_WIDTH, 0, FENCE_CENTER_Z);
  group.add(fenceRight, fenceLeft);

  // --- 園内灯（ぼんやりと暖色の裸電球） ---
  const lightZs = [12, 6, 0, -6, -12, -18, -24];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs, 2.6, 7.5, 0xffb347);

  // --- 出口ゲートと看板 ---
  const signTexNormal = makeSignTexture("EXIT", "#ff2a2a");
  const { doorFrame, signPlane } = buildDoorAndSign(DOOR_Z, signTexNormal, 0x3a2f26);
  group.add(doorFrame, signPlane);

  // --- 入園アーチ（z=14.25, 装飾のみ） ---
  const ARCH_Z = 14.25;
  const archMat = new THREE.MeshStandardMaterial({ color: 0x7a1c1c, roughness: 0.7 });
  const archPillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 8), archMat);
  archPillarL.position.set(-(HALF_WIDTH - 0.15), 1.3, ARCH_Z);
  const archPillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 8), archMat);
  archPillarR.position.set(HALF_WIDTH - 0.15, 1.3, ARCH_Z);
  const archBeam = new THREE.Mesh(new THREE.BoxGeometry(HALF_WIDTH * 2 - 0.1, 0.22, 0.22), archMat);
  archBeam.position.set(0, 2.5, ARCH_Z);
  const archSignTex = makeSignTexture("WONDER", "#ffd94a");
  const archSign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.35), new THREE.MeshBasicMaterial({ map: archSignTex, toneMapped: false }));
  archSign.position.set(0, 2.5, ARCH_Z - 0.12);
  group.add(archPillarL, archPillarR, archBeam, archSign);

  // --- チケットブース（z=9, 右） ---
  const TICKET_Z = 9;
  const ticketSignTex = makeSignTexture("TICKET", "#ffcc33");
  const ticketWoodTex = makeWoodPlankTexture("#8a6a3a");
  const ticketShutterTex = makeShutterTexture();
  const ticketBooth = buildTicketBooth(ticketSignTex, ticketWoodTex, ticketShutterTex);
  ticketBooth.group.position.set(HALF_WIDTH - 0.55, 0, TICKET_Z);
  ticketBooth.group.rotation.y = sideRotationY(1);
  group.add(ticketBooth.group);

  // --- メリーゴーランド（z=4.5, 左） ---
  const CAROUSEL_Z = 4.5;
  const canopyTex = makeCarouselCanopyTexture();
  const carouselBaseTex = makeWoodPlankTexture("#6a5a3a");
  const carousel: CarouselHandle = buildCarousel(0.55, HORSE_COUNT, canopyTex, carouselBaseTex);
  carousel.group.position.set(-(HALF_WIDTH - 0.85), 0, CAROUSEL_Z);
  group.add(carousel.group);

  // --- 顔抜き看板（z=0.75, 右） ---
  const CUTOUT_Z = 0.75;
  const cutoutTexNormal = makeCutoutBoardTexture(false);
  const cutoutTexFace = makeCutoutBoardTexture(true);
  const cutoutWoodTex = makeWoodPlankTexture("#caa15a");
  const cutoutBoard: CutoutBoardHandle = buildCutoutBoard(cutoutTexNormal, cutoutWoodTex);
  cutoutBoard.group.position.set(HALF_WIDTH - 0.3, 0, CUTOUT_Z);
  cutoutBoard.group.rotation.y = sideRotationY(1);
  group.add(cutoutBoard.group);

  // --- 射的屋台（z=-3, 左） ---
  const STALL_Z = -3;
  const stallWoodTex = makeWoodPlankTexture("#3a2c1c");
  stallWoodTex.repeat.set(2, 1);
  const stallMat = new THREE.MeshStandardMaterial({ map: stallWoodTex, roughness: 0.85 });
  const stallCounter = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 0.45), stallMat);
  const stallX = -(HALF_WIDTH - 0.45);
  stallCounter.position.set(stallX, 0.25, STALL_Z);
  const stallShutterTex = makeShutterTexture();
  stallShutterTex.repeat.set(3, 1);
  const stallShutter = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.45, 0.04),
    new THREE.MeshStandardMaterial({ map: stallShutterTex, roughness: 0.7, metalness: 0.2 })
  );
  stallShutter.position.set(stallX, 0.73, STALL_Z - 0.2);
  const prizeTexNormal = makePrizeShelfTexture(false);
  const prizeTexAnomaly = makePrizeShelfTexture(true);
  const prizeMat = new THREE.MeshBasicMaterial({ map: prizeTexNormal, toneMapped: false });
  const prizeShelf = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), prizeMat);
  prizeShelf.position.set(stallX + 0.46, 0.75, STALL_Z);
  prizeShelf.rotation.y = sideRotationY(-1);
  group.add(stallCounter, stallShutter, prizeShelf);

  // --- マスコット像（z=-7.5, 右） ---
  const MASCOT_Z = -7.5;
  const mascotFaceTexNormal = makeMascotFaceTexture("normal");
  const mascotFaceTexWide = makeMascotFaceTexture("wide");
  const mascotStatue: MascotStatueHandle = buildMascotStatue(mascotFaceTexNormal);
  mascotStatue.group.position.set(HALF_WIDTH - 0.5, 0, MASCOT_Z);
  mascotStatue.group.rotation.y = sideRotationY(1);
  group.add(mascotStatue.group);
  const headPivotBaseY = mascotStatue.headPivot.rotation.y;

  // --- 風船売り場（z=-11.5, 左） ---
  const BALLOON_Z = -11.5;
  const balloonCartTex = makeWoodPlankTexture("#6a4a2a");
  const balloonCanopyTex = makeCarouselCanopyTexture();
  const balloonSignTex = makeSignTexture("BALLOON", "#ff6ab4");
  const balloonCart: BalloonCartHandle = buildBalloonCart(balloonCartTex, balloonCanopyTex, balloonSignTex);
  balloonCart.group.position.set(-(HALF_WIDTH - 0.5), 0, BALLOON_Z);
  balloonCart.group.rotation.y = sideRotationY(-1);
  group.add(balloonCart.group);
  const balloonColorsNormal = balloonCart.balloonMats.map((m) => m.color.clone());
  const balloonColorDead = new THREE.Color(0x2a2620);

  // --- 観覧車（z=-16.5, 中央奥の背景構造） ---
  const FERRIS_Z = -16.5;
  const FERRIS_RADIUS = 1.3;
  const ferrisWheel = buildFerrisWheel(FERRIS_RADIUS, 8);
  ferrisWheel.position.set(0, 1.95, FERRIS_Z);
  group.add(ferrisWheel);

  // --- ボス: 出口前で待つ着ぐるみ（z=DOOR_Z+2.4） ---
  const BOSS_Z = DOOR_Z + 2.4;
  const costumeFaceTex = makeMascotFaceTexture("wide");
  const mascotCostume: MascotCostumeHandle = buildMascotCostumeFigure(costumeFaceTex);
  mascotCostume.group.position.set(0, 0, BOSS_Z);
  mascotCostume.group.visible = false;
  group.add(mascotCostume.group);
  const mascotCostumeBasePos = mascotCostume.group.position.clone();
  let mascotCostumeCharging = false;
  let mascotCostumeFootstepTimer = 0;

  // --- 園内沿いの立て看板（8番出口のように、毎回同じはずのものを並べて密度を作る） ---
  const noticeTextures = [0, 1, 2, 3].map((v) => makeParkNoticeTexture(v));
  scatterWallDecor(group, halfWidthAt, noticeTextures, {
    zFrom: 10.95,
    zTo: -24,
    step: 3.6,
    width: 0.48,
    height: 0.69,
    y: 1.1,
    skipZRanges: [
      [8.1, 9.9],
      [3.6, 5.4],
      [-0.15, 1.65],
      [-3.9, -2.1],
      [-8.4, -6.6],
      [-12.4, -10.6],
      [-17.4, -15.6],
      [-23.1, -21.3],
    ],
  });
  const arrowTextures = [makeArrowSignTexture("right"), makeArrowSignTexture("left")];
  scatterWallDecor(group, halfWidthAt, arrowTextures, {
    zFrom: 12,
    zTo: -24.3,
    step: 5.7,
    width: 0.38,
    height: 0.19,
    y: 2.2,
  });

  // --- 状態管理 ---
  let heartbeatTimer = 0;
  let heartbeatActive = false;
  let ferrisTurning = false;
  let mascotWatching = false;

  const runtime: StageRuntime = {
    group,
    bounds,
    spawnPosition: new THREE.Vector3(0, 0, SPAWN_Z),
    spawnYaw: 0,
    doorInteractPoint: new THREE.Vector3(0, 0, DOOR_Z + 1.4),
    startGateInteractPoint: new THREE.Vector3(0, 0, SPAWN_Z + 2.3),
    interactRadius: 1.7,

    applyAnomaly(id: string | null) {
      ticketBooth.windowLightMat.emissive.set(0x000000);
      ticketBooth.windowLightMat.emissiveIntensity = 0;
      carousel.horses[REVERSE_HORSE_INDEX].rotation.y = (REVERSE_HORSE_INDEX / HORSE_COUNT) * Math.PI * 2;
      cutoutBoard.faceMat.map = cutoutTexNormal;
      cutoutBoard.faceMat.needsUpdate = true;
      prizeMat.map = prizeTexNormal;
      prizeMat.needsUpdate = true;
      mascotStatue.faceMat.map = mascotFaceTexNormal;
      mascotStatue.faceMat.needsUpdate = true;
      mascotStatue.headPivot.rotation.y = headPivotBaseY;
      mascotWatching = false;
      balloonCart.balloonMats.forEach((m, i) => m.color.copy(balloonColorsNormal[i]));
      ferrisTurning = false;
      ferrisWheel.rotation.z = 0;
      mascotCostume.group.visible = false;
      mascotCostume.group.position.copy(mascotCostumeBasePos);
      mascotCostumeCharging = false;
      mascotCostumeFootstepTimer = 0;
      heartbeatActive = false;
      heartbeatTimer = 0;

      switch (id) {
        case "ticket_booth_light":
          ticketBooth.windowLightMat.emissive.set(0xffdca0);
          ticketBooth.windowLightMat.emissiveIntensity = 1.4;
          break;
        case "carousel_horse_reversed":
          carousel.horses[REVERSE_HORSE_INDEX].rotation.y =
            (REVERSE_HORSE_INDEX / HORSE_COUNT) * Math.PI * 2 + Math.PI;
          break;
        case "cutout_board_face":
          cutoutBoard.faceMat.map = cutoutTexFace;
          cutoutBoard.faceMat.needsUpdate = true;
          break;
        case "prize_shelf_self":
          prizeMat.map = prizeTexAnomaly;
          prizeMat.needsUpdate = true;
          break;
        case "mascot_smile_wide":
          mascotStatue.faceMat.map = mascotFaceTexWide;
          mascotStatue.faceMat.needsUpdate = true;
          break;
        case "balloon_color_wrong":
          balloonCart.balloonMats.forEach((m) => m.color.copy(balloonColorDead));
          break;
        case "ferris_wheel_turning":
          ferrisTurning = true;
          audio.playElectricHum();
          break;
        case "jingle_distorted":
          audio.playWhisper();
          break;
        case "mascot_statue_watching":
          mascotWatching = true;
          break;
        case "costume_person_waiting":
          mascotCostume.group.visible = true;
          mascotCostumeCharging = true;
          heartbeatActive = true;
          break;
        default:
          break;
      }
    },

    update(dt: number, playerPos: THREE.Vector3) {
      if (mascotCostumeCharging) {
        const dx = playerPos.x - mascotCostume.group.position.x;
        const dz = playerPos.z - mascotCostume.group.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > BOSS_CHARGE_STOP_DIST) {
          mascotCostume.group.position.x += (dx / dist) * BOSS_CHARGE_SPEED * dt;
          mascotCostume.group.position.z += (dz / dist) * BOSS_CHARGE_SPEED * dt;
          mascotCostume.group.rotation.y = Math.atan2(dx, dz);
        }
        mascotCostumeFootstepTimer -= dt;
        if (mascotCostumeFootstepTimer <= 0) {
          mascotCostumeFootstepTimer = BOSS_CHARGE_FOOTSTEP_INTERVAL;
          audio.playFootstep();
        }
      }

      if (ferrisTurning) {
        ferrisWheel.rotation.z += dt * 0.25;
      }

      if (mascotWatching) {
        const offset = THREE.MathUtils.clamp((playerPos.z - MASCOT_Z) * 0.35, -0.9, 0.9);
        mascotStatue.headPivot.rotation.y = THREE.MathUtils.lerp(mascotStatue.headPivot.rotation.y, headPivotBaseY + offset, Math.min(1, dt * 2));
      }

      if (heartbeatActive) {
        heartbeatTimer -= dt;
        if (heartbeatTimer <= 0) {
          const interval = audio.playHeartbeat(82) ?? 0.75;
          heartbeatTimer = interval;
        }
      }
    },

    dispose() {
      pathTex.dispose();
      rustTex.dispose();
      skyTex.dispose();
      signTexNormal.dispose();
      archSignTex.dispose();
      ticketSignTex.dispose();
      ticketWoodTex.dispose();
      ticketShutterTex.dispose();
      canopyTex.dispose();
      carouselBaseTex.dispose();
      cutoutTexNormal.dispose();
      cutoutTexFace.dispose();
      cutoutWoodTex.dispose();
      stallWoodTex.dispose();
      stallShutterTex.dispose();
      prizeTexNormal.dispose();
      prizeTexAnomaly.dispose();
      mascotFaceTexNormal.dispose();
      mascotFaceTexWide.dispose();
      balloonCartTex.dispose();
      balloonCanopyTex.dispose();
      balloonSignTex.dispose();
      costumeFaceTex.dispose();
      for (const t of noticeTextures) t.dispose();
      for (const t of arrowTextures) t.dispose();
    },
  };

  return runtime;
}

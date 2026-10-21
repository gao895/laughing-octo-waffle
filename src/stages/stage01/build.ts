import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeConcreteTexture,
  makeTileFloorTexture,
  makeCeilingTexture,
  makeSignTexture,
  makePosterTexture,
  makeClockFaceTexture,
  buildHumanSilhouette,
  buildUmbrella,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign } from "../shared/corridorBuilder";

const Z_MIN = -16.6;
const Z_MAX = 11;
const SPAWN_Z = 8;
const DOOR_Z = -16;
// 8番出口のような「一本道」を再現するため、通路幅は部屋状の膨らみを持たせず一定にする
const HALF_WIDTH = 1.3;

function halfWidthAt(_z: number): number {
  return HALF_WIDTH;
}

export function buildStage01(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const wallTex = makeConcreteTexture("#26282e");
  wallTex.repeat.set(1, 2);
  const floorTex = makeTileFloorTexture();
  const ceilTex = makeCeilingTexture();

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95, metalness: 0.02 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.05 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 1 });

  // --- 通路本体をセグメントごとに生成（可変幅） ---
  const { group, bounds } = buildCorridorShell({ zMin: Z_MIN, zMax: Z_MAX, halfWidthAt, wallMat, floorMat, ceilMat });
  group.name = "stage01";

  // --- 天井の蛍光灯 ---
  const lightZs = [6, 3, -1, -4.5, -8, -12, -15];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs);
  const flickerLight = lightEntries[4]; // z = -8 のライト（room2付近）

  // --- 出口扉と看板 ---
  const signTexNormal = makeSignTexture("EXIT", "#ff2a2a");
  const signTexAnomaly = makeSignTexture("ENTER", "#7a3bff");
  const { doorFrame, signPlane, signMat } = buildDoorAndSign(DOOR_Z, signTexNormal);
  group.add(doorFrame, signPlane);

  // --- 時計（壁掛け, z=4） ---
  const clockGroup = new THREE.Group();
  const clockFaceMat = new THREE.MeshBasicMaterial({ map: makeClockFaceTexture(), toneMapped: false });
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), clockFaceMat);
  clockGroup.add(clockFace);
  const handPivot = new THREE.Object3D();
  const hand = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.26, 0.005),
    new THREE.MeshBasicMaterial({ color: 0xcc1111, toneMapped: false })
  );
  hand.position.y = 0.13;
  handPivot.add(hand);
  handPivot.position.z = 0.01;
  clockGroup.add(handPivot);
  const CLOCK_Z = 4;
  clockGroup.position.set(-(halfWidthAt(CLOCK_Z) - 0.05), 1.7, CLOCK_Z);
  clockGroup.rotation.y = Math.PI / 2;
  group.add(clockGroup);
  let clockDirection = 1;

  // --- ポスター（反対側の壁, z=1） ---
  const posterTexNormal = makePosterTexture(0);
  const posterTexAnomaly = makePosterTexture(1);
  const posterMat = new THREE.MeshBasicMaterial({ map: posterTexNormal, toneMapped: false });
  const posterPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.85), posterMat);
  const POSTER_Z = 1;
  posterPlane.position.set(halfWidthAt(POSTER_Z) - 0.05, 1.3, POSTER_Z);
  posterPlane.rotation.y = -Math.PI / 2;
  group.add(posterPlane);

  // --- 傘立て（START付近, z=6.5） ---
  const umbrellaGroup = new THREE.Group();
  group.add(umbrellaGroup);
  const UMBRELLA_Z = 6.5;
  const umbrellaHalfWidth = halfWidthAt(UMBRELLA_Z);
  function rebuildUmbrellas(count: number) {
    umbrellaGroup.clear();
    for (let i = 0; i < count; i++) {
      const u = buildUmbrella();
      u.position.set(umbrellaHalfWidth - 0.3 + (i % 2) * 0.15, 0, UMBRELLA_Z - Math.floor(i / 2) * 0.22);
      umbrellaGroup.add(u);
    }
  }
  rebuildUmbrellas(2);

  // --- 防犯カメラ（天井中央, z=-2.5） ---
  const cameraGroup = new THREE.Group();
  const camBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.12, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4, metalness: 0.6 })
  );
  const camHeadPivot = new THREE.Object3D();
  const camLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.08, 10),
    new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2, metalness: 0.8 })
  );
  camLens.rotation.x = Math.PI / 2;
  camLens.position.z = 0.13;
  camHeadPivot.add(camBody, camLens);
  cameraGroup.add(camHeadPivot);
  cameraGroup.position.set(0, 2.4, -2.5);
  group.add(cameraGroup);
  let cameraFollowActive = false;

  // --- 鏡（壁掛け, z=-5.5） ---
  const MIRROR_Z = -5.5;
  const mirrorHalfWidth = halfWidthAt(MIRROR_Z);
  const mirrorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.1, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 })
  );
  const mirrorGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.98),
    new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.05, metalness: 0.9 })
  );
  mirrorGlass.position.z = 0.03;
  mirrorFrame.add(mirrorGlass);
  mirrorFrame.position.set(-(mirrorHalfWidth - 0.06), 1.3, MIRROR_Z);
  mirrorFrame.rotation.y = Math.PI / 2;
  group.add(mirrorFrame);

  const mirrorFigure = buildHumanSilhouette(0x0a0a0a, 0.85);
  mirrorFigure.scale.set(0.5, 0.5, 0.02);
  mirrorFigure.position.set(-(mirrorHalfWidth - 0.1), 0.55, MIRROR_Z);
  mirrorFigure.rotation.y = Math.PI / 2;
  mirrorFigure.visible = false;
  group.add(mirrorFigure);

  // --- 通路奥の人影（異変時のみ出現） ---
  const distantFigure = buildHumanSilhouette(0x000000, 1);
  distantFigure.position.set(0.2, 0, -13);
  distantFigure.visible = false;
  group.add(distantFigure);
  let distantFigureHiddenByProximity = false;

  // --- 最終異変：もう一人のプレイヤー ---
  const finalDouble = buildHumanSilhouette(0x000000, 1);
  finalDouble.scale.set(1.05, 1.05, 1.05);
  finalDouble.position.set(0, 0, DOOR_Z + 1.2);
  finalDouble.visible = false;
  group.add(finalDouble);

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
      clockDirection = 1;
      cameraFollowActive = false;
      lighting.setFlicker(flickerLight, false);
      signMat.map = signTexNormal;
      signMat.needsUpdate = true;
      distantFigure.visible = false;
      distantFigureHiddenByProximity = false;
      rebuildUmbrellas(2);
      posterMat.map = posterTexNormal;
      posterMat.needsUpdate = true;
      mirrorFigure.visible = false;
      finalDouble.visible = false;
      heartbeatActive = false;
      heartbeatTimer = 0;

      switch (id) {
        case "clock_reverse":
          clockDirection = -1;
          break;
        case "camera_follow":
          cameraFollowActive = true;
          break;
        case "light_flicker":
          lighting.setFlicker(flickerLight, true);
          audio.playElectricHum();
          break;
        case "exit_text_swap":
          signMat.map = signTexAnomaly;
          signMat.needsUpdate = true;
          break;
        case "distant_figure":
          distantFigure.visible = true;
          audio.playWhisper();
          break;
        case "umbrella_increase":
          rebuildUmbrellas(5);
          break;
        case "poster_color_change":
          posterMat.map = posterTexAnomaly;
          posterMat.needsUpdate = true;
          break;
        case "mirror_person":
          mirrorFigure.visible = true;
          audio.playWhisper();
          break;
        case "final_double":
          finalDouble.visible = true;
          heartbeatActive = true;
          break;
        default:
          break;
      }
    },

    update(dt: number, playerPos: THREE.Vector3) {
      handPivot.rotation.z -= clockDirection * dt * 1.4;

      if (cameraFollowActive) {
        const dx = playerPos.x - cameraGroup.position.x;
        const dz = playerPos.z - cameraGroup.position.z;
        const targetAngle = Math.atan2(dx, dz);
        const cur = camHeadPivot.rotation.y;
        let diff = targetAngle - cur;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        camHeadPivot.rotation.y += diff * Math.min(1, dt * 2.5);
      } else {
        camHeadPivot.rotation.y = Math.sin(performance.now() * 0.0004) * 0.5;
      }

      if (distantFigure.visible && !distantFigureHiddenByProximity) {
        const dist = Math.hypot(playerPos.x - distantFigure.position.x, playerPos.z - distantFigure.position.z);
        if (dist < 4) {
          distantFigureHiddenByProximity = true;
          distantFigure.visible = false;
        }
      }

      if (heartbeatActive) {
        heartbeatTimer -= dt;
        if (heartbeatTimer <= 0) {
          const interval = audio.playHeartbeat(78) ?? 0.75;
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
      signTexAnomaly.dispose();
      posterTexNormal.dispose();
      posterTexAnomaly.dispose();
    },
  };

  return runtime;
}

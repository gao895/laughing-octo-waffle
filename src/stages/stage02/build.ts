import * as THREE from "three";
import type { StageRuntime } from "../../game/StageManager";
import { LightingManager, type CorridorLight } from "../../three/LightingManager";
import type { AudioManager } from "../../game/AudioManager";
import {
  makeHospitalWallTexture,
  makeHospitalFloorTexture,
  makeCeilingTexture,
  makeSignTexture,
  makeRoomNumberTexture,
  makeChartTexture,
  makeECGTexture,
  makePatientFaceTexture,
  buildFacedSilhouette,
  buildHumanSilhouette,
  buildPatientBed,
  buildWheelchair,
  buildIVPole,
  buildNurseSpeaker,
} from "../../three/EnvironmentManager";
import { buildCorridorShell, addCorridorLights, buildDoorAndSign, gaussianBump } from "../shared/corridorBuilder";

const Z_MIN = -16.6;
const Z_MAX = 11;
const SPAWN_Z = 8;
const DOOR_Z = -16;
const BASE_HALF_WIDTH = 1.15;
const ROOM1_Z = 3;
const ROOM2_Z = -8;

function halfWidthAt(z: number): number {
  return BASE_HALF_WIDTH + gaussianBump(z, ROOM1_Z, 2.6, 1.3) + gaussianBump(z, ROOM2_Z, 2.6, 1.3);
}

export function buildStage02(scene: THREE.Scene, lighting: LightingManager, audio: AudioManager): StageRuntime {
  // --- マテリアル/テクスチャ ---
  const wallTex = makeHospitalWallTexture();
  wallTex.repeat.set(1, 2);
  const floorTex = makeHospitalFloorTexture();
  const ceilTex = makeCeilingTexture();

  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, metalness: 0.02 });
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7, metalness: 0.05 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 1 });

  const { group, bounds } = buildCorridorShell({ zMin: Z_MIN, zMax: Z_MAX, halfWidthAt, wallMat, floorMat, ceilMat });
  group.name = "stage02";

  // --- 天井灯 ---
  const lightZs = [6, 3, -1, -4.5, -8, -12, -15];
  const lightEntries: CorridorLight[] = addCorridorLights(scene, lighting, lightZs, 2.3, 5, 0xd8e4e0);
  void lightEntries;

  // --- 非常口扉と看板 ---
  const signTex = makeSignTexture("非常口", "#ff2a2a");
  const { doorFrame, signPlane } = buildDoorAndSign(DOOR_Z, signTex);
  group.add(doorFrame, signPlane);

  // --- ROOM1: 患者の待合スペース ---
  // 部屋の中心(ROOM1_Z/ROOM2_Z)から離れるほど通路幅は狭くなるため、
  // 各小道具は「部屋中心での幅」ではなく必ず自分自身のZ座標での幅を使って配置する。
  // （でないと壁のカーブに対して手前や奥の小道具が壁にめり込む）
  const patientGroup = new THREE.Group();
  group.add(patientGroup);
  const normalFaceTextures = [makePatientFaceTexture(1), makePatientFaceTexture(2), makePatientFaceTexture(3)];
  const sameFaceTexture = makePatientFaceTexture(13);
  const patientFaceMeshes: THREE.Mesh[] = [];
  const PATIENT_MARGIN = 0.42; // 体半径0.22 + 余白

  function rebuildPatients(count: number) {
    patientGroup.clear();
    patientFaceMeshes.length = 0;
    for (let i = 0; i < count; i++) {
      const tex = normalFaceTextures[i % normalFaceTextures.length];
      const { group: patient, faceMesh } = buildFacedSilhouette(tex);
      const col = i % 2;
      const row = Math.floor(i / 2);
      const z = ROOM1_Z + 1.3 - row * 0.5;
      const hw = halfWidthAt(z);
      patient.position.set(hw - PATIENT_MARGIN - col * 0.4, 0, z);
      patient.rotation.y = Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      faceMesh.userData.normalTex = tex;
      patientGroup.add(patient);
      patientFaceMeshes.push(faceMesh);
    }
  }
  rebuildPatients(2);

  const bedZ = ROOM1_Z - 0.4;
  const bed = buildPatientBed();
  // buildPatientBed()はY軸90度回転で奥行き1.1m(半分0.55m)がワールドX方向に伸びるため、
  // 余白は0.55m+安全マージンを確保する。
  bed.position.set(-(halfWidthAt(bedZ) - 0.68), 0, bedZ);
  bed.rotation.y = Math.PI / 2;
  group.add(bed);

  const ivZ = ROOM1_Z - 0.9;
  const ivHandle = buildIVPole();
  ivHandle.group.position.set(-(halfWidthAt(ivZ) - 0.18), 0, ivZ);
  group.add(ivHandle.group);
  let ivReversed = false;
  let ivDropT = 0.3;

  const chartZ = ROOM1_Z - 1.1;
  const chartTexNormal = makeChartTexture(false);
  const chartTexAnomaly = makeChartTexture(true);
  const chartMat = new THREE.MeshBasicMaterial({ map: chartTexNormal, toneMapped: false });
  const chartPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.44), chartMat);
  chartPlane.position.set(halfWidthAt(chartZ) - 0.04, 1.3, chartZ);
  chartPlane.rotation.y = -Math.PI / 2;
  group.add(chartPlane);

  // --- ROOM2: ナースステーション周辺 ---
  const nurseWallZ = ROOM2_Z + 1;
  const nurseInWall = buildHumanSilhouette(0x1a1a1a, 0.95);
  nurseInWall.scale.set(0.9, 0.9, 0.9);
  nurseInWall.position.set(-halfWidthAt(nurseWallZ), 0, nurseWallZ);
  nurseInWall.rotation.y = Math.PI / 2;
  nurseInWall.visible = false;
  group.add(nurseInWall);

  const wheelchairBaseZ = ROOM2_Z - 1;
  const wheelchairMovedZ = ROOM2_Z + 0.6;
  const wheelchair = buildWheelchair();
  const wheelchairBasePos = new THREE.Vector3(halfWidthAt(wheelchairBaseZ) - 0.55, 0, wheelchairBaseZ);
  const wheelchairMovedPos = new THREE.Vector3(halfWidthAt(wheelchairMovedZ) - 0.55, 0, wheelchairMovedZ);
  wheelchair.position.copy(wheelchairBasePos);
  group.add(wheelchair);
  let wheelchairDrifting = false;

  const speaker = buildNurseSpeaker();
  speaker.position.set(0, 2.5, ROOM2_Z - 1.5);
  speaker.rotation.x = Math.PI / 2;
  group.add(speaker);
  let emptyRoomCallActive = false;
  let nurseCallTimer = 0;

  const ecgZ = ROOM2_Z + 0.8;
  const ecgTexNormal = makeECGTexture(false);
  const ecgTexSpiky = makeECGTexture(true);
  const ecgMat = new THREE.MeshBasicMaterial({ map: ecgTexNormal, toneMapped: false });
  const ecgPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), ecgMat);
  ecgPlane.position.set(-(halfWidthAt(ecgZ) - 0.04), 1.5, ecgZ);
  ecgPlane.rotation.y = Math.PI / 2;
  group.add(ecgPlane);

  const roomNumZ = ROOM2_Z + 1.6;
  const roomNumTexNormal = makeRoomNumberTexture("204", false);
  const roomNumTexGlitch = makeRoomNumberTexture("666", true);
  const roomNumMat = new THREE.MeshBasicMaterial({ map: roomNumTexNormal, toneMapped: false });
  const roomNumPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.21), roomNumMat);
  roomNumPlane.position.set(halfWidthAt(roomNumZ) - 0.04, 1.9, roomNumZ);
  roomNumPlane.rotation.y = -Math.PI / 2;
  group.add(roomNumPlane);

  // 手術室ランプ（通常異変 operating_light と、最終異変 name_calling の両方で使用）
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0x220000,
    emissive: 0x220000,
    emissiveIntensity: 0.2,
    roughness: 0.4,
  });
  const lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), lampMat);
  lampMesh.position.set(0, 2.45, ROOM2_Z - 2.3);
  group.add(lampMesh);
  const operatingLight = new THREE.PointLight(0xff2222, 0, 3.5, 2);
  operatingLight.position.copy(lampMesh.position);
  group.add(operatingLight);
  let operatingLightOn = false;
  let bossFlashActive = false;

  // --- 状態管理 ---
  let heartbeatActive = false;
  let heartbeatTimer = 0;

  const runtime: StageRuntime = {
    group,
    bounds,
    spawnPosition: new THREE.Vector3(0, 0, SPAWN_Z),
    spawnYaw: 0,
    doorInteractPoint: new THREE.Vector3(0, 0, DOOR_Z + 1.4),
    startGateInteractPoint: new THREE.Vector3(0, 0, SPAWN_Z + 2.3),
    interactRadius: 1.7,

    applyAnomaly(id: string | null) {
      rebuildPatients(2);
      ivReversed = false;
      ivHandle.bagMat.color.set(0xdfe8ea);
      nurseInWall.visible = false;
      chartMat.map = chartTexNormal;
      chartMat.needsUpdate = true;
      ecgMat.map = ecgTexNormal;
      ecgMat.needsUpdate = true;
      emptyRoomCallActive = false;
      wheelchair.position.copy(wheelchairBasePos);
      wheelchairDrifting = false;
      operatingLightOn = false;
      operatingLight.intensity = 0;
      lampMat.emissiveIntensity = 0.2;
      roomNumMat.map = roomNumTexNormal;
      roomNumMat.needsUpdate = true;
      heartbeatActive = false;
      heartbeatTimer = 0;
      bossFlashActive = false;

      switch (id) {
        case "patients_increase":
          rebuildPatients(5);
          break;
        case "patients_same_face":
          for (const fm of patientFaceMeshes) {
            (fm.material as THREE.MeshBasicMaterial).map = sameFaceTexture;
            (fm.material as THREE.MeshBasicMaterial).needsUpdate = true;
          }
          break;
        case "iv_backflow":
          ivReversed = true;
          ivHandle.bagMat.color.set(0x8a1414);
          break;
        case "nurse_in_wall":
          nurseInWall.visible = true;
          audio.playWhisper();
          break;
        case "chart_your_name":
          chartMat.map = chartTexAnomaly;
          chartMat.needsUpdate = true;
          break;
        case "monitor_sync":
          ecgMat.map = ecgTexSpiky;
          ecgMat.needsUpdate = true;
          break;
        case "empty_room_call":
          emptyRoomCallActive = true;
          nurseCallTimer = 1;
          break;
        case "wheelchair_move":
          wheelchair.position.copy(wheelchairMovedPos);
          wheelchairDrifting = true;
          break;
        case "operating_light":
          operatingLightOn = true;
          operatingLight.intensity = 1.4;
          lampMat.emissiveIntensity = 1.6;
          audio.playElectricHum();
          break;
        case "room_number_change":
          roomNumMat.map = roomNumTexGlitch;
          roomNumMat.needsUpdate = true;
          break;
        case "name_calling":
          bossFlashActive = true;
          heartbeatActive = true;
          audio.playWhisper();
          break;
        default:
          break;
      }
    },

    update(dt: number, _playerPos: THREE.Vector3) {
      // 点滴の雫アニメーション（逆流時は上向きに流れる）
      ivDropT += (ivReversed ? -1 : 1) * dt * 0.35;
      if (ivDropT > 1) ivDropT = 0;
      if (ivDropT < 0) ivDropT = 1;
      ivHandle.drop.position.y = THREE.MathUtils.lerp(0.78, 1.35, ivDropT);

      if (wheelchairDrifting) {
        wheelchair.position.x += Math.sin(performance.now() * 0.0006) * dt * 0.04;
        wheelchair.rotation.y += dt * 0.15;
      }

      if (emptyRoomCallActive) {
        nurseCallTimer -= dt;
        if (nurseCallTimer <= 0) {
          nurseCallTimer = 3.5 + Math.random() * 2.5;
          audio.playNurseCall();
        }
      }

      if (heartbeatActive) {
        heartbeatTimer -= dt;
        if (heartbeatTimer <= 0) {
          const interval = audio.playHeartbeat(90) ?? 0.6;
          heartbeatTimer = interval;
        }
      }

      if (bossFlashActive) {
        const strobe = Math.sin(performance.now() * 0.02) > 0.2;
        operatingLight.intensity = strobe ? 2.2 : 0;
        lampMat.emissiveIntensity = strobe ? 2.2 : 0.2;
      } else if (operatingLightOn) {
        operatingLight.intensity = 1.4 + Math.sin(performance.now() * 0.006) * 0.15;
      }
    },

    dispose() {
      wallTex.dispose();
      floorTex.dispose();
      ceilTex.dispose();
      signTex.dispose();
      for (const t of normalFaceTextures) t.dispose();
      sameFaceTexture.dispose();
      chartTexNormal.dispose();
      chartTexAnomaly.dispose();
      ecgTexNormal.dispose();
      ecgTexSpiky.dispose();
      roomNumTexNormal.dispose();
      roomNumTexGlitch.dispose();
    },
  };

  return runtime;
}

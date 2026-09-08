import * as THREE from "three";

/**
 * 通路の蛍光灯などのライトを管理し、点滅演出などをまとめて扱う。
 * 軽量化のため、シーン全体で使うライト数は最小限にする。
 */
export interface CorridorLight {
  light: THREE.PointLight;
  baseIntensity: number;
  flickering: boolean;
  flickerSeed: number;
}

export class LightingManager {
  readonly ambient: THREE.AmbientLight;
  readonly hemi: THREE.HemisphereLight;
  readonly lights: CorridorLight[] = [];
  private time = 0;

  constructor(scene: THREE.Scene, brightness = 0.5) {
    this.ambient = new THREE.AmbientLight(0x1a1e26, 0.25 + brightness * 0.3);
    this.hemi = new THREE.HemisphereLight(0x2a3240, 0x05050a, 0.2);
    scene.add(this.ambient);
    scene.add(this.hemi);
  }

  addCorridorLight(scene: THREE.Scene, position: THREE.Vector3, intensity = 6, color = 0xbfd4ff): CorridorLight {
    const light = new THREE.PointLight(color, intensity, 9, 2);
    light.position.copy(position);
    light.castShadow = false;
    scene.add(light);
    const entry: CorridorLight = { light, baseIntensity: intensity, flickering: false, flickerSeed: Math.random() * 100 };
    this.lights.push(entry);
    return entry;
  }

  setFlicker(entry: CorridorLight, on: boolean) {
    entry.flickering = on;
    if (!on) entry.light.intensity = entry.baseIntensity;
  }

  setBrightness(value: number) {
    this.ambient.intensity = 0.25 + value * 0.3;
  }

  update(dt: number) {
    this.time += dt;
    for (const entry of this.lights) {
      if (!entry.flickering) continue;
      const n = Math.sin(this.time * 37 + entry.flickerSeed) * Math.sin(this.time * 13 + entry.flickerSeed);
      const flicker = n > 0.15 ? 1 : 0.15 + Math.random() * 0.2;
      entry.light.intensity = entry.baseIntensity * flicker;
    }
  }
}

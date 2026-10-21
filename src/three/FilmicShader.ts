/**
 * ビネット・フィルム粒状感・色収差を1パスにまとめたポストプロセスシェーダー。
 * 複数の専用Passを重ねるよりもサンプリング回数を抑えられ、軽量に仕上げられる。
 */
export const FilmicShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    vignetteStrength: { value: 0.55 },
    grainStrength: { value: 0.035 },
    chromaStrength: { value: 0.0022 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float vignetteStrength;
    uniform float grainStrength;
    uniform float chromaStrength;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = uv - 0.5;
      float dist = length(center);

      // 色収差: 画面端ほど強くRGBチャンネルをずらす
      float chroma = chromaStrength * dist;
      float r = texture2D(tDiffuse, uv - center * chroma).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv + center * chroma).b;
      vec3 color = vec3(r, g, b);

      // ビネット: 周辺減光
      float vignette = smoothstep(0.85, 0.25, dist * (1.0 + vignetteStrength));
      color *= mix(1.0 - vignetteStrength, 1.0, vignette);

      // フィルム粒状感: 時間で変化するノイズ
      float grain = (rand(uv * 1000.0 + time) - 0.5) * grainStrength;
      color += grain;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

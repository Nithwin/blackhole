import * as THREE from 'three';

// Gravitational Lensing & Event Horizon Shadow Absorption Shader
export const GravitationalLensShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uBlackHoleScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
    uBlackHoleScreenRadius: { value: 0.12 },
    uLensingStrength: { value: 1.0 },
    uAspect: { value: 16 / 9 },
    uChromaticDispersion: { value: 0.01 },
    uActive: { value: 1.0 },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform vec2 uBlackHoleScreenPos;
    uniform float uBlackHoleScreenRadius;
    uniform float uLensingStrength;
    uniform float uAspect;
    uniform float uChromaticDispersion;
    uniform float uActive;

    varying vec2 vUv;

    void main() {
      if (uActive < 0.01) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      vec2 aspectVec = vec2(uAspect, 1.0);
      vec2 delta = (vUv - uBlackHoleScreenPos) * aspectVec;
      float dist = length(delta);
      float rs = uBlackHoleScreenRadius;

      vec3 col;

      if (uLensingStrength > 0.001 && rs > 0.002) {
        // Continuous Einstein gravitational deflection
        float softenedDist = sqrt(dist * dist + rs * rs * 0.25);
        float deflection = (rs * rs * 0.65 * uLensingStrength) / softenedDist;
        
        // Softly damp deflection inside the core to prevent UV inversion
        float coreDamp = smoothstep(0.0, rs * 0.9, dist);
        deflection *= coreDamp;

        vec2 dir = (dist > 0.0001) ? (delta / dist) : vec2(0.0);
        vec2 offset = (dir / aspectVec) * deflection;

        // Gravitational chromatic dispersion across light cones
        vec2 uvR = vUv - offset * (1.0 - uChromaticDispersion);
        vec2 uvG = vUv - offset;
        vec2 uvB = vUv - offset * (1.0 + uChromaticDispersion);

        col.r = texture2D(tDiffuse, clamp(uvR, 0.0, 1.0)).r;
        col.g = texture2D(tDiffuse, clamp(uvG, 0.0, 1.0)).g;
        col.b = texture2D(tDiffuse, clamp(uvB, 0.0, 1.0)).b;

        // EVENT HORIZON SHADOW ABSORPTION MASK:
        // Any light inside the apparent shadow radius is swallowed by the black hole!
        // This ensures the central black hole is a pure, deep, razor-sharp black void
        // and cuts away any bloom fog that bleeds over the center.
        float shadowAlpha = smoothstep(rs * 0.94, rs * 1.02, dist);
        col *= shadowAlpha;
      } else {
        col = texture2D(tDiffuse, vUv).rgb;
      }

      // Subtle cinematic vignette
      vec2 vigCoord = (vUv - 0.5) * 1.35;
      float vignette = 1.0 - dot(vigCoord, vigCoord) * 0.28;
      col *= clamp(vignette, 0.72, 1.0);

      gl_FragColor = vec4(col, 1.0);
    }
  `
};

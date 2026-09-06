import * as THREE from 'three';

// Screen-space Gravitational Lensing and Einstein Ring distortion shader
export const GravitationalLensShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uBlackHoleScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
    uBlackHoleScreenRadius: { value: 0.12 }, // Normalized screen radius
    uLensingStrength: { value: 1.0 },
    uAspect: { value: 16 / 9 },
    uChromaticDispersion: { value: 0.015 },
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
      if (uActive < 0.5 || uBlackHoleScreenRadius <= 0.001) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      // Aspect ratio correction for circular deflection
      vec2 aspectVec = vec2(uAspect, 1.0);
      vec2 delta = (vUv - uBlackHoleScreenPos) * aspectVec;
      float dist = length(delta);

      // Apparent shadow radius (b_crit ~ 2.6 * r_s for Schwarzschild)
      float rs = uBlackHoleScreenRadius;
      float rShadow = rs * 1.05;

      // When outside the event horizon shadow, apply gravitational deflection
      if (dist > rShadow) {
        // Kip Thorne deflection approximation: alpha ~ 2 * rs / (dist - rs * 0.8)
        float factor = (rs * rs * 0.75 * uLensingStrength) / max(0.001, (dist - rs * 0.75));
        vec2 dir = normalize(delta) / aspectVec;

        // Gravitational chromatic dispersion (relativistic frequency shift across light cone)
        vec2 uvR = vUv - dir * (factor * (1.0 - uChromaticDispersion));
        vec2 uvG = vUv - dir * factor;
        vec2 uvB = vUv - dir * (factor * (1.0 + uChromaticDispersion));

        float rCol = texture2D(tDiffuse, clamp(uvR, 0.0, 1.0)).r;
        float gCol = texture2D(tDiffuse, clamp(uvG, 0.0, 1.0)).g;
        float bCol = texture2D(tDiffuse, clamp(uvB, 0.0, 1.0)).b;

        // Enhanced brightness at the Einstein Ring (caustic amplification)
        float einsteinRingDist = abs(dist - rs * 1.6);
        float ringCaustic = exp(-einsteinRingDist * einsteinRingDist * 180.0) * 0.45;

        vec3 color = vec3(rCol, gCol, bCol) + vec3(1.0, 0.9, 0.7) * ringCaustic;
        gl_FragColor = vec4(color, 1.0);
      } else {
        // Inside the event horizon boundary: sample texture with smooth black absorption falloff
        float shadowEdge = smoothstep(rs * 0.85, rShadow, dist);
        vec4 originalColor = texture2D(tDiffuse, vUv);
        gl_FragColor = mix(vec4(0.0, 0.0, 0.0, 1.0), originalColor, shadowEdge * 0.35);
      }
    }
  `
};

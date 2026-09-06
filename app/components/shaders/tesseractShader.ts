import * as THREE from 'three';

// GLSL Shaders for 5D Timeline Portal (Tesseract Hyperspace Lattice & Worldlines)

export const TesseractGridShader = {
  uniforms: {
    uTime: { value: 0 },
    uSpeed: { value: 1.0 },
    uIntensity: { value: 1.0 },
    uColor1: { value: new THREE.Color(0.15, 0.7, 1.0) },  // Cyan pulse
    uColor2: { value: new THREE.Color(0.75, 0.2, 1.0) },  // Violet temporal shift
    uColor3: { value: new THREE.Color(1.0, 0.85, 0.4) },  // Golden quantum thread
    uCameraZ: { value: 0 },
  },

  vertexShader: /* glsl */ `
    varying vec3 vWorldPosition;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uSpeed;
    uniform float uIntensity;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uCameraZ;

    varying vec3 vWorldPosition;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // 3D coordinate lattice representing orthogonal slices of 5D spacetime
      vec3 pos = vWorldPosition;
      
      // Moving temporal flow along the z-axis
      float timeFlow = uTime * uSpeed * 2.5;
      vec3 gridPos = fract(pos * 0.15 + vec3(0.0, 0.0, timeFlow * 0.05)) - 0.5;

      // Distance to lattice axes (lines in 3D)
      float lineXY = min(length(gridPos.xy), min(length(gridPos.yz), length(gridPos.xz)));
      float lineGlow = 0.018 / max(0.001, lineXY);
      lineGlow = clamp(lineGlow, 0.0, 3.5);

      // Waves of gravitational influence traversing the lattice
      float wave = sin(pos.z * 0.12 - uTime * 3.0) * cos(pos.x * 0.12) * sin(pos.y * 0.12);
      wave = pow(0.5 + 0.5 * wave, 3.0);

      // Temporal chromatic shift
      vec3 baseColor = mix(uColor1, uColor2, sin(pos.z * 0.05 + uTime) * 0.5 + 0.5);
      baseColor = mix(baseColor, uColor3, wave);

      // Distance falloff from camera to prevent harsh clipping
      float distToCamera = length(pos.z - uCameraZ);
      float depthFade = smoothstep(120.0, 20.0, distToCamera) * smoothstep(2.0, 8.0, distToCamera);

      vec3 finalColor = baseColor * lineGlow * (1.0 + wave * 1.5) * uIntensity;
      float alpha = clamp(lineGlow * 0.7 * depthFade * uIntensity, 0.0, 1.0);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

export const TimelineRibbonShader = {
  uniforms: {
    uTime: { value: 0 },
    uLength: { value: 80.0 },
    uColorCore: { value: new THREE.Color(1.0, 0.95, 0.8) },
    uColorGlow: { value: new THREE.Color(0.2, 0.75, 1.0) },
  },

  vertexShader: /* glsl */ `
    uniform float uTime;
    varying vec2 vUv;
    varying float vPulse;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Undulate ribbon like a quantum string in higher dimensions
      float wave = sin(pos.z * 0.2 + uTime * 3.5) * cos(pos.x * 0.3);
      pos.y += wave * 0.8;
      pos.x += cos(pos.z * 0.15 - uTime * 2.0) * 0.5;

      vPulse = 0.5 + 0.5 * sin(pos.z * 0.4 - uTime * 5.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform vec3 uColorCore;
    uniform vec3 uColorGlow;
    varying vec2 vUv;
    varying float vPulse;

    void main() {
      float centerDist = abs(vUv.y - 0.5) * 2.0;
      float core = exp(-centerDist * 8.0);
      float glow = exp(-centerDist * 2.2);

      vec3 col = mix(uColorGlow, uColorCore, core) * (core * 2.5 + glow * 0.8);
      col *= (1.0 + vPulse * 0.8);

      float alpha = (core + glow * 0.5) * smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `
};

export const SingularityCoreShader = {
  uniforms: {
    uTime: { value: 0 },
    uExpansion: { value: 0.0 },
  },

  vertexShader: /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uExpansion;
    varying vec3 vNormal;
    varying vec3 vWorldPos;

    void main() {
      // Cosmic rebirth beacon
      float pulse = sin(uTime * 8.0) * 0.15 + 0.85;
      float fresnel = pow(1.0 - abs(vNormal.z), 3.0);
      
      vec3 coreColor = vec3(1.0, 0.98, 0.9);
      vec3 auroraColor = vec3(0.3, 0.75, 1.0);
      
      vec3 color = mix(coreColor, auroraColor, fresnel) * (pulse * 2.5 + fresnel * 2.0);
      float alpha = clamp(0.7 + fresnel * 0.3 + uExpansion, 0.0, 1.0);

      gl_FragColor = vec4(color, alpha);
    }
  `
};

import * as THREE from 'three';

// High-fidelity GLSL Shaders for Black Hole Accretion Disk, Doppler Beaming, Lensing Halo, and Photon Sphere

export const AccretionDiskShader = {
  uniforms: {
    uTime: { value: 0 },
    uInnerRadius: { value: 2.5 },
    uOuterRadius: { value: 13.5 },
    uBlackHoleRadius: { value: 2.4 },
    uDiskColorCore: { value: new THREE.Color(1.0, 0.95, 0.85) },      // Incandescent gold-white
    uDiskColorMid: { value: new THREE.Color(1.0, 0.52, 0.10) },       // Fiery amber plasma
    uDiskColorOuter: { value: new THREE.Color(0.72, 0.15, 0.02) },    // Deep space red dust
    uDopplerStrength: { value: 1.25 },
    uTemperature: { value: 1.0 },
    uCameraPosition: { value: new THREE.Vector3(0, 5, 25) },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform float uBlackHoleRadius;
    uniform vec3 uDiskColorCore;
    uniform vec3 uDiskColorMid;
    uniform vec3 uDiskColorOuter;
    uniform float uDopplerStrength;
    uniform float uTemperature;
    uniform vec3 uCameraPosition;

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vNormal;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m; m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
      float total = 0.0;
      float amp = 0.52;
      float freq = 1.0;
      for (int i = 0; i < 4; i++) {
        total += amp * snoise(p * freq);
        p = p * 2.08 + vec2(2.1, 8.4);
        amp *= 0.48;
        freq *= 1.98;
      }
      return total;
    }

    void main() {
      float r = length(vLocalPosition.xz);
      float theta = atan(vLocalPosition.z, vLocalPosition.x);

      if (r < uInnerRadius || r > uOuterRadius) {
        discard;
      }

      // Keplerian differential rotation: omega ~ r^(-1.25)
      float omega = 3.5 / (pow(r, 1.25) + 0.1);
      float currentAngle = theta - uTime * omega;

      // Spiral density waves
      float spiralArm = currentAngle * 2.8 + log(r) * 2.0;
      vec2 coord1 = vec2(r * 1.1, spiralArm);
      vec2 coord2 = vec2(r * 2.2, currentAngle * 4.5 - r * 1.2 + uTime * 0.2);

      float n1 = fbm(coord1);
      float n2 = fbm(coord2);
      float plasma = 0.5 + 0.5 * (n1 * 0.65 + n2 * 0.35);

      // Dark dust absorption lanes
      float dustLane = smoothstep(-0.2, 0.4, snoise(vec2(r * 3.0, currentAngle * 5.0)));
      plasma = mix(plasma * 0.45, plasma * 1.3, dustLane);

      // Radial density profile
      float normRadius = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
      float radialIntensity = pow(sin(normRadius * 3.1415926), 0.75) * exp(-normRadius * 1.5);

      // Relativistic Doppler Beaming
      vec3 vTan = normalize(vec3(-sin(theta), 0.0, cos(theta)));
      vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
      float vDotView = dot(vTan, viewDir);

      float beta = clamp(0.55 / sqrt(r), 0.0, 0.72);
      float gamma = 1.0 / sqrt(max(0.01, 1.0 - beta * beta));
      float dopplerFactor = 1.0 / (gamma * (1.0 - beta * vDotView));
      // Clamp flux boost so it never washes out to nuclear white!
      float fluxBoost = clamp(pow(dopplerFactor, 2.4), 0.35, 2.6);

      // Color temperature mapping
      vec3 baseColor;
      if (normRadius < 0.2) {
        float t = normRadius / 0.2;
        baseColor = mix(uDiskColorCore, uDiskColorMid, t);
      } else {
        float t = (normRadius - 0.2) / 0.8;
        baseColor = mix(uDiskColorMid, uDiskColorOuter, t);
      }

      vec3 blueShifted = mix(baseColor, vec3(0.8, 0.92, 1.0), clamp((dopplerFactor - 1.0) * 0.6, 0.0, 0.8));
      vec3 redShifted = mix(baseColor, vec3(0.55, 0.12, 0.02), clamp((1.0 - dopplerFactor) * 0.6, 0.0, 0.8));
      vec3 finalColor = (vDotView > 0.0) ? blueShifted : redShifted;

      float finalAlpha = radialIntensity * (0.35 + 0.65 * plasma);
      finalColor = finalColor * fluxBoost * (0.85 + plasma * 0.6) * uTemperature;
      // Controlled HDR ceiling
      finalColor = clamp(finalColor, vec3(0.0), vec3(2.6));

      float edgeFade = smoothstep(uInnerRadius, uInnerRadius + 0.25, r) * 
                       smoothstep(uOuterRadius, uOuterRadius - 0.8, r);
      finalAlpha *= edgeFade;

      gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
    }
  `
};

// Shader for Kip Thorne Gravitational Lensing Halo (Arches around the black hole shadow)
export const LensingHaloShader = {
  uniforms: {
    uTime: { value: 0 },
    uInnerRadius: { value: 2.44 },
    uOuterRadius: { value: 5.2 },
    uDiskColorCore: { value: new THREE.Color(1.0, 0.95, 0.85) },
    uDiskColorMid: { value: new THREE.Color(1.0, 0.52, 0.10) },
    uDiskColorOuter: { value: new THREE.Color(0.72, 0.15, 0.02) },
    uCameraPosition: { value: new THREE.Vector3(0, 5, 25) },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform vec3 uDiskColorCore;
    uniform vec3 uDiskColorMid;
    uniform vec3 uDiskColorOuter;
    uniform vec3 uCameraPosition;

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vNormal;

    void main() {
      float r = length(vLocalPosition.xy);
      if (r < uInnerRadius || r > uOuterRadius) {
        discard;
      }

      float normRadius = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
      float arcIntensity = pow(sin(normRadius * 3.1415926), 1.2) * exp(-normRadius * 2.0);

      vec3 color = mix(uDiskColorCore, uDiskColorMid, normRadius);
      color = mix(color, uDiskColorOuter, pow(normRadius, 2.0));

      float xOffset = vLocalPosition.x / r;
      float dopplerFactor = clamp(1.0 - xOffset * 0.4, 0.5, 2.0);
      color *= dopplerFactor;
      color = clamp(color, vec3(0.0), vec3(2.4));

      float alpha = arcIntensity * smoothstep(uInnerRadius, uInnerRadius + 0.18, r) * 
                    smoothstep(uOuterRadius, uOuterRadius - 0.5, r);

      gl_FragColor = vec4(color, clamp(alpha * 0.85, 0.0, 1.0));
    }
  `
};

// Shader for Photon Sphere (Razor-sharp incandescent loop at shadow boundary)
export const PhotonRingShader = {
  uniforms: {
    uTime: { value: 0 },
    uRadius: { value: 2.42 },
    uWidth: { value: 0.04 },
    uColor: { value: new THREE.Color(1.0, 0.96, 0.88) },
    uGlowColor: { value: new THREE.Color(0.4, 0.7, 1.0) },
    uCameraPosition: { value: new THREE.Vector3(0, 5, 25) },
  },

  vertexShader: /* glsl */ `
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uGlowColor;
    uniform vec3 uCameraPosition;

    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
      float fresnel = 1.0 - abs(dot(viewDir, vNormal));
      
      // Extremely sharp rim peak
      float rim = pow(fresnel, 24.0);
      float softGlow = pow(fresnel, 5.0) * 0.25;

      vec3 finalColor = mix(uGlowColor, uColor, rim) * (rim * 2.8 + softGlow);
      finalColor = clamp(finalColor, vec3(0.0), vec3(3.2));
      float alpha = clamp(rim * 1.8 + softGlow * 0.5, 0.0, 1.0);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// Subtle Ethereal Polar Jet (Faint magnetic wisps, not blinding white spotlights)
export const PolarJetShader = {
  uniforms: {
    uTime: { value: 0 },
    uJetLength: { value: 28.0 },
    uJetCoreColor: { value: new THREE.Color(0.3, 0.6, 1.0) },
    uJetGlowColor: { value: new THREE.Color(0.1, 0.2, 0.7) },
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform vec3 uJetCoreColor;
    uniform vec3 uJetGlowColor;

    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      float yNorm = vUv.y;
      float xCenter = abs(vUv.x - 0.5) * 2.0;

      float twist = sin(yNorm * 20.0 - uTime * 4.0 + vUv.x * 10.0);
      float jetProfile = exp(-xCenter * 6.0) * (0.8 + 0.2 * twist);
      
      float distanceFade = (1.0 - pow(yNorm, 0.9)) * smoothstep(0.05, 0.2, yNorm);

      vec3 color = mix(uJetGlowColor, uJetCoreColor, exp(-xCenter * 8.0));
      // Very faint and ethereal (opacity ~0.12) so it NEVER covers the black hole!
      float alpha = jetProfile * distanceFade * 0.12;

      gl_FragColor = vec4(color, alpha);
    }
  `
};

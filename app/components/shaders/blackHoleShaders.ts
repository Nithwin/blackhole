import * as THREE from 'three';

// GLSL Shaders for Black Hole Accretion Disk, Relativistic Doppler Beaming, and Photon Sphere

export const AccretionDiskShader = {
  uniforms: {
    uTime: { value: 0 },
    uInnerRadius: { value: 2.8 },
    uOuterRadius: { value: 14.0 },
    uBlackHoleRadius: { value: 1.0 },
    uDiskColorCore: { value: new THREE.Color(1.0, 0.95, 0.85) },      // Superheated white-hot plasma
    uDiskColorMid: { value: new THREE.Color(1.0, 0.55, 0.12) },       // Ionized amber plasma
    uDiskColorOuter: { value: new THREE.Color(0.75, 0.15, 0.03) },    // Cooler red-infrared dust
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

    // High performance simplex/hash noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187,
                          0.366025403784439,
                         -0.577350269189626,
                          0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    // Fractal Brownian Motion for swirling plasma gas
    float fbm(vec2 p) {
      float total = 0.0;
      float amp = 0.55;
      float freq = 1.0;
      for (int i = 0; i < 4; i++) {
        total += amp * snoise(p * freq);
        p = p * 2.05 + vec2(1.7, 9.2);
        amp *= 0.5;
        freq *= 1.95;
      }
      return total;
    }

    void main() {
      // Calculate polar coordinates in disk plane
      float r = length(vLocalPosition.xz);
      float theta = atan(vLocalPosition.z, vLocalPosition.x);

      // Discard if inside the Innermost Stable Circular Orbit (ISCO) or outside outer rim
      if (r < uInnerRadius || r > uOuterRadius) {
        discard;
      }

      // Keplerian differential rotation: angular speed omega ~ r^(-1.5)
      float omega = 4.5 / (pow(r, 1.25) + 0.1);
      float currentAngle = theta - uTime * omega;

      // Map to UV space for spiral turbulence
      vec2 spiralCoord = vec2(r * 0.9, currentAngle * 2.8 + r * 1.2);
      float noise1 = fbm(spiralCoord);
      float noise2 = fbm(spiralCoord * 2.1 + vec2(uTime * 0.4, -uTime * 0.2));
      float plasmaPattern = 0.5 + 0.5 * (noise1 * 0.65 + noise2 * 0.35);

      // Radial density profile
      float normRadius = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
      float radialIntensity = pow(sin(normRadius * 3.1415926), 0.75) * exp(-normRadius * 1.8);

      // Relativistic Doppler Beaming
      vec3 vTan = normalize(vec3(-sin(theta), 0.0, cos(theta)));
      vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
      float vDotView = dot(vTan, viewDir);

      float beta = clamp(0.68 / sqrt(r), 0.0, 0.85);
      float gamma = 1.0 / sqrt(max(0.01, 1.0 - beta * beta));
      float dopplerFactor = 1.0 / (gamma * (1.0 - beta * vDotView));
      float fluxBoost = pow(dopplerFactor, 3.2);

      vec3 baseColor;
      if (normRadius < 0.25) {
        float t = normRadius / 0.25;
        baseColor = mix(uDiskColorCore, uDiskColorMid, t);
      } else {
        float t = (normRadius - 0.25) / 0.75;
        baseColor = mix(uDiskColorMid, uDiskColorOuter, t);
      }

      vec3 blueShifted = mix(baseColor, vec3(0.6, 0.85, 1.0), clamp((dopplerFactor - 1.0) * 0.7, 0.0, 0.85));
      vec3 redShifted = mix(baseColor, vec3(0.5, 0.08, 0.02), clamp((1.0 - dopplerFactor) * 0.7, 0.0, 0.85));
      vec3 finalColor = (vDotView > 0.0) ? blueShifted : redShifted;

      float finalAlpha = radialIntensity * (0.45 + 0.55 * plasmaPattern);
      finalColor *= fluxBoost * (1.1 + plasmaPattern * 0.9) * uTemperature;

      float edgeFade = smoothstep(uInnerRadius, uInnerRadius + 0.35, r) * 
                       smoothstep(uOuterRadius, uOuterRadius - 0.8, r);
      finalAlpha *= edgeFade;

      gl_FragColor = vec4(finalColor, clamp(finalAlpha * 1.25, 0.0, 1.0));
    }
  `
};

// Shader for Gravitational Lensing Halo (Kip Thorne arch)
export const LensingHaloShader = {
  uniforms: {
    uTime: { value: 0 },
    uInnerRadius: { value: 1.15 },
    uOuterRadius: { value: 4.8 },
    uDiskColorCore: { value: new THREE.Color(1.0, 0.95, 0.85) },
    uDiskColorMid: { value: new THREE.Color(1.0, 0.55, 0.12) },
    uDiskColorOuter: { value: new THREE.Color(0.75, 0.15, 0.03) },
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
      float arcIntensity = pow(sin(normRadius * 3.1415926), 1.2) * exp(-normRadius * 2.2);

      vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
      float viewAngle = abs(dot(viewDir, vec3(0.0, 1.0, 0.0)));

      vec3 color = mix(uDiskColorCore, uDiskColorMid, normRadius);
      color = mix(color, uDiskColorOuter, pow(normRadius, 2.0));

      float xOffset = vLocalPosition.x / r;
      float dopplerFactor = 1.0 - xOffset * 0.45;
      color *= dopplerFactor * 1.4;

      float alpha = arcIntensity * (0.4 + 0.6 * (1.0 - viewAngle));
      alpha *= smoothstep(uInnerRadius, uInnerRadius + 0.2, r) * smoothstep(uOuterRadius, uOuterRadius - 0.5, r);

      gl_FragColor = vec4(color * 1.5, clamp(alpha * 0.85, 0.0, 1.0));
    }
  `
};

// Shader for Photon Sphere
export const PhotonRingShader = {
  uniforms: {
    uTime: { value: 0 },
    uRadius: { value: 1.5 },
    uWidth: { value: 0.08 },
    uColor: { value: new THREE.Color(1.0, 0.96, 0.88) },
    uGlowColor: { value: new THREE.Color(0.35, 0.7, 1.0) },
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
      
      float rim = pow(fresnel, 16.0);
      float softGlow = pow(fresnel, 4.0) * 0.4;

      float pulse = 0.92 + 0.08 * sin(uTime * 4.0 + vWorldPosition.x * 5.0);

      vec3 finalColor = mix(uGlowColor, uColor, rim) * (rim * 3.5 + softGlow) * pulse;
      float alpha = clamp(rim * 1.8 + softGlow * 0.6, 0.0, 1.0);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

// Shader for Relativistic Polar Jet
export const PolarJetShader = {
  uniforms: {
    uTime: { value: 0 },
    uJetLength: { value: 25.0 },
    uJetCoreColor: { value: new THREE.Color(0.5, 0.85, 1.0) },
    uJetGlowColor: { value: new THREE.Color(0.15, 0.35, 0.95) },
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

      float twist = sin(yNorm * 22.0 - uTime * 6.0 + vUv.x * 12.0);
      float jetProfile = exp(-xCenter * 4.5) * (0.8 + 0.2 * twist);
      
      float distanceFade = (1.0 - pow(yNorm, 0.85)) * smoothstep(0.02, 0.15, yNorm);

      vec3 color = mix(uJetGlowColor, uJetCoreColor, exp(-xCenter * 8.0));
      float alpha = jetProfile * distanceFade * 0.65;

      gl_FragColor = vec4(color * 2.0, alpha);
    }
  `
};

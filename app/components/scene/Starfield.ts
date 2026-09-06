import * as THREE from 'three';

export class Starfield {
  public group: THREE.Group;
  private starMaterial: THREE.ShaderMaterial;
  private nebulaParticles: THREE.Points;

  constructor(count = 12000, radius = 500) {
    this.group = new THREE.Group();

    // Star attributes
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const twinkleSpeeds = new Float32Array(count);

    // Stellar spectral color palette (O, B, A, F, G, K, M)
    const spectralColors = [
      new THREE.Color(0.65, 0.78, 1.0),  // O - Deep Blue
      new THREE.Color(0.82, 0.90, 1.0),  // B - Blue-White
      new THREE.Color(1.0, 1.0, 1.0),    // A - Crisp White
      new THREE.Color(1.0, 0.96, 0.88),  // F - Yellow-White
      new THREE.Color(1.0, 0.88, 0.65),  // G - Solar Yellow
      new THREE.Color(1.0, 0.65, 0.35),  // K - Warm Orange
      new THREE.Color(1.0, 0.38, 0.22),  // M - Red Dwarf
    ];

    for (let i = 0; i < count; i++) {
      // Distribute stars spherically with slight Galactic disk bias
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius * (0.35 + 0.65 * Math.cbrt(Math.random()));

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.45; // Galactic flattening
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Select random stellar type biased towards cooler dwarfs (realistic astrophysics)
      const colorIndex = Math.floor(Math.pow(Math.random(), 1.6) * spectralColors.length);
      const starColor = spectralColors[Math.min(colorIndex, spectralColors.length - 1)];

      colors[i * 3] = starColor.r;
      colors[i * 3 + 1] = starColor.g;
      colors[i * 3 + 2] = starColor.b;

      // Star apparent size distribution
      sizes[i] = Math.random() < 0.03 ? 4.5 + Math.random() * 4.0 : 1.2 + Math.random() * 2.2;
      twinkleSpeeds[i] = 1.0 + Math.random() * 4.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAberration: { value: 0.0 }, // Relativistic beaming aberration
        uVelocityDir: { value: new THREE.Vector3(0, 0, -1) },
      },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute float twinkleSpeed;
        attribute vec3 color;

        uniform float uTime;
        uniform float uAberration;
        uniform vec3 uVelocityDir;

        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          vColor = color;
          
          vec3 pos = position;

          // Relativistic headlight aberration (stars bunch toward direction of motion)
          if (uAberration > 0.01) {
            vec3 dir = normalize(pos);
            float cosTheta = dot(dir, uVelocityDir);
            float beta = clamp(uAberration, 0.0, 0.95);
            float cosThetaPrime = (cosTheta + beta) / (1.0 + beta * cosTheta);
            vec3 perp = dir - cosTheta * uVelocityDir;
            float sinThetaPrime = sqrt(max(0.0, 1.0 - cosThetaPrime * cosThetaPrime));
            if (length(perp) > 0.001) {
              pos = length(position) * (uVelocityDir * cosThetaPrime + normalize(perp) * sinThetaPrime);
            }
          }

          vTwinkle = 0.75 + 0.25 * sin(uTime * twinkleSpeed + position.x * 0.1);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * vTwinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vTwinkle;

        void main() {
          // Circular Gaussian point sprite with hot core
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float intensity = exp(-dist * dist * 14.0);
          float core = exp(-dist * dist * 60.0);

          vec3 finalColor = vColor * intensity + vec3(1.0) * core;
          gl_FragColor = vec4(finalColor * vTwinkle, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starPoints = new THREE.Points(geometry, this.starMaterial);
    this.group.add(starPoints);

    // Cosmic Dust Nebulae (soft volumetric ambient gas)
    this.nebulaParticles = this.createNebula(2000, radius * 0.7);
    this.group.add(this.nebulaParticles);
  }

  private createNebula(count: number, radius: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2.0 * Math.PI;
      const phi = (Math.random() - 0.5) * 0.6; // Concentrated around plane
      const r = radius * (0.3 + 0.7 * Math.random());

      positions[i * 3] = r * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(phi) * 0.5;
      positions[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi);

      // Deep space ambient hues (indigo, violet, deep orange)
      const hueChoice = Math.random();
      if (hueChoice < 0.4) {
        colors[i * 3] = 0.15;
        colors[i * 3 + 1] = 0.25;
        colors[i * 3 + 2] = 0.6;
      } else if (hueChoice < 0.7) {
        colors[i * 3] = 0.4;
        colors[i * 3 + 1] = 0.15;
        colors[i * 3 + 2] = 0.45;
      } else {
        colors[i * 3] = 0.55;
        colors[i * 3 + 1] = 0.25;
        colors[i * 3 + 2] = 0.1;
      }

      sizes[i] = 40.0 + Math.random() * 90.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float alpha = exp(-dist * dist * 10.0) * 0.08;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  public update(time: number, aberration = 0.0, velocityDir = new THREE.Vector3(0, 0, -1)) {
    this.starMaterial.uniforms.uTime.value = time;
    this.starMaterial.uniforms.uAberration.value = aberration;
    this.starMaterial.uniforms.uVelocityDir.value.copy(velocityDir);

    // Slow celestial rotation of the distant heavens
    this.group.rotation.y = time * 0.005;
  }
}

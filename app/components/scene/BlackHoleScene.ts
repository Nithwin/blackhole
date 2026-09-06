import * as THREE from 'three';
import {
  AccretionDiskShader,
  LensingHaloShader,
  PhotonRingShader,
  PolarJetShader,
} from '../shaders/blackHoleShaders';

export class BlackHoleScene {
  public group: THREE.Group;
  public eventHorizon: THREE.Mesh;
  public accretionDisk: THREE.Mesh;
  public lensingArch: THREE.Mesh;
  public photonRing: THREE.Mesh;
  public northJet: THREE.Mesh;
  public southJet: THREE.Mesh;
  public accretionParticles: THREE.Points;
  public volumetricRings: THREE.Group;

  private diskMaterial: THREE.ShaderMaterial;
  private haloMaterial: THREE.ShaderMaterial;
  private photonMaterial: THREE.ShaderMaterial;
  private northJetMaterial: THREE.ShaderMaterial;
  private southJetMaterial: THREE.ShaderMaterial;

  public readonly rs = 1.0; // Schwarzschild radius in scene units
  public readonly shadowRadius = 2.4; // Apparent gravitational shadow radius

  constructor() {
    this.group = new THREE.Group();

    // 1. Event Horizon Shadow: Pure ink-black sphere of apparent shadow radius
    const horizonGeo = new THREE.SphereGeometry(this.shadowRadius, 64, 64);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      depthWrite: true,
    });
    this.eventHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.eventHorizon.renderOrder = 2;
    this.group.add(this.eventHorizon);

    // 2. Kip Thorne Gravitational Lensing Halo (Curved arch surrounding the shadow)
    const haloInner = this.shadowRadius * 1.01;
    const haloOuter = this.shadowRadius * 2.15;
    const haloGeo = new THREE.RingGeometry(haloInner, haloOuter, 128, 32);
    this.haloMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInnerRadius: { value: haloInner },
        uOuterRadius: { value: haloOuter },
        uDiskColorCore: { value: new THREE.Color(1.0, 0.95, 0.85) },
        uDiskColorMid: { value: new THREE.Color(1.0, 0.52, 0.10) },
        uDiskColorOuter: { value: new THREE.Color(0.72, 0.15, 0.02) },
        uCameraPosition: { value: new THREE.Vector3(0, 5, 25) },
      },
      vertexShader: LensingHaloShader.vertexShader,
      fragmentShader: LensingHaloShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.lensingArch = new THREE.Mesh(haloGeo, this.haloMaterial);
    this.lensingArch.renderOrder = 1;
    this.group.add(this.lensingArch);

    // 3. Photon Ring: Razor-sharp incandescent loop hugging the shadow perimeter
    const photonGeo = new THREE.SphereGeometry(this.shadowRadius * 1.008, 64, 64);
    this.photonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: this.shadowRadius * 1.008 },
        uWidth: { value: 0.04 },
        uColor: { value: new THREE.Color(1.0, 0.96, 0.88) },
        uGlowColor: { value: new THREE.Color(0.4, 0.7, 1.0) },
        uCameraPosition: { value: new THREE.Vector3(0, 5, 25) },
      },
      vertexShader: PhotonRingShader.vertexShader,
      fragmentShader: PhotonRingShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.photonRing = new THREE.Mesh(photonGeo, this.photonMaterial);
    this.photonRing.renderOrder = 3;
    this.group.add(this.photonRing);

    // 4. Primary Equatorial Accretion Disk (Begins just outside the shadow)
    const diskInner = this.shadowRadius * 1.03;
    const diskOuter = 13.5 * this.rs;
    const diskGeo = new THREE.RingGeometry(diskInner, diskOuter, 128, 48);
    diskGeo.rotateX(-Math.PI / 2);

    this.diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInnerRadius: { value: diskInner },
        uOuterRadius: { value: diskOuter },
        uBlackHoleRadius: { value: this.shadowRadius },
        uDiskColorCore: { value: new THREE.Color(1.0, 0.95, 0.85) },
        uDiskColorMid: { value: new THREE.Color(1.0, 0.52, 0.10) },
        uDiskColorOuter: { value: new THREE.Color(0.72, 0.15, 0.02) },
        uDopplerStrength: { value: 1.25 },
        uTemperature: { value: 1.0 },
        uCameraPosition: { value: new THREE.Vector3(0, 5, 25) },
      },
      vertexShader: AccretionDiskShader.vertexShader,
      fragmentShader: AccretionDiskShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.accretionDisk = new THREE.Mesh(diskGeo, this.diskMaterial);
    this.accretionDisk.renderOrder = 4;
    this.group.add(this.accretionDisk);

    // 5. Subtle Relativistic Polar Jets (Faint ethereal wisps, never blinding)
    const jetGeo = new THREE.CylinderGeometry(0.06, 1.8, 28, 32, 1, true);
    jetGeo.translate(0, 14, 0);

    this.northJetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uJetLength: { value: 28.0 },
        uJetCoreColor: { value: new THREE.Color(0.3, 0.6, 1.0) },
        uJetGlowColor: { value: new THREE.Color(0.1, 0.2, 0.7) },
      },
      vertexShader: PolarJetShader.vertexShader,
      fragmentShader: PolarJetShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.northJet = new THREE.Mesh(jetGeo, this.northJetMaterial);
    this.northJet.renderOrder = 4;
    this.group.add(this.northJet);

    this.southJetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uJetLength: { value: 28.0 },
        uJetCoreColor: { value: new THREE.Color(0.3, 0.6, 1.0) },
        uJetGlowColor: { value: new THREE.Color(0.1, 0.2, 0.7) },
      },
      vertexShader: PolarJetShader.vertexShader,
      fragmentShader: PolarJetShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.southJet = new THREE.Mesh(jetGeo, this.southJetMaterial);
    this.southJet.rotation.x = Math.PI;
    this.southJet.renderOrder = 4;
    this.group.add(this.southJet);

    // 6. Relativistic Accretion Sparks outside shadow
    this.accretionParticles = this.createAccretionSparks(2000, diskInner, diskOuter);
    this.accretionParticles.renderOrder = 5;
    this.group.add(this.accretionParticles);

    // 7. Volumetric Ambient Dust Rings
    this.volumetricRings = this.createVolumetricRings(diskInner, diskOuter);
    this.group.add(this.volumetricRings);

    // Orbital inclination
    this.group.rotation.z = 0.06;
    this.group.rotation.x = 0.16;
  }

  private createVolumetricRings(rMin: number, rMax: number): THREE.Group {
    const group = new THREE.Group();
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const r1 = rMin + ((rMax - rMin) * i) / ringCount;
      const r2 = rMin + ((rMax - rMin) * (i + 1)) / ringCount;
      const geo = new THREE.RingGeometry(r1, r2, 64);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xffdfaa : i === 1 ? 0xff7711 : 0xb82805,
        transparent: true,
        opacity: 0.035,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = (i - 1) * 0.04;
      mesh.renderOrder = 4;
      group.add(mesh);
    }
    return group;
  }

  private createAccretionSparks(count: number, rMin: number, rMax: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const radii = new Float32Array(count);
    const initialThetas = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const r = rMin + (rMax - rMin) * Math.pow(u, 0.65);
      const theta = Math.random() * 2.0 * Math.PI;
      const y = (Math.random() - 0.5) * 0.25 * (r / rMin);

      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);

      radii[i] = r;
      initialThetas[i] = theta;
      speeds[i] = 3.5 / Math.pow(r, 1.25);

      const tempT = (r - rMin) / (rMax - rMin);
      if (tempT < 0.25) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 0.88;
      } else if (tempT < 0.65) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.58;
        colors[i * 3 + 2] = 0.12;
      } else {
        colors[i * 3] = 0.82;
        colors[i * 3 + 1] = 0.18;
        colors[i * 3 + 2] = 0.03;
      }

      sizes[i] = 2.0 + Math.random() * 3.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('radius', new THREE.BufferAttribute(radii, 1));
    geometry.setAttribute('initialTheta', new THREE.BufferAttribute(initialThetas, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute vec3 color;
        attribute float speed;
        attribute float radius;
        attribute float initialTheta;

        uniform float uTime;
        varying vec3 vColor;

        void main() {
          vColor = color;

          float angle = initialTheta - uTime * speed;
          vec3 pos = vec3(
            radius * cos(angle),
            position.y + sin(uTime * 2.0 + radius) * 0.04,
            radius * sin(angle)
          );

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (240.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          float intensity = exp(-dist * dist * 16.0);
          gl_FragColor = vec4(vColor * 1.5, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  public update(time: number, camera: THREE.Camera) {
    const camPos = camera.position;

    this.diskMaterial.uniforms.uTime.value = time;
    this.diskMaterial.uniforms.uCameraPosition.value.set(camPos.x, camPos.y, camPos.z);

    this.haloMaterial.uniforms.uTime.value = time;
    this.haloMaterial.uniforms.uCameraPosition.value.set(camPos.x, camPos.y, camPos.z);

    this.photonMaterial.uniforms.uTime.value = time;
    this.photonMaterial.uniforms.uCameraPosition.value.set(camPos.x, camPos.y, camPos.z);

    this.northJetMaterial.uniforms.uTime.value = time;
    this.southJetMaterial.uniforms.uTime.value = time;

    (this.accretionParticles.material as THREE.ShaderMaterial).uniforms.uTime.value = time;

    // Billboard the lensing halo without Euler angle mutation
    this.lensingArch.lookAt(camPos);

    // Slow rotation of volumetric gas
    this.volumetricRings.rotation.y = time * 0.08;
  }
}

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
  public lensingArchTop: THREE.Mesh;
  public lensingArchBottom: THREE.Mesh;
  public photonRing: THREE.Mesh;
  public northJet: THREE.Mesh;
  public southJet: THREE.Mesh;
  public accretionParticles: THREE.Points;
  public volumetricRings: THREE.Group;

  private diskMaterial: THREE.ShaderMaterial;
  private haloTopMaterial: THREE.ShaderMaterial;
  private haloBottomMaterial: THREE.ShaderMaterial;
  private photonMaterial: THREE.ShaderMaterial;
  private northJetMaterial: THREE.ShaderMaterial;
  private southJetMaterial: THREE.ShaderMaterial;

  public readonly rs = 1.0; // Schwarzschild radius in scene units

  constructor() {
    this.group = new THREE.Group();

    // 1. Event Horizon: Perfectly absorbing black sphere at r = rs
    const horizonGeo = new THREE.SphereGeometry(this.rs, 64, 64);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      reflectivity: 0,
    });
    this.eventHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.group.add(this.eventHorizon);

    // 2. Photon Ring: Razor-sharp light sphere at r = 1.505 * rs
    const photonGeo = new THREE.SphereGeometry(this.rs * 1.505, 64, 64);
    this.photonMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: 1.505 },
        uWidth: { value: 0.08 },
        uColor: { value: new THREE.Color(1.0, 0.98, 0.92) },
        uGlowColor: { value: new THREE.Color(0.4, 0.75, 1.0) },
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
    this.group.add(this.photonRing);

    // 3. Primary Equatorial Accretion Disk
    const diskInner = 2.4 * this.rs;
    const diskOuter = 14.5 * this.rs;
    const diskGeo = new THREE.RingGeometry(diskInner, diskOuter, 128, 48);
    diskGeo.rotateX(-Math.PI / 2);

    this.diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInnerRadius: { value: diskInner },
        uOuterRadius: { value: diskOuter },
        uBlackHoleRadius: { value: this.rs },
        uDiskColorCore: { value: new THREE.Color(1.0, 0.96, 0.88) },
        uDiskColorMid: { value: new THREE.Color(1.0, 0.58, 0.12) },
        uDiskColorOuter: { value: new THREE.Color(0.85, 0.18, 0.03) },
        uDopplerStrength: { value: 1.4 },
        uTemperature: { value: 1.15 },
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
    this.group.add(this.accretionDisk);

    // 4. Kip Thorne Gravitational Lensing Arches:
    // Top arch (secondary image of back disk bent over north pole)
    const haloGeoTop = new THREE.RingGeometry(1.15 * this.rs, 4.5 * this.rs, 128, 32);
    this.haloTopMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInnerRadius: { value: 1.15 * this.rs },
        uOuterRadius: { value: 4.5 * this.rs },
        uDiskColorCore: { value: new THREE.Color(1.0, 0.96, 0.88) },
        uDiskColorMid: { value: new THREE.Color(1.0, 0.58, 0.12) },
        uDiskColorOuter: { value: new THREE.Color(0.85, 0.18, 0.03) },
        uCameraPosition: { value: new THREE.Vector3(0, 5, 25) },
      },
      vertexShader: LensingHaloShader.vertexShader,
      fragmentShader: LensingHaloShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.lensingArchTop = new THREE.Mesh(haloGeoTop, this.haloTopMaterial);
    this.group.add(this.lensingArchTop);

    // Bottom arch (tertiary image of back disk bent under south pole)
    const haloGeoBottom = new THREE.RingGeometry(1.12 * this.rs, 3.8 * this.rs, 128, 32);
    this.haloBottomMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInnerRadius: { value: 1.12 * this.rs },
        uOuterRadius: { value: 3.8 * this.rs },
        uDiskColorCore: { value: new THREE.Color(1.0, 0.96, 0.88) },
        uDiskColorMid: { value: new THREE.Color(1.0, 0.58, 0.12) },
        uDiskColorOuter: { value: new THREE.Color(0.85, 0.18, 0.03) },
        uCameraPosition: { value: new THREE.Vector3(0, 5, 25) },
      },
      vertexShader: LensingHaloShader.vertexShader,
      fragmentShader: LensingHaloShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.lensingArchBottom = new THREE.Mesh(haloGeoBottom, this.haloBottomMaterial);
    this.group.add(this.lensingArchBottom);

    // 5. Relativistic Polar Jets
    const jetGeo = new THREE.CylinderGeometry(0.08, 2.5, 32, 32, 1, true);
    jetGeo.translate(0, 16, 0);

    this.northJetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uJetLength: { value: 32.0 },
        uJetCoreColor: { value: new THREE.Color(0.5, 0.85, 1.0) },
        uJetGlowColor: { value: new THREE.Color(0.15, 0.35, 0.95) },
      },
      vertexShader: PolarJetShader.vertexShader,
      fragmentShader: PolarJetShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.northJet = new THREE.Mesh(jetGeo, this.northJetMaterial);
    this.group.add(this.northJet);

    this.southJetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uJetLength: { value: 32.0 },
        uJetCoreColor: { value: new THREE.Color(0.5, 0.85, 1.0) },
        uJetGlowColor: { value: new THREE.Color(0.15, 0.35, 0.95) },
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
    this.group.add(this.southJet);

    // 6. Swirling Relativistic Plasma Sparks & Glowing Embers
    this.accretionParticles = this.createAccretionSparks(2400, diskInner, diskOuter);
    this.group.add(this.accretionParticles);

    // 7. Volumetric Glowing Gas Rings
    this.volumetricRings = this.createVolumetricRings(diskInner, diskOuter);
    this.group.add(this.volumetricRings);

    // Default orbital tilt
    this.group.rotation.z = 0.08;
    this.group.rotation.x = 0.18;
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
        color: i === 0 ? 0xfff0d0 : i === 1 ? 0xff8820 : 0xd03008,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = (i - 1) * 0.05;
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
      const y = (Math.random() - 0.5) * 0.3 * (r / rMin);

      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);

      radii[i] = r;
      initialThetas[i] = theta;
      speeds[i] = 3.8 / Math.pow(r, 1.25);

      const tempT = (r - rMin) / (rMax - rMin);
      if (tempT < 0.25) {
        colors[i * 3] = 0.98;
        colors[i * 3 + 1] = 0.98;
        colors[i * 3 + 2] = 1.0;
      } else if (tempT < 0.65) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.65;
        colors[i * 3 + 2] = 0.18;
      } else {
        colors[i * 3] = 0.88;
        colors[i * 3 + 1] = 0.22;
        colors[i * 3 + 2] = 0.04;
      }

      sizes[i] = 2.2 + Math.random() * 4.0;
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
            position.y + sin(uTime * 2.2 + radius) * 0.06,
            radius * sin(angle)
          );

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (260.0 / -mvPosition.z);
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
          gl_FragColor = vec4(vColor * 1.6, intensity);
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

    this.haloTopMaterial.uniforms.uTime.value = time;
    this.haloTopMaterial.uniforms.uCameraPosition.value.set(camPos.x, camPos.y, camPos.z);

    this.haloBottomMaterial.uniforms.uTime.value = time;
    this.haloBottomMaterial.uniforms.uCameraPosition.value.set(camPos.x, camPos.y, camPos.z);

    this.photonMaterial.uniforms.uTime.value = time;
    this.photonMaterial.uniforms.uCameraPosition.value.set(camPos.x, camPos.y, camPos.z);

    this.northJetMaterial.uniforms.uTime.value = time;
    this.southJetMaterial.uniforms.uTime.value = time;

    (this.accretionParticles.material as THREE.ShaderMaterial).uniforms.uTime.value = time;

    // Align the gravitational arches with the camera orientation
    this.lensingArchTop.quaternion.copy(camera.quaternion);
    this.lensingArchBottom.quaternion.copy(camera.quaternion);
    // Invert the bottom arch to arc gracefully under the south pole
    this.lensingArchBottom.rotation.z += Math.PI;

    // Slow rotation of volumetric gas
    this.volumetricRings.rotation.y = time * 0.1;
  }
}

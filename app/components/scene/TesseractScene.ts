import * as THREE from 'three';
import {
  TesseractGridShader,
  TimelineRibbonShader,
  SingularityCoreShader,
} from '../shaders/tesseractShader';

export interface TimelineNode {
  id: string;
  year: string;
  title: string;
  description: string;
  coordinates: string;
  baseOffsetZ: number;
  lateralOffset: THREE.Vector2;
  mesh?: THREE.Group;
}

export class TesseractScene {
  public group: THREE.Group;
  public gridMesh: THREE.Mesh;
  public singularityCore: THREE.Mesh;
  public timelineRibbons: THREE.Mesh[] = [];
  public timelineNodes: TimelineNode[] = [];
  public quantumStream: THREE.Points;

  private gridMaterial: THREE.ShaderMaterial;
  private ribbonMaterial: THREE.ShaderMaterial;
  private singularityMaterial: THREE.ShaderMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    // 1. Infinite Multidimensional Tesseract Hyper-Grid
    const gridGeo = new THREE.BoxGeometry(42, 42, 320, 24, 24, 120);
    this.gridMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(TesseractGridShader.uniforms),
      vertexShader: TesseractGridShader.vertexShader,
      fragmentShader: TesseractGridShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.gridMesh = new THREE.Mesh(gridGeo, this.gridMaterial);
    this.group.add(this.gridMesh);

    // 2. Flowing Infinite Timeline Ribbons (Worldlines)
    this.ribbonMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(TimelineRibbonShader.uniforms),
      vertexShader: TimelineRibbonShader.vertexShader,
      fragmentShader: TimelineRibbonShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const numRibbons = 10;
    for (let i = 0; i < numRibbons; i++) {
      const angle = (i / numRibbons) * Math.PI * 2;
      const radius = 6.0 + (i % 3) * 2.5;
      const ribbonGeo = new THREE.PlaneGeometry(0.75, 300, 1, 160);
      ribbonGeo.rotateX(Math.PI / 2);

      const ribbon = new THREE.Mesh(ribbonGeo, this.ribbonMaterial);
      ribbon.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -120
      );
      ribbon.rotation.z = angle + Math.PI / 2;
      this.timelineRibbons.push(ribbon);
      this.group.add(ribbon);
    }

    // 3. Cyclic Timeline Memory Nodes that populate the infinite corridor
    this.setupTimelineNodes();

    // 4. Quantum Information Particle Stream
    this.quantumStream = this.createQuantumStream(4500);
    this.group.add(this.quantumStream);

    // 5. Singularity Core (Cosmic Rebirth Beacon)
    const singGeo = new THREE.SphereGeometry(4.0, 64, 64);
    this.singularityMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(SingularityCoreShader.uniforms),
      vertexShader: SingularityCoreShader.vertexShader,
      fragmentShader: SingularityCoreShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.singularityCore = new THREE.Mesh(singGeo, this.singularityMaterial);
    this.group.add(this.singularityCore);
  }

  private setupTimelineNodes() {
    const rawNodes: Omit<TimelineNode, 'mesh'>[] = [
      {
        id: 'node-earth',
        year: 'ERA I',
        title: 'Mission Launch & Wormhole Ingress',
        description: 'Traversing the spherical wormhole near Saturn.',
        coordinates: 'DIMENSION 5 // SECTOR Alpha',
        baseOffsetZ: 40,
        lateralOffset: new THREE.Vector2(-4.2, 2.5),
      },
      {
        id: 'node-miller',
        year: 'ERA II',
        title: "Miller's Ocean Extreme Dilation",
        description: 'Gravitational redshift: 1 hour = 7 Earth years.',
        coordinates: 'DIMENSION 5 // SECTOR Beta',
        baseOffsetZ: 95,
        lateralOffset: new THREE.Vector2(4.5, -3.0),
      },
      {
        id: 'node-horizon',
        year: 'ERA III',
        title: 'Event Horizon Spacetime Inversion',
        description: 'Distance becomes time; singularity becomes the unavoidable future.',
        coordinates: 'DIMENSION 5 // SECTOR Gamma',
        baseOffsetZ: 150,
        lateralOffset: new THREE.Vector2(-3.6, -2.8),
      },
      {
        id: 'node-tesseract',
        year: 'ERA IV',
        title: '5D Bulk Lattice Construction',
        description: 'Physical manifestation of time worldlines across the bulk.',
        coordinates: 'DIMENSION 5 // SECTOR Delta',
        baseOffsetZ: 205,
        lateralOffset: new THREE.Vector2(3.8, 3.2),
      },
    ];

    rawNodes.forEach((node) => {
      const nodeGroup = this.createNodeMesh();
      this.group.add(nodeGroup);

      this.timelineNodes.push({
        ...node,
        mesh: nodeGroup,
      });
    });
  }

  private createNodeMesh(): THREE.Group {
    const group = new THREE.Group();

    // Outer crystalline ring
    const ringGeo = new THREE.TorusGeometry(1.8, 0.04, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x55ccff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Inner pulsing core
    const coreGeo = new THREE.OctahedronGeometry(0.85, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffd277,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Gravitational wave halo
    const haloGeo = new THREE.RingGeometry(1.9, 2.6, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x3388ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);

    return group;
  }

  private createQuantumStream(count: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = -Math.random() * 320;

      const cType = Math.random();
      if (cType < 0.45) {
        colors[i * 3] = 0.2;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 1.0;
      } else if (cType < 0.75) {
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.3;
        colors[i * 3 + 2] = 1.0;
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 0.4;
      }

      sizes[i] = 2.0 + Math.random() * 4.5;
      speeds[i] = 20.0 + Math.random() * 45.0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCameraZ: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute float size;
        attribute vec3 color;
        attribute float speed;

        uniform float uTime;
        uniform float uCameraZ;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Wrap particles continuously relative to the camera's infinite Z position
          float streamSpan = 300.0;
          float relZ = mod(pos.z - uTime * speed, streamSpan);
          pos.z = uCameraZ - relZ;

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
          float intensity = exp(-dist * dist * 14.0);
          gl_FragColor = vec4(vColor * 1.5, intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  public update(time: number, camera: THREE.Camera, portalIntensity: number) {
    if (portalIntensity <= 0.001) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;

    const camZ = camera.position.z;

    // Center the infinite hyper-grid around current camera Z
    this.gridMesh.position.z = camZ - 100.0;

    // Reposition ribbons along camera Z
    this.timelineRibbons.forEach((ribbon) => {
      ribbon.position.z = camZ - 100.0;
    });

    // Update quantum stream camera Z
    const streamMat = this.quantumStream.material as THREE.ShaderMaterial;
    streamMat.uniforms.uTime.value = time;
    streamMat.uniforms.uCameraZ.value = camZ;

    // Update shaders
    this.gridMaterial.uniforms.uTime.value = time;
    this.gridMaterial.uniforms.uIntensity.value = portalIntensity;
    this.gridMaterial.uniforms.uCameraZ.value = camZ;

    this.ribbonMaterial.uniforms.uTime.value = time;
    this.singularityMaterial.uniforms.uTime.value = time;

    // Cyclic infinite positioning of temporal nodes
    const cycleLength = 240.0;
    this.timelineNodes.forEach((node, idx) => {
      if (node.mesh) {
        // Node appears periodically ahead of camera
        const relOffset = ((camZ - node.baseOffsetZ) % cycleLength);
        const nodeZ = camZ + relOffset - 30.0;
        
        node.mesh.position.set(
          node.lateralOffset.x + Math.sin(time + idx) * 0.4,
          node.lateralOffset.y + Math.cos(time + idx) * 0.4,
          nodeZ
        );

        node.mesh.rotation.y = time * 0.8 + idx;
        node.mesh.rotation.x = Math.sin(time + idx) * 0.3;
      }
    });

    // Singularity beacon always floats ahead as an alluring infinite light
    this.singularityCore.position.set(
      Math.sin(time * 0.5) * 1.5,
      Math.cos(time * 0.4) * 1.5,
      camZ - 140.0
    );
    this.singularityCore.rotation.y = time * 0.5;
    this.singularityCore.rotation.z = time * 0.3;
  }
}

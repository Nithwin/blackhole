import * as THREE from 'three';

export interface FlightMetrics {
  progress: number;
  stageIndex: number;
  stageName: string;
  stageDescription: string;
  distanceRs: number;
  timeDilation: number;
  velocityFractionC: number;
  portalActive: boolean;
  portalIntensity: number;
  infiniteDistance: number; // Accumulated timeline distance
}

export const BASE_STAGES = [
  {
    name: 'Gargantua Orbit',
    range: [0.0, 0.2] as [number, number],
    desc: 'Distant vantage of the Kerr black hole and relativistic accretion disk.',
  },
  {
    name: 'Accretion Infall',
    range: [0.2, 0.45] as [number, number],
    desc: 'Freefall trajectory diving through the superheated plasma plane.',
  },
  {
    name: 'Photon Sphere',
    range: [0.45, 0.6] as [number, number],
    desc: 'Passing the photon ring at r = 1.5 rs. Optical closed light loops.',
  },
  {
    name: 'Event Horizon',
    range: [0.6, 0.75] as [number, number],
    desc: 'Crossing the event horizon (r = 1.0 rs). Space and time invert.',
  },
  {
    name: '5D Timeline Portal',
    range: [0.75, 1.0] as [number, number],
    desc: 'Infinite higher-dimensional corridor. Navigating infinite worldlines.',
  },
];

export class CameraPathController {
  public targetProgress = 0.0;
  public currentProgress = 0.0;
  private lerpSpeed = 0.055; // Silky smooth inertia

  // Free-look camera offsets
  public freeLook = false;
  public freeLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private freeLookTarget = new THREE.Vector2(0, 0);

  constructor() {}

  public setTargetProgress(p: number) {
    // Uncapped upper bound for infinite scrolling!
    this.targetProgress = Math.max(0.0, p);
  }

  public addScrollDelta(delta: number) {
    this.setTargetProgress(this.targetProgress + delta);
  }

  public handleMouseMove(deltaX: number, deltaY: number) {
    if (this.freeLook) {
      this.freeLookTarget.x -= deltaX * 0.0025;
      this.freeLookTarget.y -= deltaY * 0.0025;
      this.freeLookTarget.y = Math.max(-Math.PI * 0.35, Math.min(Math.PI * 0.35, this.freeLookTarget.y));
    }
  }

  public update(
    camera: THREE.PerspectiveCamera,
    deltaTime: number
  ): FlightMetrics {
    // Smooth inertia interpolation
    this.currentProgress += (this.targetProgress - this.currentProgress) * this.lerpSpeed;

    const p = this.currentProgress;

    const camPos = new THREE.Vector3();
    const targetPos = new THREE.Vector3();
    let fov = 45;
    let distanceRs = 30.0;
    let velocityC = 0.05;
    let portalIntensity = 0.0;

    if (p < 0.2) {
      // Phase 1: Distant Orbit
      const t = p / 0.2;
      const angle = 0.2 + t * 0.4;
      const radius = 28.0 - t * 8.0;
      camPos.set(Math.sin(angle) * radius, 5.0 - t * 2.0, Math.cos(angle) * radius);
      targetPos.set(0, 0, 0);
      fov = 45 - t * 3;
      distanceRs = radius;
      velocityC = 0.12 + t * 0.18;
    } else if (p < 0.45) {
      // Phase 2: Accretion Infall
      const t = (p - 0.2) / 0.25;
      const radius = 20.0 * (1 - t) + 3.2 * t;
      const angle = 0.6 + t * 1.8;
      const height = 3.0 * (1 - t) + 0.35 * t;
      camPos.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
      targetPos.set(0, 0, 0);
      fov = 42 + t * 8;
      distanceRs = radius;
      velocityC = 0.3 + t * 0.42;
    } else if (p < 0.6) {
      // Phase 3: Photon Sphere Crossing (r = 1.5 rs)
      const t = (p - 0.45) / 0.15;
      const radius = 3.2 * (1 - t) + 1.48 * t;
      const angle = 2.4 + t * 1.2;
      camPos.set(Math.sin(angle) * radius, 0.35 * (1 - t) + 0.02 * t, Math.cos(angle) * radius);
      targetPos.set(0, 0, 0);
      fov = 50 + t * 14;
      distanceRs = radius;
      velocityC = 0.72 + t * 0.20;
    } else if (p < 0.75) {
      // Phase 4: Event Horizon Ingress (Crossing r = 1.0 rs into interior)
      const t = (p - 0.6) / 0.15;
      const zPos = 1.48 * (1 - t) + (-12.0) * t;
      camPos.set(0.08 * (1 - t), 0.02 * (1 - t), zPos);
      targetPos.set(0, 0, zPos - 30);
      fov = 64 - t * 10;
      distanceRs = Math.max(0.02, 1.48 * (1 - t));
      velocityC = 0.92 + t * 0.079;
      portalIntensity = Math.min(1.0, Math.max(0.0, (t - 0.3) * 1.5));
    } else {
      // Phase 5+: INFINITE 5D TIMELINE PORTAL (Uncapped!)
      const u = p - 0.75; // >= 0, extends infinitely
      const infiniteZ = -12.0 - u * 200.0; // Endless travel along Z

      // Continuous lateral undulation through hyper-dimensional worldline threads
      const waveX = Math.sin(u * 3.2) * 3.5 + Math.cos(u * 1.6) * 1.5;
      const waveY = Math.cos(u * 2.5) * 2.8 + Math.sin(u * 1.2) * 1.0;
      
      camPos.set(waveX, waveY, infiniteZ);
      // Look forward along the undulating tunnel
      const nextWaveX = Math.sin((u + 0.15) * 3.2) * 3.5;
      const nextWaveY = Math.cos((u + 0.15) * 2.5) * 2.8;
      targetPos.set(nextWaveX, nextWaveY, infiniteZ - 45.0);

      fov = 58;
      distanceRs = 0.0;
      velocityC = 0.999;
      portalIntensity = 1.0;
    }

    // Apply computed position & FOV
    camera.position.copy(camPos);
    camera.fov = fov;
    camera.updateProjectionMatrix();

    if (this.freeLook) {
      this.freeLookEuler.x += (this.freeLookTarget.y - this.freeLookEuler.x) * 0.1;
      this.freeLookEuler.y += (this.freeLookTarget.x - this.freeLookEuler.y) * 0.1;
      camera.lookAt(targetPos);
      camera.rotation.x += this.freeLookEuler.x;
      camera.rotation.y += this.freeLookEuler.y;
    } else {
      camera.lookAt(targetPos);
    }

    // Relativistic physics formulas
    const rs = 1.0;
    const rSafe = Math.max(1.0001, distanceRs);
    const timeDilation = 1.0 / Math.sqrt(Math.max(0.0001, 1.0 - rs / rSafe));

    // Dynamic stage indicator
    let stageIndex = 0;
    let stageName = 'Gargantua Orbit';
    let stageDescription = 'Distant observation of the Kerr black hole.';

    if (p < 0.2) {
      stageIndex = 0;
      stageName = 'Gargantua Orbit';
      stageDescription = 'Distant observation of the Kerr black hole.';
    } else if (p < 0.45) {
      stageIndex = 1;
      stageName = 'Accretion Infall';
      stageDescription = 'Plunging through the relativistic plasma disk.';
    } else if (p < 0.6) {
      stageIndex = 2;
      stageName = 'Photon Sphere';
      stageDescription = 'Closed light orbits at 1.5 Schwarzschild radii.';
    } else if (p < 0.75) {
      stageIndex = 3;
      stageName = 'Event Horizon';
      stageDescription = 'Causal boundary ingress. Spacetime coordinates invert.';
    } else {
      const sectorNumber = Math.floor((p - 0.75) * 2) + 1;
      stageIndex = 4;
      stageName = `5D Timeline — Sector ${sectorNumber}`;
      stageDescription = 'Traversing infinite multidimensional worldline corridors.';
    }

    return {
      progress: p,
      stageIndex,
      stageName,
      stageDescription,
      distanceRs,
      timeDilation,
      velocityFractionC: velocityC,
      portalActive: p >= 0.65,
      portalIntensity,
      infiniteDistance: Math.max(0, (p - 0.75) * 200),
    };
  }
}

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { Starfield } from './scene/Starfield';
import { BlackHoleScene } from './scene/BlackHoleScene';
import { TesseractScene } from './scene/TesseractScene';
import { CameraPathController, FlightMetrics } from './scene/CameraPath';
import { CosmicAudioEngine } from './audio/CosmicAudioEngine';
import { GravitationalLensShader } from './shaders/gravitationalLens';
import { TelemetryHUD } from './ui/TelemetryHUD';
import { ChapterNav } from './ui/ChapterNav';
import { ControlsOverlay } from './ui/ControlsOverlay';
import { StoryOverlays } from './ui/StoryOverlays';

export const BlackHoleCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Persistent engine controllers
  const controllerRef = useRef<CameraPathController>(new CameraPathController());
  const audioRef = useRef<CosmicAudioEngine>(new CosmicAudioEngine());

  // React state for HUD / UI
  const [metrics, setMetrics] = useState<FlightMetrics | null>(null);
  const [audioActive, setAudioActive] = useState(false);
  const [freeLook, setFreeLook] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(16));

  // GSAP animated stage jump
  const handleSelectStage = useCallback((targetProgress: number) => {
    gsap.killTweensOf(controllerRef.current);
    gsap.to(controllerRef.current, {
      targetProgress: targetProgress,
      duration: 1.8,
      ease: 'power3.inOut',
    });
  }, []);

  const handleToggleAudio = useCallback(() => {
    const active = audioRef.current.toggleMute();
    setAudioActive(active);
  }, []);

  const handleToggleFreeLook = useCallback(() => {
    controllerRef.current.freeLook = !controllerRef.current.freeLook;
    setFreeLook(controllerRef.current.freeLook);
  }, []);

  // GSAP animated view reset
  const handleResetView = useCallback(() => {
    gsap.killTweensOf(controllerRef.current);
    gsap.to(controllerRef.current, {
      targetProgress: 0.0,
      duration: 2.2,
      ease: 'power4.out',
      onComplete: () => {
        controllerRef.current.freeLook = false;
        setFreeLook(false);
      },
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Setup Three.js Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      2500
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 2. Post-Processing Pipeline: RenderPass -> UnrealBloomPass -> GravitationalLensShader
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // High-end cinematic optical bloom for incandescent accretion disk & 5D tesseract strings
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.15, // strength
      0.65, // radius
      0.22  // threshold
    );
    composer.addPass(bloomPass);

    // Gravitational Lensing & Einstein Ring deflection pass
    const lensPass = new ShaderPass(GravitationalLensShader);
    lensPass.uniforms.uResolution.value.set(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio);
    lensPass.uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    composer.addPass(lensPass);

    // 3. Assemble Scene Components
    const starfield = new Starfield(14000, 750);
    scene.add(starfield.group);

    const blackHole = new BlackHoleScene();
    scene.add(blackHole.group);

    const tesseract = new TesseractScene();
    scene.add(tesseract.group);

    // 4. Input Listeners: Smooth Infinite Scroll, Touch Drag, Key Navigation
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      gsap.killTweensOf(controllerRef.current);
      // Infinite scroll delta: normalized and smooth
      const delta = e.deltaY * 0.00048;
      controllerRef.current.addScrollDelta(delta);
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - lastPointerX;
      const deltaY = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      if (isDragging) {
        if (controllerRef.current.freeLook) {
          controllerRef.current.handleMouseMove(deltaX, deltaY);
        } else {
          gsap.killTweensOf(controllerRef.current);
          controllerRef.current.addScrollDelta(-deltaY * 0.0016);
        }
      }
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        gsap.killTweensOf(controllerRef.current);
        controllerRef.current.addScrollDelta(0.045);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        gsap.killTweensOf(controllerRef.current);
        controllerRef.current.addScrollDelta(-0.045);
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleAudio();
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFreeLook();
      }
    };

    const onResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pr = Math.min(window.devicePixelRatio, 2);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      composer.setSize(width, height);
      bloomPass.setSize(width, height);

      lensPass.uniforms.uResolution.value.set(width * pr, height * pr);
      lensPass.uniforms.uAspect.value = width / height;
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    // 5. Animation Render Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;
    let frameCounter = 0;

    const tempV3 = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update camera flight trajectory
      const currentFlightMetrics = controllerRef.current.update(camera, deltaTime);

      // Black Hole and Screen-Space Lensing Calculations
      tempV3.set(0, 0, 0);
      tempV3.project(camera);
      const screenX = (tempV3.x + 1.0) / 2.0;
      const screenY = (tempV3.y + 1.0) / 2.0;
      const isBehind = tempV3.z > 1.0;

      tempV3.set(blackHole.rs, 0, 0);
      tempV3.project(camera);
      const edgeScreenX = (tempV3.x + 1.0) / 2.0;
      const screenRadius = isBehind ? 0.0 : Math.abs(edgeScreenX - screenX);

      // Update screen-space lensing uniforms
      lensPass.uniforms.uBlackHoleScreenPos.value.set(screenX, screenY);
      lensPass.uniforms.uBlackHoleScreenRadius.value =
        currentFlightMetrics.progress > 0.65 ? 0.0 : Math.min(0.45, screenRadius);
      lensPass.uniforms.uLensingStrength.value =
        currentFlightMetrics.progress > 0.6 ? 0.0 : 1.0;

      // Update 3D components
      const velocityDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      starfield.update(
        elapsedTime,
        currentFlightMetrics.velocityFractionC * 0.7,
        velocityDir
      );

      blackHole.update(elapsedTime, camera);

      // Fade out black hole when fully inside the tesseract
      if (currentFlightMetrics.progress > 0.72) {
        blackHole.group.visible = false;
      } else {
        blackHole.group.visible = true;
      }

      tesseract.update(
        elapsedTime,
        camera,
        currentFlightMetrics.portalIntensity
      );

      // Update procedural sound engine
      audioRef.current.update(
        currentFlightMetrics.progress,
        currentFlightMetrics.velocityFractionC
      );

      // Render via Post-Processing Pipeline
      composer.render();

      // Update React UI state at 15 FPS
      frameCounter++;
      if (frameCounter % 4 === 0) {
        setMetrics(currentFlightMetrics);
        if (audioActive) {
          setAudioData(audioRef.current.getAudioData());
        }
      }
    };

    animate();

    // 6. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      composer.dispose();
    };
  }, [audioActive, handleToggleAudio, handleToggleFreeLook]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Clean Cinematic Subtitle Indicator */}
      <StoryOverlays metrics={metrics} />

      {/* Sleek Framing Overlay (Unwanted bulky metrics text removed) */}
      <TelemetryHUD
        metrics={metrics}
        audioActive={audioActive}
        audioData={audioData}
      />

      {/* Infinite Chapter Navigation */}
      <ChapterNav
        currentProgress={metrics ? metrics.progress : 0}
        currentStageIndex={metrics ? metrics.stageIndex : 0}
        onSelectStage={handleSelectStage}
      />

      {/* Interactive Controls Overlay */}
      <ControlsOverlay
        audioActive={audioActive}
        onToggleAudio={handleToggleAudio}
        freeLook={freeLook}
        onToggleFreeLook={handleToggleFreeLook}
        onResetView={handleResetView}
      />
    </div>
  );
};

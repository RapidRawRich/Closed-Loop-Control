import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ProcessType, LoopState, LoopParameters } from '../types';
import { RotateCw, ZoomIn, ZoomOut, Eye, Compass, Layers } from 'lucide-react';

interface ThreeViewportProps {
  processType: ProcessType;
  loopState: LoopState;
  loopParams: LoopParameters;
}

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  processType,
  loopState,
  loopParams,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const equipGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Fallback state if WebGL is unavailable
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotTargetRef = useRef({ x: 0.15, y: -0.4 });
  const panTargetRef = useRef({ x: 0, y: 0 });
  const zoomTargetRef = useRef(14);
  const autoRotateRef = useRef(true);

  // Store refs to dynamic mesh parts
  const dynamicMeshesRef = useRef<{
    hxTubes: THREE.Mesh[];
    hxSteamValve: THREE.Mesh | null;
    tankLiquid: THREE.Mesh | null;
    tankStream: THREE.Mesh | null;
    tankDrainValve: THREE.Mesh | null;
    conveyorPkgs: THREE.Mesh[];
    distillTrays: THREE.Mesh[];
    distillStreams: THREE.Mesh[];
    distillFeed: THREE.Mesh | null;
  }>({
    hxTubes: [],
    hxSteamValve: null,
    tankLiquid: null,
    tankStream: null,
    tankDrainValve: null,
    conveyorPkgs: [],
    distillTrays: [],
    distillStreams: [],
    distillFeed: null,
  });

  // State refs to read safely in render loop without re-triggering effects
  const loopStateRef = useRef(loopState);
  loopStateRef.current = loopState;
  const loopParamsRef = useRef(loopParams);
  loopParamsRef.current = loopParams;

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Test WebGL support
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4.5, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (err) {
      console.warn("Could not create WebGLRenderer:", err);
      setWebglSupported(false);
      return;
    }

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 16, 12);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-10, -5, -8);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x60a5fa, 0.8, 20);
    pointLight.position.set(0, 8, 4);
    scene.add(pointLight);

    // 5. Industrial Floor Grid
    const gridHelper = new THREE.GridHelper(26, 26, 0x334155, 0x1e293b);
    gridHelper.position.y = -3.4;
    scene.add(gridHelper);

    // Subtle floor plate
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0x070a11, depthWrite: false });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -3.42;
    scene.add(floor);

    // 6. Equipment Group
    const equipGroup = new THREE.Group();
    scene.add(equipGroup);
    equipGroupRef.current = equipGroup;

    // Handle Window Resizing
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Master Animation Frame Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Auto-rotation when user is not actively interacting
      if (autoRotateRef.current && equipGroupRef.current) {
        rotTargetRef.current.y += 0.002;
      }

      if (equipGroupRef.current) {
        equipGroupRef.current.rotation.y += (rotTargetRef.current.y - equipGroupRef.current.rotation.y) * 0.1;
        equipGroupRef.current.rotation.x += (rotTargetRef.current.x - equipGroupRef.current.rotation.x) * 0.1;
        equipGroupRef.current.position.x += (panTargetRef.current.x - equipGroupRef.current.position.x) * 0.1;
        equipGroupRef.current.position.y += (panTargetRef.current.y - equipGroupRef.current.position.y) * 0.1;
      }

      if (cameraRef.current) {
        cameraRef.current.position.z += (zoomTargetRef.current - cameraRef.current.position.z) * 0.1;
      }

      // Update Equipment Visual Dynamics
      const curState = loopStateRef.current;
      const curParams = loopParamsRef.current;
      const curPV = curState.pv;
      const curCO = curState.co;
      const curLoad = curState.loadDisturbance;

      // 1. Heat Exchanger Tubes: Cold cyan (0.55 hue) to Burning Red (0.0 hue)
      const heatHue = Math.max(0.0, (1.0 - curPV / 100.0) * 0.55);
      dynamicMeshesRef.current.hxTubes.forEach((tube) => {
        const mat = tube.material as THREE.MeshStandardMaterial;
        mat.emissive.setHSL(heatHue, 1.0, 0.45);
      });
      if (dynamicMeshesRef.current.hxSteamValve) {
        // Steam valve rotation / size proportional to CO
        dynamicMeshesRef.current.hxSteamValve.rotation.y = (curCO / 100.0) * Math.PI;
      }

      // 2. Liquid Tank: Level rise and fall + Stream animation
      if (dynamicMeshesRef.current.tankLiquid) {
        const liquidMesh = dynamicMeshesRef.current.tankLiquid;
        const targetHeight = Math.max(0.1, (curPV / 100.0) * 6.0);
        liquidMesh.scale.y = targetHeight;
        liquidMesh.position.y = -3.2 + targetHeight / 2.0;

        // Dynamic fluid hydrostatic depth tinting
        const mat = liquidMesh.material as THREE.MeshStandardMaterial;
        mat.color.setHSL(0.58, 0.9, 0.25 + (curPV / 100.0) * 0.35);
        mat.emissive.setHSL(0.58, 1.0, 0.05 + (curPV / 100.0) * 0.15);
      }
      if (dynamicMeshesRef.current.tankStream) {
        const stream = dynamicMeshesRef.current.tankStream;
        stream.visible = curCO > 3.0;
        const streamWidth = Math.max(0.1, curCO / 80.0);
        stream.scale.set(streamWidth, 1.0, streamWidth);
      }
      if (dynamicMeshesRef.current.tankDrainValve) {
        dynamicMeshesRef.current.tankDrainValve.rotation.x = curLoad > 5 ? Math.PI / 4 : 0;
      }

      // 3. Conveyor Belt Packets: Moving material with transport delay
      const speed = 8.0 / Math.max(0.5, curParams.tauD);
      const timeSec = Date.now() * 0.001;
      dynamicMeshesRef.current.conveyorPkgs.forEach((pkg, idx) => {
        const offset = ((timeSec * (speed * 0.25) + idx * 2.2) % 11.0);
        const posX = -5.5 + offset;
        pkg.position.x = posX;
        const mat = pkg.material as THREE.MeshStandardMaterial;
        if (posX >= 3.8) {
          // After crossing optical sensor gate: Glows with measured PV!
          mat.emissive.setHSL((1.0 - curPV / 100.0) * 0.55, 1.0, 0.45);
        } else {
          // Upstream on belt before measurement gate: Neutral unmeasured raw material
          mat.emissive.setHex(0x334155);
        }
      });

      // 4. Distillation Column: 4 Tray froth states showing multicapacity wave
      const distillTrayYs = [2.9, 1.0, -0.9, -2.8]; // Tray 1 (Top) to Tray 4 (Bottom)
      dynamicMeshesRef.current.distillTrays.forEach((tray, idx) => {
        const trayVal = Math.max(0, Math.min(100, curState.trayStates[idx] ?? curPV));
        const mat = tray.material as THREE.MeshStandardMaterial;

        // Dynamic height scaling (0.05 to 0.7 units high based on level %)
        const targetH = Math.max(0.06, (trayVal / 100.0) * 0.75);
        tray.scale.set(1.0, targetH / 0.35, 1.0);
        tray.position.y = distillTrayYs[idx] + 0.05 + targetH / 2.0;

        // Thermal/Froth color gradient from cooler top reflux (cyan/green) to hot reboiler (amber/rose)
        const baseHue = 0.50 - idx * 0.09;
        mat.color.setHSL(baseHue, 0.9, 0.28 + (trayVal / 100.0) * 0.3);
        mat.emissive.setHSL(baseHue, 1.0, 0.12 + (trayVal / 100.0) * 0.4);
      });

      // Distillation downcomer streams between trays
      dynamicMeshesRef.current.distillStreams.forEach((stream, sIdx) => {
        const sourceVal = Math.max(0, Math.min(100, curState.trayStates[sIdx] ?? curPV));
        stream.visible = sourceVal > 8.0;
        const streamThick = Math.max(0.1, sourceVal / 85.0);
        stream.scale.set(streamThick, 1.0, streamThick);
      });

      // Distillation reflux feed into Tray 1
      if (dynamicMeshesRef.current.distillFeed) {
        dynamicMeshesRef.current.distillFeed.visible = curCO > 3.0;
        const fScale = Math.max(0.1, curCO / 80.0);
        dynamicMeshesRef.current.distillFeed.scale.set(fScale, 1.0, fScale);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Build Procedural 3D Models on Process Change
  useEffect(() => {
    const equipGroup = equipGroupRef.current;
    if (!equipGroup) return;

    // Reset reference collections
    dynamicMeshesRef.current = {
      hxTubes: [],
      hxSteamValve: null,
      tankLiquid: null,
      tankStream: null,
      tankDrainValve: null,
      conveyorPkgs: [],
      distillTrays: [],
      distillStreams: [],
      distillFeed: null,
    };

    // Dispose old children
    while (equipGroup.children.length > 0) {
      const child = equipGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      equipGroup.remove(child);
    }

    // Materials Palette
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.6 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      roughness: 0.1,
      depthWrite: false,
    });

    if (processType === 'firstOrder') {
      // =========================================================================
      // OBJECTIVE 2: SHELL & TUBE HEAT EXCHANGER
      // =========================================================================
      // 1. Transparent Outer Shell Cylinder
      const shellGeo = new THREE.CylinderGeometry(1.8, 1.8, 7.6, 32);
      const shell = new THREE.Mesh(shellGeo, glassMat);
      shell.rotation.z = Math.PI / 2;
      shell.renderOrder = 10;
      equipGroup.add(shell);

      // 2. Channel Heads (End Flanges)
      const capGeo = new THREE.SphereGeometry(1.82, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const capL = new THREE.Mesh(capGeo, steelMat);
      capL.rotation.z = -Math.PI / 2;
      capL.position.x = -3.8;
      equipGroup.add(capL);

      const capR = new THREE.Mesh(capGeo, steelMat);
      capR.rotation.z = Math.PI / 2;
      capR.position.x = 3.8;
      equipGroup.add(capR);

      // Flange Rings
      [-3.8, 3.8].forEach((xPos) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.12, 16, 32), steelMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = xPos;
        equipGroup.add(ring);
      });

      // 3. Shell Steam Inlet Nozzle (Top Left) & Condensate Outlet (Bottom Right)
      const nozGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.3, 16);
      const steamInlet = new THREE.Mesh(nozGeo, steelMat);
      steamInlet.position.set(-1.8, 2.3, 0);
      equipGroup.add(steamInlet);

      // Steam Control Valve Body
      const valveGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16);
      const valve = new THREE.Mesh(valveGeo, brassMat);
      valve.position.set(-1.8, 3.1, 0);
      equipGroup.add(valve);
      dynamicMeshesRef.current.hxSteamValve = valve;

      // Steam Actuator Diaphragm
      const actGeo = new THREE.ConeGeometry(0.7, 0.5, 16);
      const actuator = new THREE.Mesh(actGeo, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      actuator.position.set(-1.8, 3.5, 0);
      equipGroup.add(actuator);

      const condOutlet = new THREE.Mesh(nozGeo, steelMat);
      condOutlet.position.set(1.8, -2.3, 0);
      equipGroup.add(condOutlet);

      // Process fluid inlet & outlet pipes (Ends)
      const pipeIn = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 16), steelMat);
      pipeIn.position.set(-4.2, 0, 0);
      pipeIn.rotation.z = Math.PI / 2;
      equipGroup.add(pipeIn);

      const pipeOut = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 16), steelMat);
      pipeOut.position.set(4.2, 0, 0);
      pipeOut.rotation.z = Math.PI / 2;
      equipGroup.add(pipeOut);

      // 4. Internal Tube Bundle (7 Visible Heat Exchange Tubes)
      const tubeGeo = new THREE.CylinderGeometry(0.18, 0.18, 7.65, 16);
      const tubeOffsets = [
        [0, 0], [0, 0.85], [0, -0.85],
        [0.75, 0.42], [0.75, -0.42],
        [-0.75, 0.42], [-0.75, -0.42]
      ];

      tubeOffsets.forEach((pos) => {
        const tubeMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.85,
          roughness: 0.25,
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        tube.rotation.z = Math.PI / 2;
        tube.position.set(0, pos[1], pos[0]);
        equipGroup.add(tube);
        dynamicMeshesRef.current.hxTubes.push(tube);
      });

      // Baffle plates inside shell
      [-1.5, 0, 1.5].forEach((bx, bIdx) => {
        const baffle = new THREE.Mesh(
          new THREE.CylinderGeometry(1.75, 1.75, 0.08, 24, 1, false, bIdx % 2 === 0 ? 0 : Math.PI, Math.PI),
          steelMat
        );
        baffle.rotation.z = Math.PI / 2;
        baffle.position.x = bx;
        equipGroup.add(baffle);
      });

      // Saddle Mounts
      [-2.2, 2.2].forEach((sx) => {
        const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 2.8), darkFrameMat);
        saddle.position.set(sx, -2.3, 0);
        equipGroup.add(saddle);
      });
    }
    else if (processType === 'integrating') {
      // =========================================================================
      // OBJECTIVE 3: INDUSTRIAL LIQUID LEVEL TANK
      // =========================================================================
      // 1. Transparent Outer Cylindrical Silo
      const tankGeo = new THREE.CylinderGeometry(2.4, 2.4, 6.4, 32, 1, true);
      const tank = new THREE.Mesh(tankGeo, glassMat);
      tank.renderOrder = 10;
      equipGroup.add(tank);

      // Top Dome
      const domeGeo = new THREE.SphereGeometry(2.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, steelMat);
      dome.position.y = 3.2;
      equipGroup.add(dome);

      // Bottom Dished Head
      const dishGeo = new THREE.SphereGeometry(2.42, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const dish = new THREE.Mesh(dishGeo, steelMat);
      dish.position.y = -3.2;
      equipGroup.add(dish);

      // Structural Support Legs
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.5, 16), steelMat);
        leg.position.set(Math.cos(angle) * 2.2, -4.0, Math.sin(angle) * 2.2);
        equipGroup.add(leg);
      }

      // 2. Liquid Volume Mesh inside Tank
      const liqGeo = new THREE.CylinderGeometry(2.34, 2.34, 1, 32);
      const liqMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x075985,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const liquid = new THREE.Mesh(liqGeo, liqMat);
      liquid.position.y = -3.2;
      liquid.renderOrder = 1;
      equipGroup.add(liquid);
      dynamicMeshesRef.current.tankLiquid = liquid;

      // 3. Side Sight Gauge Glass with Graduation Rulers (0% to 100%)
      const gaugeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.2, 0.2), darkFrameMat);
      gaugeFrame.position.set(2.52, 0, 0);
      equipGroup.add(gaugeFrame);

      for (let i = 0; i <= 10; i++) {
        const tick = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.05, 0.05),
          new THREE.MeshBasicMaterial({ color: i % 5 === 0 ? 0xffffff : 0x38bdf8 })
        );
        tick.position.set(2.55, -2.9 + i * 0.58, 0.12);
        equipGroup.add(tick);
      }

      // 4. Overhead Inflow Feed Pipe & Control Valve
      const feedPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.2, 16), steelMat);
      feedPipe.position.set(-1.2, 4.3, 0);
      equipGroup.add(feedPipe);

      const fValve = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.35, 16), brassMat);
      fValve.position.set(-1.2, 4.8, 0);
      equipGroup.add(fValve);

      const fAct = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x22c55e }));
      fAct.position.set(-1.2, 5.2, 0);
      equipGroup.add(fAct);

      // Dynamic Inflow Stream
      const streamGeo = new THREE.CylinderGeometry(0.12, 0.14, 5.5, 16);
      const streamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
      const stream = new THREE.Mesh(streamGeo, streamMat);
      stream.position.set(-1.2, 0.6, 0);
      equipGroup.add(stream);
      dynamicMeshesRef.current.tankStream = stream;

      // 5. Bottom Drain Pipe with Load Disturbance Valve
      const drainPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.2, 16), steelMat);
      drainPipe.position.set(1.2, -4.0, 0);
      equipGroup.add(drainPipe);

      const drainValve = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
      drainValve.position.set(1.2, -4.3, 0);
      equipGroup.add(drainValve);
      dynamicMeshesRef.current.tankDrainValve = drainValve;
    }
    else if (processType === 'deadTime') {
      // =========================================================================
      // OBJECTIVE 4: CONVEYOR BELT TRANSPORT DELAY
      // =========================================================================
      // 1. Conveyor Bed Structure
      const bed = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.35, 2.4), darkFrameMat);
      bed.position.y = -0.5;
      equipGroup.add(bed);

      // Support Structural Legs
      [-4.5, 0, 4.5].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.6, 2.2), darkFrameMat);
        leg.position.set(lx, -1.8, 0);
        equipGroup.add(leg);
      });

      // 2. Drive & Tension Pulley Rollers
      const rollerGeo = new THREE.CylinderGeometry(0.55, 0.55, 2.5, 24);
      const r1 = new THREE.Mesh(rollerGeo, steelMat);
      r1.rotation.x = Math.PI / 2;
      r1.position.set(-5.6, -0.5, 0);
      equipGroup.add(r1);

      const r2 = new THREE.Mesh(rollerGeo, steelMat);
      r2.rotation.x = Math.PI / 2;
      r2.position.set(5.6, -0.5, 0);
      equipGroup.add(r2);

      // Belt surface
      const beltGeo = new THREE.BoxGeometry(11.2, 0.05, 2.3);
      const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
      const belt = new THREE.Mesh(beltGeo, beltMat);
      belt.position.y = -0.3;
      equipGroup.add(belt);

      // 3. Drive Motor on Head End
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 16), steelMat);
      motor.rotation.x = Math.PI / 2;
      motor.position.set(-5.6, -0.5, 1.6);
      equipGroup.add(motor);

      // 4. Laser Optical Sensor Gate at x = 3.8 (Dead Time Measurement Point)
      const archGeo = new THREE.TorusGeometry(1.6, 0.08, 16, 24, Math.PI);
      const arch = new THREE.Mesh(archGeo, new THREE.MeshStandardMaterial({ color: 0x475569 }));
      arch.position.set(3.8, -0.3, 0);
      equipGroup.add(arch);

      // Glowing Green Sensor Beam
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.3, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.rotation.x = Math.PI / 2;
      beam.position.set(3.8, 0.6, 0);
      equipGroup.add(beam);

      // Sensor Housing Indicator Box
      const sensorBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d }));
      sensorBox.position.set(3.8, 1.4, 0);
      equipGroup.add(sensorBox);

      // 5. Material Packets moving along the conveyor
      const pkgGeo = new THREE.BoxGeometry(1.0, 0.8, 1.0);
      for (let i = 0; i < 5; i++) {
        const pkgMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0x334155,
          emissiveIntensity: 0.9,
          roughness: 0.4,
        });
        const pkg = new THREE.Mesh(pkgGeo, pkgMat);
        pkg.position.y = 0.15;
        equipGroup.add(pkg);
        dynamicMeshesRef.current.conveyorPkgs.push(pkg);
      }
    }
    else if (processType === 'multiCapacity') {
      // =========================================================================
      // OBJECTIVE 5: 4-STAGE DISTILLATION TOWER
      // =========================================================================
      // 1. Tall Column Outer Shell
      const colGeo = new THREE.CylinderGeometry(1.8, 1.8, 8.4, 32, 1, true);
      const col = new THREE.Mesh(colGeo, glassMat);
      col.renderOrder = 10;
      equipGroup.add(col);

      // Top and Bottom Heads
      const topHead = new THREE.Mesh(new THREE.SphereGeometry(1.82, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), steelMat);
      topHead.position.y = 4.2;
      equipGroup.add(topHead);

      const botHead = new THREE.Mesh(new THREE.SphereGeometry(1.82, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), steelMat);
      botHead.position.y = -4.2;
      equipGroup.add(botHead);

      // Column Support Skirt
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 2.1, 1.8, 32), darkFrameMat);
      skirt.position.y = -4.9;
      equipGroup.add(skirt);

      // Overhead Reflux Inlet Pipe (at top feeding into Tray 1)
      const refluxPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.6, 16), steelMat);
      refluxPipe.position.set(-1.0, 4.4, 0);
      equipGroup.add(refluxPipe);

      const refluxStreamGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.1, 16);
      const streamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, depthWrite: false });
      const refluxStream = new THREE.Mesh(refluxStreamGeo, streamMat);
      refluxStream.position.set(-1.0, 3.4, 0);
      refluxStream.renderOrder = 2;
      equipGroup.add(refluxStream);
      dynamicMeshesRef.current.distillFeed = refluxStream;

      // 2. 4 Distillation Trays with Perforated Plates and Dynamic Liquid Levels
      // Top-to-bottom layout: Tray 1 (y=2.9), Tray 2 (y=1.0), Tray 3 (y=-0.9), Tray 4 (y=-2.8)
      const trayYs = [2.9, 1.0, -0.9, -2.8];

      for (let i = 0; i < 4; i++) {
        const trayY = trayYs[i];

        // Tray metal plate
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.76, 1.76, 0.1, 32), steelMat);
        plate.position.y = trayY;
        equipGroup.add(plate);

        // Downcomer pipe connecting to next lower tray
        if (i < 3) {
          const nextY = trayYs[i + 1];
          const dcX = i % 2 === 0 ? 1.2 : -1.2;
          const pipeHeight = trayY - nextY;
          const downcomer = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, pipeHeight, 16), steelMat);
          downcomer.position.set(dcX, (trayY + nextY) / 2.0, 0);
          equipGroup.add(downcomer);

          // Liquid stream flowing through downcomer
          const dcStream = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, pipeHeight * 0.95, 16), streamMat);
          dcStream.position.set(dcX, (trayY + nextY) / 2.0, 0);
          dcStream.renderOrder = 2;
          equipGroup.add(dcStream);
          dynamicMeshesRef.current.distillStreams.push(dcStream);
        }

        // Bubble caps on tray
        [-0.7, 0, 0.7].forEach((bx) => {
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 12), brassMat);
          cap.position.set(bx, trayY + 0.15, 0.4);
          equipGroup.add(cap);
        });

        // Dynamic Froth / Liquid Pool for this tray level
        const frothMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.85,
          transparent: true,
          opacity: 0.88,
          roughness: 0.2,
          depthWrite: false,
        });
        const froth = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.35, 32), frothMat);
        froth.position.y = trayY + 0.2;
        froth.renderOrder = 1;
        equipGroup.add(froth);
        dynamicMeshesRef.current.distillTrays.push(froth);

        // Flange ring outside tray
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.08, 12, 32), steelMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = trayY;
        equipGroup.add(ring);
      }

      // Overhead vapor nozzle & reboiler return nozzle
      const vNoz = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.4, 16), steelMat);
      vNoz.position.set(0, 5.0, 0);
      equipGroup.add(vNoz);

      const rNoz = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 16), steelMat);
      rNoz.rotation.z = Math.PI / 2;
      rNoz.position.set(-2.2, -3.2, 0);
      equipGroup.add(rNoz);
    }
  }, [processType]);

  // Mouse & Touch Orbit Event Listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    autoRotateRef.current = false;
    if (e.button === 0) {
      isDraggingRef.current = true;
    } else if (e.button === 2) {
      isPanningRef.current = true;
    }
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current && !isPanningRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;

    if (isDraggingRef.current) {
      rotTargetRef.current.y += dx * 0.007;
      rotTargetRef.current.x = Math.max(-0.6, Math.min(0.8, rotTargetRef.current.x + dy * 0.007));
    } else if (isPanningRef.current) {
      panTargetRef.current.x += dx * 0.01;
      panTargetRef.current.y -= dy * 0.01;
    }

    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    autoRotateRef.current = false;
    zoomTargetRef.current = Math.max(7, Math.min(24, zoomTargetRef.current + e.deltaY * 0.012));
  };

  // Preset Views
  const resetCamera = () => {
    rotTargetRef.current = { x: 0.15, y: -0.4 };
    panTargetRef.current = { x: 0, y: 0 };
    zoomTargetRef.current = 14;
    autoRotateRef.current = false;
  };

  const toggleAutoRotate = () => {
    autoRotateRef.current = !autoRotateRef.current;
  };

  const zoomIn = () => {
    zoomTargetRef.current = Math.max(7, zoomTargetRef.current - 2);
  };

  const zoomOut = () => {
    zoomTargetRef.current = Math.min(24, zoomTargetRef.current + 2);
  };

  return (
    <div
      ref={mountRef}
      id="three-viewport-container"
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D Viewport Controls Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/60 shadow-lg text-xs text-slate-300">
        <button
          id="btn-zoom-in"
          onClick={zoomIn}
          title="Zoom In"
          className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <ZoomIn size={15} />
        </button>
        <button
          id="btn-zoom-out"
          onClick={zoomOut}
          title="Zoom Out"
          className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <ZoomOut size={15} />
        </button>
        <button
          id="btn-reset-view"
          onClick={resetCamera}
          title="Reset Camera View"
          className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <Compass size={15} />
        </button>
        <button
          id="btn-auto-rotate"
          onClick={toggleAutoRotate}
          title="Toggle Auto-Rotation"
          className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
        >
          <RotateCw size={15} />
        </button>
      </div>

      {/* Orbit Tip Overlay */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none text-[10px] text-slate-400 bg-slate-950/70 backdrop-blur-sm px-2 py-1 rounded border border-slate-800">
        Left-drag: Orbit | Right-drag: Pan | Scroll: Zoom
      </div>

      {/* Dynamic Equipment Status Overlay Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg">
        <div className="flex items-center gap-1.5">
          <Eye size={14} className="text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
            {processType === 'firstOrder' && 'Objective 2: Shell & Tube Heat Exchanger'}
            {processType === 'integrating' && 'Objective 3: Industrial Level Tank'}
            {processType === 'deadTime' && 'Objective 4: Conveyor Belt Weighing System'}
            {processType === 'multiCapacity' && 'Objective 5: 4-Stage Distillation Tower'}
          </span>
        </div>
      </div>

      {/* 4-Stage Distillation Column Levels Overlay */}
      {processType === 'multiCapacity' && (
        <div className="absolute top-14 left-3 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-purple-800/60 shadow-xl w-60 text-xs font-mono">
          <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-purple-900/60 text-purple-300 font-sans font-bold text-[11px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Layers size={13} className="text-purple-400" />
              <span>Distillation (4 Levels)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-normal">Top &darr; Btm</span>
          </div>

          <div className="space-y-1.5">
            {[
              { name: 'Tray 1 (Top / Reflux)', val: loopState.trayStates[0], color: 'bg-emerald-400' },
              { name: 'Tray 2 (Stage 2)', val: loopState.trayStates[1], color: 'bg-cyan-400' },
              { name: 'Tray 3 (Stage 3)', val: loopState.trayStates[2], color: 'bg-sky-400' },
              { name: 'Tray 4 (Bottoms / PV)', val: loopState.trayStates[3], color: 'bg-amber-400' },
            ].map((tray, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-300 font-sans">{tray.name}</span>
                  <span className="font-bold text-slate-100">{tray.val.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${tray.color} transition-all duration-75`}
                    style={{ width: `${Math.max(0, Math.min(100, tray.val))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback if WebGL completely unavailable */}
      {!webglSupported && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-6 text-center">
          <p className="text-amber-400 font-bold mb-2">Hardware WebGL Not Available</p>
          <p className="text-xs text-slate-400 max-w-md">
            Simulation physics, loop calculations, and the real-time strip chart continue to run with full precision.
          </p>
        </div>
      )}
    </div>
  );
};

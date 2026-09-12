'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ToothRecordItem, ToothCondition } from './ToothChart';
import {
  RotateCw,
  Eye,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Layers,
  Activity,
  Compass,
} from 'lucide-react';

interface DentalArch3DProps {
  records: Record<string, ToothRecordItem>;
  selectedTooth: string | null;
  onSelectTooth: (toothNumber: string) => void;
}

interface ToothAnchor {
  fdi: string;
  name: string;
  isUpper: boolean;
  x: number;
  y: number;
  z: number;
}

// FDI permanent teeth precise anatomical coordinates aligned with human_teeth.glb crowns
const TOOTH_ANCHORS: ToothAnchor[] = [
  // --- Right Quadrant 1 (18 -> 11) ---
  { fdi: '18', name: 'Upper Right 3rd Molar (Wisdom)', isUpper: true, x: -4.85, y: 0.35, z: -3.85 },
  { fdi: '17', name: 'Upper Right 2nd Molar', isUpper: true, x: -4.55, y: 0.30, z: -1.75 },
  { fdi: '16', name: 'Upper Right 1st Molar', isUpper: true, x: -4.15, y: 0.25, z: 0.45 },
  { fdi: '15', name: 'Upper Right 2nd Premolar', isUpper: true, x: -3.65, y: 0.20, z: 1.90 },
  { fdi: '14', name: 'Upper Right 1st Premolar', isUpper: true, x: -2.95, y: 0.15, z: 3.10 },
  { fdi: '13', name: 'Upper Right Canine', isUpper: true, x: -2.15, y: 0.10, z: 4.10 },
  { fdi: '12', name: 'Upper Right Lateral Incisor', isUpper: true, x: -1.20, y: 0.05, z: 4.65 },
  { fdi: '11', name: 'Upper Right Central Incisor', isUpper: true, x: -0.42, y: 0.02, z: 4.85 },

  // --- Left Quadrant 2 (21 -> 28) ---
  { fdi: '21', name: 'Upper Left Central Incisor', isUpper: true, x: 0.42, y: 0.02, z: 4.85 },
  { fdi: '22', name: 'Upper Left Lateral Incisor', isUpper: true, x: 1.20, y: 0.05, z: 4.65 },
  { fdi: '23', name: 'Upper Left Canine', isUpper: true, x: 2.15, y: 0.10, z: 4.10 },
  { fdi: '24', name: 'Upper Left 1st Premolar', isUpper: true, x: 2.95, y: 0.15, z: 3.10 },
  { fdi: '25', name: 'Upper Left 2nd Premolar', isUpper: true, x: 3.65, y: 0.20, z: 1.90 },
  { fdi: '26', name: 'Upper Left 1st Molar', isUpper: true, x: 4.15, y: 0.25, z: 0.45 },
  { fdi: '27', name: 'Upper Left 2nd Molar', isUpper: true, x: 4.55, y: 0.30, z: -1.75 },
  { fdi: '28', name: 'Upper Left 3rd Molar (Wisdom)', isUpper: true, x: 4.85, y: 0.35, z: -3.85 },
];

// Module-level in-memory cache for the 6.88MB realistic dental scan
let cachedRawGLTFScene: THREE.Group | null = null;
let gltfPromise: Promise<THREE.Group> | null = null;

function loadFullDentitionModel(): Promise<THREE.Group> {
  if (cachedRawGLTFScene) {
    return Promise.resolve(cachedRawGLTFScene);
  }
  if (gltfPromise) {
    return gltfPromise;
  }
  gltfPromise = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      '/human_teeth.glb',
      (gltf) => {
        cachedRawGLTFScene = gltf.scene;
        resolve(gltf.scene);
      },
      undefined,
      reject
    );
  });
  return gltfPromise;
}

export default function DentalArch3D({
  records,
  selectedTooth,
  onSelectTooth,
}: DentalArch3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const colliderMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const indicatorMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  const controlsRef = useRef<{ isDragging: boolean; prevX: number; prevY: number }>({
    isDragging: false,
    prevX: 0,
    prevY: 0,
  });

  // Demand-driven rendering: only render when scene is dirty (orbit, zoom, record changes, hover)
  const needsRenderRef = useRef<boolean>(true);
  const requestRender = () => {
    needsRenderRef.current = true;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = 520;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // 2. Camera setup facing anterior dentition
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 17.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer with modern PCFShadowMap (no deprecation warning)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Clinical Dental Operatory Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    // Soft sky reflection & floor bounce
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdbeafe, 1.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Main operatory key light with soft shadows
    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainKeyLight.position.set(6, 12, 14);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    mainKeyLight.shadow.bias = -0.0001;
    scene.add(mainKeyLight);

    // Lateral fill lights
    const fillLight1 = new THREE.DirectionalLight(0xe0f2fe, 1.4);
    fillLight1.position.set(-8, 4, 10);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xfff7ed, 1.2);
    fillLight2.position.set(8, -2, 10);
    scene.add(fillLight2);

    // Posterior rim light to delineate cusp anatomy
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.1);
    rimLight.position.set(0, 10, -12);
    scene.add(rimLight);

    // 5. Root Group
    const rootGroup = new THREE.Group();
    // Default anterior smile presentation angle
    rootGroup.rotation.x = -Math.PI * 0.08;
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    // 6. Setup Interactive Markers & Colliders
    const markersGroup = new THREE.Group();
    rootGroup.add(markersGroup);
    markerGroupRef.current = markersGroup;

    const collidersMap = new Map<string, THREE.Mesh>();
    const indicatorsMap = new Map<string, THREE.Group>();

    TOOTH_ANCHORS.forEach((anchor) => {
      // Invisible hit-box collider
      const colliderGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.9, 12);
      colliderGeo.rotateX(Math.PI / 2);
      const colliderMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const colliderMesh = new THREE.Mesh(colliderGeo, colliderMat);
      colliderMesh.position.set(anchor.x, anchor.y, anchor.z);
      colliderMesh.userData = { fdi: anchor.fdi, name: anchor.name, isUpper: anchor.isUpper };
      colliderMesh.name = `collider_${anchor.fdi}`;
      markersGroup.add(colliderMesh);
      collidersMap.set(anchor.fdi, colliderMesh);

      // Clinical Surgical Indicator Ring
      const indicatorGroup = new THREE.Group();
      indicatorGroup.position.set(anchor.x, anchor.y, anchor.z);
      // Orient normal towards buccal surface curvature
      indicatorGroup.rotation.y = Math.atan2(anchor.x, anchor.z) * 0.7;
      indicatorGroup.userData = { fdi: anchor.fdi, isUpper: anchor.isUpper };

      const ringGeo = new THREE.RingGeometry(0.18, 0.28, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.name = 'ringMesh';
      indicatorGroup.add(ringMesh);

      const dotGeo = new THREE.CircleGeometry(0.09, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.name = 'dotMesh';
      indicatorGroup.add(dotMesh);

      markersGroup.add(indicatorGroup);
      indicatorsMap.set(anchor.fdi, indicatorGroup);
    });

    colliderMeshesRef.current = collidersMap;
    indicatorMeshesRef.current = indicatorsMap;

    // 7. Load Photorealistic 3D Human Teeth Model (with in-memory cache)
    let isMounted = true;
    loadFullDentitionModel()
      .then((rawModel) => {
        if (!isMounted) return;

        // Clean up previous model if any to prevent duplicates
        if (modelRef.current && rootGroup.children.includes(modelRef.current)) {
          rootGroup.remove(modelRef.current);
        }

        // Compute bounding box and center model
        const box = new THREE.Box3().setFromObject(rawModel);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Normalize scale to match ~11 units viewport arch width
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 11.2 / maxDim;

        // Create Full Dentition Model
        const model = rawModel.clone(true);
        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        model.scale.set(scale, scale, scale);

        // Enhance materials with biological PBR properties (wet enamel clearcoat + realistic gingiva)
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const oldMat = mesh.material as THREE.MeshStandardMaterial;
              const isTeeth = mesh.name.toLowerCase().includes('teeth');
              mesh.material = new THREE.MeshPhysicalMaterial({
                map: oldMat.map || null,
                normalMap: oldMat.normalMap || null,
                roughness: isTeeth ? 0.16 : 0.40,
                metalness: 0.01,
                clearcoat: isTeeth ? 0.90 : 0.35,
                clearcoatRoughness: 0.08,
                reflectivity: 0.82,
                transmission: isTeeth ? 0.04 : 0.0,
                ior: 1.54, // biological tooth enamel index of refraction
                side: THREE.DoubleSide,
              });
            }
          }
        });

        const modelContainer = new THREE.Group();
        modelContainer.add(model);
        modelContainer.position.set(0, 0, 0);
        rootGroup.add(modelContainer);
        modelRef.current = modelContainer;

        setLoadingModel(false);
        requestRender();
      })
      .catch((err) => {
        console.warn('Failed to load human_teeth.glb, falling back to jaw.obj:', err);
        const objLoader = new OBJLoader();
        objLoader.load('/models/jaw.obj', (obj) => {
          if (!isMounted) return;
          const rawMesh = obj.children[0] as THREE.Mesh;
          if (rawMesh && rawMesh.geometry) {
            const geo = rawMesh.geometry.clone();
            geo.center();
            geo.scale(0.021, 0.021, 0.021);
            geo.computeVertexNormals();

            const mat = new THREE.MeshPhysicalMaterial({
              color: 0xfcfbf8,
              roughness: 0.22,
              clearcoat: 0.85,
              side: THREE.DoubleSide,
            });
            const fallbackMesh = new THREE.Mesh(geo, mat);
            rootGroup.add(fallbackMesh);
          }
          setLoadingModel(false);
          requestRender();
        });
      });

    // 8. Mouse Orbit Controls
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
      requestRender();
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (controlsRef.current.isDragging && rootGroupRef.current) {
        const deltaX = e.clientX - controlsRef.current.prevX;
        const deltaY = e.clientY - controlsRef.current.prevY;
        rootGroupRef.current.rotation.y += deltaX * 0.008;
        rootGroupRef.current.rotation.x += deltaY * 0.008;
        controlsRef.current.prevX = e.clientX;
        controlsRef.current.prevY = e.clientY;
        requestRender();
      }

      // Hover Raycasting
      raycaster.setFromCamera(mouse, camera);
      const colliders = Array.from(colliderMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(colliders, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.fdi) {
          setHoveredTooth(hit.userData.fdi);
          setHoveredName(hit.userData.name);
          renderer.domElement.style.cursor = 'pointer';
          requestRender();
        }
      } else {
        setHoveredTooth(null);
        setHoveredName(null);
        renderer.domElement.style.cursor = controlsRef.current.isDragging ? 'grabbing' : 'grab';
      }
    };

    const onPointerUp = () => {
      controlsRef.current.isDragging = false;
      renderer.domElement.style.cursor = 'grab';
      requestRender();
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const colliders = Array.from(colliderMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(colliders, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.fdi) {
          onSelectTooth(hit.userData.fdi);
          requestRender();
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(10, Math.min(28, cameraRef.current.position.z + e.deltaY * 0.01));
      requestRender();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('click', onClick);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    // 9. Demand-Driven Animation Loop: Only renders when dirty or auto-rotating
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate && rootGroupRef.current) {
        rootGroupRef.current.rotation.y += 0.005;
        needsRenderRef.current = true;
      }
      if (needsRenderRef.current || controlsRef.current.isDragging) {
        renderer.render(scene, camera);
        needsRenderRef.current = false;
      }
    };
    animate();

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const newW = container.clientWidth;
      cameraRef.current.aspect = newW / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, height);
      requestRender();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('click', onClick);
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();

      // Cleanly dispose Three.js scene meshes and materials to free GPU RAM
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });

      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, []);

  // Update Indicator Badges based on clinical records, selection, and hover
  useEffect(() => {
    indicatorMeshesRef.current.forEach((group, fdi) => {
      const isSelected = selectedTooth === fdi;
      const isHovered = hoveredTooth === fdi;
      const record = records[fdi];
      const condition = record?.condition || 'healthy';

      const ring = group.getObjectByName('ringMesh') as THREE.Mesh;
      const dot = group.getObjectByName('dotMesh') as THREE.Mesh;

      if (!ring || !dot) return;

      const ringMat = ring.material as THREE.MeshBasicMaterial;
      const dotMat = dot.material as THREE.MeshBasicMaterial;

      let hexColor = 0x94a3b8;
      let opacity = 0.35;
      let scale = 1.0;

      if (condition === 'caries') {
        hexColor = 0xd97706; // Amber
        opacity = 0.90;
        scale = 1.15;
      } else if (condition === 'filling') {
        hexColor = 0x0284c7; // Blue
        opacity = 0.85;
      } else if (condition === 'crown') {
        hexColor = 0x7c3aed; // Violet
        opacity = 0.90;
      } else if (condition === 'missing') {
        hexColor = 0x64748b;
        opacity = 0.40;
      } else if (condition === 'healthy') {
        hexColor = 0x10b981; // Emerald
        opacity = 0.30;
      }

      if (isHovered) {
        scale = 1.45;
        opacity = 1.0;
        hexColor = 0x0284c7;
      }

      if (isSelected) {
        scale = 1.7;
        opacity = 1.0;
        hexColor = 0x0f172a;
      }

      ringMat.color.setHex(hexColor);
      ringMat.opacity = opacity;
      dotMat.color.setHex(hexColor);
      dotMat.opacity = isSelected ? 1.0 : opacity * 0.8;
      group.scale.set(scale, scale, scale);
    });
    requestRender();
  }, [records, selectedTooth, hoveredTooth]);

  // Toggle diagnostic markers visibility
  useEffect(() => {
    if (markerGroupRef.current) {
      markerGroupRef.current.children.forEach((child) => {
        if (child.name.startsWith('collider_')) {
          child.visible = true; // Always retain hit-boxes for raycasting
        } else {
          child.visible = showMarkers;
        }
      });
      requestRender();
    }
  }, [showMarkers]);

  // Reset to default Full Dentition 3D Perspective
  const resetView = () => {
    if (!cameraRef.current || !rootGroupRef.current) return;
    cameraRef.current.position.set(0, 1.2, 16.5);
    cameraRef.current.lookAt(0, -0.2, 0);
    rootGroupRef.current.rotation.set(-Math.PI * 0.10, 0, 0);
    requestRender();
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const delta = direction === 'in' ? -2.0 : 2.0;
    cameraRef.current.position.z = Math.max(10, Math.min(28, cameraRef.current.position.z + delta));
    requestRender();
  };

  const activeToothNumber = hoveredTooth || selectedTooth;
  const activeRecord = activeToothNumber ? records[activeToothNumber] : null;

  return (
    <div
      className="panel-card"
      style={{
        position: 'relative',
        padding: '1.25rem',
        overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
      }}
    >
      {/* 3D Header & Control Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
              }}
            >
              REALISTIC 3D DENTITION
            </span>
            <h3 className="panel-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
              Full Dentition 3D Anatomical Model
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Photorealistic PBR dental scan • Vita A2 pearlescent enamel & clinical gingiva • Drag to orbit 360° • Click any tooth
          </p>
        </div>

        {/* Full Dentition Interactive Controls */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={resetView}
            style={{ fontWeight: 700, borderColor: '#0284c7', color: '#0284c7' }}
            title="Reset to Full Dentition View"
          >
            Full Dentition
          </button>

          <div style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 4px' }} />

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMarkers(!showMarkers)}
            style={{ color: showMarkers ? '#0284c7' : '#64748b' }}
            title={showMarkers ? 'Hide Diagnostic Markers' : 'Show Diagnostic Markers'}
          >
            <Layers size={14} />
            <span>{showMarkers ? 'Markers On' : 'Anatomical'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleZoom('in')}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleZoom('out')}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setAutoRotate(!autoRotate)}
            style={{ color: autoRotate ? '#0284c7' : '#64748b' }}
            title="Auto-Rotate 3D Dentition"
          >
            <RotateCw size={14} className={autoRotate ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        style={{
          width: '100%',
          height: '520px',
          background: 'radial-gradient(ellipse at center, #ffffff 0%, #f1f5f9 100%)',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

        {/* Loading Spinner */}
        {loadingModel && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.88)',
              zIndex: 30,
              gap: '0.75rem',
            }}
          >
            <Activity size={28} className="animate-spin" color="#0284c7" />
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              Loading Realistic 3D Human Dentition...
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Rendering anatomical PBR enamel, normal maps & clinical gingiva
            </div>
          </div>
        )}

        {/* 3D HUD Information Badge */}
        {activeToothNumber && (
          <div
            style={{
              position: 'absolute',
              bottom: '1.25rem',
              left: '1.25rem',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 20,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background:
                  activeRecord?.condition === 'caries'
                    ? '#d97706'
                    : activeRecord?.condition === 'filling'
                    ? '#0284c7'
                    : activeRecord?.condition === 'crown'
                    ? '#7c3aed'
                    : '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '15px',
              }}
            >
              {activeToothNumber}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                {hoveredName || `Tooth #${activeToothNumber}`}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>Status: <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>{activeRecord?.condition || 'Healthy'}</strong></span>
                {activeRecord?.surfaces && activeRecord.surfaces.length > 0 && (
                  <span>• Surfaces: {activeRecord.surfaces.join(', ')}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onSelectTooth(activeToothNumber)}
              style={{ marginLeft: '8px', fontSize: '11px', padding: '4px 10px' }}
            >
              Diagnose / Edit
            </button>
          </div>
        )}

        {/* 3D Orbit Helper Hint */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #e2e8f0',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            pointerEvents: 'none',
          }}
        >
          <Compass size={13} color="#0284c7" />
          Click & drag to orbit • Scroll to zoom
        </div>
      </div>
    </div>
  );
}

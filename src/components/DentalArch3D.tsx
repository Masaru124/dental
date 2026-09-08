'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { ToothRecordItem, ToothCondition } from './ToothChart';
import {
  RotateCw,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Check,
  AlertTriangle,
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

// 32 FDI permanent teeth precise anatomical coordinates mapped on the 3D dental scan
const TOOTH_ANCHORS: ToothAnchor[] = [
  // --- Upper Arch (Maxilla) Quadrant 1 (Right: 18 -> 11) ---
  { fdi: '18', name: 'Upper Right 3rd Molar', isUpper: true, x: -4.3, y: -0.6, z: 1.25 },
  { fdi: '17', name: 'Upper Right 2nd Molar', isUpper: true, x: -4.1, y: 0.4, z: 1.55 },
  { fdi: '16', name: 'Upper Right 1st Molar', isUpper: true, x: -3.7, y: 1.4, z: 1.85 },
  { fdi: '15', name: 'Upper Right 2nd Premolar', isUpper: true, x: -3.2, y: 2.3, z: 2.05 },
  { fdi: '14', name: 'Upper Right 1st Premolar', isUpper: true, x: -2.7, y: 3.0, z: 2.25 },
  { fdi: '13', name: 'Upper Right Canine', isUpper: true, x: -1.9, y: 3.6, z: 2.45 },
  { fdi: '12', name: 'Upper Right Lateral Incisor', isUpper: true, x: -1.0, y: 4.0, z: 2.65 },
  { fdi: '11', name: 'Upper Right Central Incisor', isUpper: true, x: -0.35, y: 4.15, z: 2.75 },

  // --- Upper Arch (Maxilla) Quadrant 2 (Left: 21 -> 28) ---
  { fdi: '21', name: 'Upper Left Central Incisor', isUpper: true, x: 0.35, y: 4.15, z: 2.75 },
  { fdi: '22', name: 'Upper Left Lateral Incisor', isUpper: true, x: 1.0, y: 4.0, z: 2.65 },
  { fdi: '23', name: 'Upper Left Canine', isUpper: true, x: 1.9, y: 3.6, z: 2.45 },
  { fdi: '24', name: 'Upper Left 1st Premolar', isUpper: true, x: 2.7, y: 3.0, z: 2.25 },
  { fdi: '25', name: 'Upper Left 2nd Premolar', isUpper: true, x: 3.2, y: 2.3, z: 2.05 },
  { fdi: '26', name: 'Upper Left 1st Molar', isUpper: true, x: 3.7, y: 1.4, z: 1.85 },
  { fdi: '27', name: 'Upper Left 2nd Molar', isUpper: true, x: 4.1, y: 0.4, z: 1.55 },
  { fdi: '28', name: 'Upper Left 3rd Molar', isUpper: true, x: 4.3, y: -0.6, z: 1.25 },

  // --- Lower Arch (Mandible) Quadrant 4 (Right: 48 -> 41) ---
  { fdi: '48', name: 'Lower Right 3rd Molar', isUpper: false, x: -4.0, y: -0.6, z: -1.25 },
  { fdi: '47', name: 'Lower Right 2nd Molar', isUpper: false, x: -3.8, y: 0.4, z: -1.55 },
  { fdi: '46', name: 'Lower Right 1st Molar', isUpper: false, x: -3.4, y: 1.3, z: -1.85 },
  { fdi: '45', name: 'Lower Right 2nd Premolar', isUpper: false, x: -2.9, y: 2.1, z: -2.05 },
  { fdi: '44', name: 'Lower Right 1st Premolar', isUpper: false, x: -2.4, y: 2.8, z: -2.25 },
  { fdi: '43', name: 'Lower Right Canine', isUpper: false, x: -1.7, y: 3.3, z: -2.45 },
  { fdi: '42', name: 'Lower Right Lateral Incisor', isUpper: false, x: -0.9, y: 3.7, z: -2.60 },
  { fdi: '41', name: 'Lower Right Central Incisor', isUpper: false, x: -0.3, y: 3.85, z: -2.70 },

  // --- Lower Arch (Mandible) Quadrant 3 (Left: 31 -> 38) ---
  { fdi: '31', name: 'Lower Left Central Incisor', isUpper: false, x: 0.3, y: 3.85, z: -2.70 },
  { fdi: '32', name: 'Lower Left Lateral Incisor', isUpper: false, x: 0.9, y: 3.7, z: -2.60 },
  { fdi: '33', name: 'Lower Left Canine', isUpper: false, x: 1.7, y: 3.3, z: -2.45 },
  { fdi: '34', name: 'Lower Left 1st Premolar', isUpper: false, x: 2.4, y: 2.8, z: -2.25 },
  { fdi: '35', name: 'Lower Left 2nd Premolar', isUpper: false, x: 2.9, y: 2.1, z: -2.05 },
  { fdi: '36', name: 'Lower Left 1st Molar', isUpper: false, x: 3.4, y: 1.3, z: -1.85 },
  { fdi: '37', name: 'Lower Left 2nd Molar', isUpper: false, x: 3.8, y: 0.4, z: -1.55 },
  { fdi: '38', name: 'Lower Left 3rd Molar', isUpper: false, x: 4.0, y: -0.6, z: -1.25 },
];

let cachedScanGeometry: THREE.BufferGeometry | null = null;

export default function DentalArch3D({
  records,
  selectedTooth,
  onSelectTooth,
}: DentalArch3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadingModel, setLoadingModel] = useState(!cachedScanGeometry);
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [viewPreset, setViewPreset] = useState<'both' | 'anterior' | 'upper' | 'lower'>('both');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const upperArchMeshRef = useRef<THREE.Mesh | null>(null);
  const lowerArchMeshRef = useRef<THREE.Mesh | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const colliderMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const indicatorMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  const controlsRef = useRef<{ isDragging: boolean; prevX: number; prevY: number }>({
    isDragging: false,
    prevX: 0,
    prevY: 0,
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = 520;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // 2. Camera setup facing the dentition
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 15.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Clinical Dental Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.7);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    mainKeyLight.position.set(5, 10, 12);
    mainKeyLight.castShadow = true;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.5);
    fillLight.position.set(-6, -4, 8);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffedd5, 1.1);
    rimLight.position.set(0, 8, -6);
    scene.add(rimLight);

    // 5. Root Group
    const rootGroup = new THREE.Group();
    // Clinical default tilt: anterior smile presentation facing camera
    rootGroup.rotation.x = -Math.PI * 0.40;
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    // 6. Function to build the complete dual-arch intraoral dental model
    const setupDualDentalArches = (baseGeometry: THREE.BufferGeometry) => {
      // Premium Clinical Enamel Material (Vita A1/A2 shade with clearcoat specular sheen)
      const enamelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xfcfbf8,
        roughness: 0.18,
        metalness: 0.02,
        clearcoat: 0.92,
        clearcoatRoughness: 0.10,
        reflectivity: 0.70,
      });

      // Upper Arch (Maxilla)
      const upperMesh = new THREE.Mesh(baseGeometry, enamelMaterial);
      upperMesh.castShadow = true;
      upperMesh.receiveShadow = true;
      upperMesh.position.set(0, 0, 0.4);
      rootGroup.add(upperMesh);
      upperArchMeshRef.current = upperMesh;

      // Lower Arch (Mandible)
      // Cloned from scan, inverted along Z and scaled to match human dental occlusion
      const lowerGeometry = baseGeometry.clone();
      lowerGeometry.scale(0.95, 0.95, -0.95);
      lowerGeometry.computeVertexNormals();

      const lowerMesh = new THREE.Mesh(lowerGeometry, enamelMaterial.clone());
      lowerMesh.castShadow = true;
      lowerMesh.receiveShadow = true;
      // Slight vertical separation for clinical occlusal clearance
      lowerMesh.position.set(0, -0.2, -0.4);
      rootGroup.add(lowerMesh);
      lowerArchMeshRef.current = lowerMesh;

      // 7. Interactive Markers & Hit-Box Colliders
      const markersGroup = new THREE.Group();
      rootGroup.add(markersGroup);
      markerGroupRef.current = markersGroup;

      const collidersMap = new Map<string, THREE.Mesh>();
      const indicatorsMap = new Map<string, THREE.Group>();

      TOOTH_ANCHORS.forEach((anchor) => {
        // A) Invisible Hit-Box Collider for accurate click/hover raycasting
        const colliderGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.9, 12);
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

        // B) Elegant Clinical Surgical Ring Indicator
        const indicatorGroup = new THREE.Group();
        indicatorGroup.position.set(anchor.x, anchor.y, anchor.z);

        // Holographic Target Ring
        const ringGeo = new THREE.RingGeometry(0.28, 0.38, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x0284c7,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.name = 'ringMesh';
        indicatorGroup.add(ringMesh);

        // Center clinical dot
        const dotGeo = new THREE.CircleGeometry(0.14, 16);
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
      setLoadingModel(false);
    };

    // Load Scan Geometry
    if (cachedScanGeometry) {
      setupDualDentalArches(cachedScanGeometry);
    } else {
      const loader = new OBJLoader();
      loader.load(
        '/models/jaw.obj',
        (obj) => {
          const rawMesh = obj.children[0] as THREE.Mesh;
          if (rawMesh && rawMesh.geometry) {
            const geo = rawMesh.geometry.clone();
            geo.center();
            geo.scale(0.021, 0.021, 0.021);
            geo.computeVertexNormals();

            cachedScanGeometry = geo;
            setupDualDentalArches(geo);
          }
        },
        undefined,
        (err) => {
          console.error('Failed to load real jaw scan:', err);
          setLoadingModel(false);
        }
      );
    }

    // 8. Interactive Mouse Drag & Orbit Controls
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Smooth Orbit Rotation
      if (controlsRef.current.isDragging && rootGroupRef.current) {
        const deltaX = e.clientX - controlsRef.current.prevX;
        const deltaY = e.clientY - controlsRef.current.prevY;
        rootGroupRef.current.rotation.y += deltaX * 0.007;
        rootGroupRef.current.rotation.x = Math.max(-1.4, Math.min(0.8, rootGroupRef.current.rotation.x + deltaY * 0.007));
        controlsRef.current.prevX = e.clientX;
        controlsRef.current.prevY = e.clientY;
      }

      // Raycast against tooth colliders
      raycaster.setFromCamera(mouse, camera);
      const colliders = Array.from(colliderMeshesRef.current.values());
      const intersects = raycaster.intersectObjects(colliders, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit.userData?.fdi) {
          setHoveredTooth(hit.userData.fdi);
          setHoveredName(hit.userData.name);
          container.style.cursor = 'pointer';
        }
      } else {
        setHoveredTooth(null);
        setHoveredName(null);
        container.style.cursor = 'default';
      }
    };

    const onPointerUp = () => {
      controlsRef.current.isDragging = false;
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
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(9, Math.min(24, cameraRef.current.position.z + e.deltaY * 0.01));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('click', onClick);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    // 9. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (autoRotate && rootGroupRef.current) {
        rootGroupRef.current.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const newW = container.clientWidth;
      cameraRef.current.aspect = newW / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('click', onClick);
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, []);

  // Update Indicator Badges based on records, selection, and hover
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

      // Color mapping according to clinical guidelines
      let hexColor = 0x94a3b8; // default subtle slate
      let opacity = 0.45;
      let scale = 1.0;

      if (condition === 'caries') {
        hexColor = 0xd97706; // Amber / Cavity
        opacity = 0.85;
      } else if (condition === 'filling') {
        hexColor = 0x0284c7; // Blue / Restored
        opacity = 0.85;
      } else if (condition === 'crown') {
        hexColor = 0x7c3aed; // Violet / Prosthetic
        opacity = 0.90;
      } else if (condition === 'missing') {
        hexColor = 0x64748b; // Muted Dark Slate
        opacity = 0.50;
      } else if (condition === 'healthy') {
        hexColor = 0x10b981; // Emerald Healthy
        opacity = 0.40;
      }

      if (isHovered) {
        scale = 1.35;
        opacity = 0.95;
        hexColor = 0x0284c7;
      }

      if (isSelected) {
        scale = 1.6;
        opacity = 1.0;
        hexColor = 0x0f172a; // High-contrast Focus
      }

      ringMat.color.setHex(hexColor);
      ringMat.opacity = opacity;
      dotMat.color.setHex(hexColor);
      dotMat.opacity = isSelected ? 1.0 : opacity * 0.8;
      group.scale.set(scale, scale, scale);
    });
  }, [records, selectedTooth, hoveredTooth]);

  // View Angle Presets
  const applyViewPreset = (preset: 'both' | 'anterior' | 'upper' | 'lower') => {
    setViewPreset(preset);
    if (!cameraRef.current || !rootGroupRef.current) return;

    if (preset === 'both') {
      // Full Dentition Smile View
      cameraRef.current.position.set(0, 0, 15.5);
      cameraRef.current.lookAt(0, 0, 0);
      rootGroupRef.current.rotation.set(-Math.PI * 0.40, 0, 0);
      if (upperArchMeshRef.current) upperArchMeshRef.current.visible = true;
      if (lowerArchMeshRef.current) lowerArchMeshRef.current.visible = true;
    } else if (preset === 'anterior') {
      // Close up of anterior front teeth
      cameraRef.current.position.set(0, 0, 11.5);
      cameraRef.current.lookAt(0, 0.4, 0);
      rootGroupRef.current.rotation.set(-Math.PI * 0.42, 0, 0);
      if (upperArchMeshRef.current) upperArchMeshRef.current.visible = true;
      if (lowerArchMeshRef.current) lowerArchMeshRef.current.visible = true;
    } else if (preset === 'upper') {
      // Occlusal view of Maxilla (Upper Arch)
      cameraRef.current.position.set(0, 0, 14.5);
      cameraRef.current.lookAt(0, 0, 0);
      rootGroupRef.current.rotation.set(0, 0, 0);
      if (upperArchMeshRef.current) upperArchMeshRef.current.visible = true;
      if (lowerArchMeshRef.current) lowerArchMeshRef.current.visible = false;
    } else if (preset === 'lower') {
      // Occlusal view of Mandible (Lower Arch)
      cameraRef.current.position.set(0, 0, 14.5);
      cameraRef.current.lookAt(0, 0, 0);
      rootGroupRef.current.rotation.set(Math.PI, 0, 0);
      if (upperArchMeshRef.current) upperArchMeshRef.current.visible = false;
      if (lowerArchMeshRef.current) lowerArchMeshRef.current.visible = true;
    }
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
              REAL 3D INTRAORAL SCAN
            </span>
            <h3 className="panel-title" style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
              Anatomical 3D Dentition & Occlusion Model
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Full anatomical human dental arches with real cusp morphology • Drag to orbit 360° • Click any tooth
          </p>
        </div>

        {/* View Angle Presets */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => applyViewPreset('both')}
            style={{ fontWeight: viewPreset === 'both' ? 700 : 500, borderColor: viewPreset === 'both' ? '#0284c7' : undefined }}
          >
            Full Dentition
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => applyViewPreset('anterior')}
            style={{ fontWeight: viewPreset === 'anterior' ? 700 : 500, borderColor: viewPreset === 'anterior' ? '#0284c7' : undefined }}
          >
            Anterior Smile
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => applyViewPreset('upper')}
            style={{ fontWeight: viewPreset === 'upper' ? 700 : 500, borderColor: viewPreset === 'upper' ? '#0284c7' : undefined }}
          >
            Upper Arch
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => applyViewPreset('lower')}
            style={{ fontWeight: viewPreset === 'lower' ? 700 : 500, borderColor: viewPreset === 'lower' ? '#0284c7' : undefined }}
          >
            Lower Arch
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
          borderRadius: '10px',
          background: 'radial-gradient(circle at 50% 35%, #ffffff 0%, #e2e8f0 100%)',
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
              Loading Real Anatomical Dental Scan...
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Rendering clinical human dental anatomy & PBR enamel shaders
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
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #e2e8f0',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            pointerEvents: 'none',
          }}
        >
          <Compass size={13} color="#0284c7" />
          Click & drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
}

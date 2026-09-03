import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import {
  Sun,
  Camera,
  Download,
  Upload,
  RotateCw,
  Maximize2,
  Move,
  Sliders
} from "lucide-react";

export interface ThreeDState {
  lightPos: { x: number; y: number; z: number };
  lightColor: string;
  ambientColor: string;
  lightIntensity: number;
  shadowsEnabled: boolean;
  materialColor: string;
  roughness: number;
  metalness: number;
  wireframe: boolean;
  gizmoMode: "translate" | "rotate" | "scale";
  customModelUrl: string | null;
}

interface ThreeDModeProps {
  state: ThreeDState;
  setState: React.Dispatch<React.SetStateAction<ThreeDState>>;
}

export const ThreeDMode: React.FC<ThreeDModeProps> = ({ state, setState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);

  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#121216");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 3, 6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = state.shadowsEnabled;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;
    orbit.target.set(0, 1.5, 0);
    orbit.update();
    controlsRef.current = orbit;

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode(state.gizmoMode);
    transformControls.addEventListener("dragging-changed", (event) => {
      orbit.enabled = !event.value;
    });
    scene.add(transformControls.getHelper());
    transformControlsRef.current = transformControls;

    const grid = new THREE.GridHelper(20, 20, 0x444455, 0x222233);
    grid.position.y = 0;
    scene.add(grid);

    const planeGeo = new THREE.PlaneGeometry(30, 30);
    const planeMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    scene.add(plane);

    const ambientLight = new THREE.AmbientLight(state.ambientColor, 0.6);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(state.lightColor, state.lightIntensity);
    dirLight.position.set(state.lightPos.x, state.lightPos.y, state.lightPos.z);
    dirLight.castShadow = state.shadowsEnabled;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.top = 5;
    dirLight.shadow.camera.bottom = -5;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    loadDefaultSkeleton(modelGroup, scene);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      orbit.dispose();
      transformControls.dispose();
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
      }
    };
  }, []);

  const loadDefaultSkeleton = (group: THREE.Group, scene: THREE.Scene) => {
    group.clear();
    if (skeletonHelperRef.current) {
      scene.remove(skeletonHelperRef.current);
    }

    const rootBone = new THREE.Bone();
    rootBone.position.y = 1.2;

    const spineBone = new THREE.Bone();
    spineBone.position.y = 0.5;
    rootBone.add(spineBone);

    const neckBone = new THREE.Bone();
    neckBone.position.y = 0.4;
    spineBone.add(neckBone);

    const headBone = new THREE.Bone();
    headBone.position.y = 0.3;
    neckBone.add(headBone);

    const leftShoulder = new THREE.Bone();
    leftShoulder.position.set(0.35, 0.35, 0);
    spineBone.add(leftShoulder);

    const leftArm = new THREE.Bone();
    leftArm.position.set(0.3, 0, 0);
    leftShoulder.add(leftArm);

    const rightShoulder = new THREE.Bone();
    rightShoulder.position.set(-0.35, 0.35, 0);
    spineBone.add(rightShoulder);

    const rightArm = new THREE.Bone();
    rightArm.position.set(-0.3, 0, 0);
    rightShoulder.add(rightArm);

    const leftHip = new THREE.Bone();
    leftHip.position.set(0.2, 0, 0);
    rootBone.add(leftHip);

    const leftLeg = new THREE.Bone();
    leftLeg.position.set(0, -0.6, 0);
    leftHip.add(leftLeg);

    const rightHip = new THREE.Bone();
    rightHip.position.set(-0.2, 0, 0);
    rootBone.add(rightHip);

    const rightLeg = new THREE.Bone();
    rightLeg.position.set(0, -0.6, 0);
    rightHip.add(rightLeg);

    const bones = [
      rootBone,
      spineBone,
      neckBone,
      headBone,
      leftShoulder,
      leftArm,
      rightShoulder,
      rightArm,
      leftHip,
      leftLeg,
      rightHip,
      rightLeg
    ];

    const skeleton = new THREE.Skeleton(bones);
    const geometry = new THREE.CylinderGeometry(0.3, 0.25, 2.4, 16, 16);

    const position = geometry.attributes.position;
    const skinIndices: number[] = [];
    const skinWeights: number[] = [];

    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i);
      if (y > 0.6) {
        skinIndices.push(3, 2, 0, 0);
        skinWeights.push(0.7, 0.3, 0, 0);
      } else if (y > 0) {
        skinIndices.push(1, 0, 0, 0);
        skinWeights.push(0.8, 0.2, 0, 0);
      } else {
        skinIndices.push(0, 8, 10, 0);
        skinWeights.push(0.6, 0.2, 0.2, 0);
      }
    }

    geometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(skinIndices, 4)
    );
    geometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(skinWeights, 4)
    );

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(state.materialColor),
      roughness: state.roughness,
      metalness: state.metalness,
      wireframe: state.wireframe
    });

    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.add(rootBone);
    mesh.bind(skeleton);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    group.add(mesh);

    const skeletonHelper = new THREE.SkeletonHelper(mesh);
    (skeletonHelper.material as THREE.LineBasicMaterial).linewidth = 3;
    scene.add(skeletonHelper);
    skeletonHelperRef.current = skeletonHelper;

    if (transformControlsRef.current) {
      transformControlsRef.current.attach(mesh);
    }
  };

  useEffect(() => {
    if (dirLightRef.current) {
      dirLightRef.current.position.set(
        state.lightPos.x,
        state.lightPos.y,
        state.lightPos.z
      );
      dirLightRef.current.color.set(state.lightColor);
      dirLightRef.current.intensity = state.lightIntensity;
      dirLightRef.current.castShadow = state.shadowsEnabled;
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(state.ambientColor);
    }

    if (rendererRef.current) {
      rendererRef.current.shadowMap.enabled = state.shadowsEnabled;
    }

    if (modelGroupRef.current) {
      modelGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material && !Array.isArray(mesh.material)) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.color.set(state.materialColor);
            mat.roughness = state.roughness;
            mat.metalness = state.metalness;
            mat.wireframe = state.wireframe;
            mat.needsUpdate = true;
          }
        }
      });
    }

    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(state.gizmoMode);
    }
  }, [state]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);

    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      if (!modelGroupRef.current || !sceneRef.current) return;
      modelGroupRef.current.clear();

      if (skeletonHelperRef.current) {
        sceneRef.current.remove(skeletonHelperRef.current);
      }

      const model = gltf.scene;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      modelGroupRef.current.add(model);

      if (transformControlsRef.current) {
        transformControlsRef.current.attach(model);
      }

      const helper = new THREE.SkeletonHelper(model);
      if (helper.bones.length > 0) {
        sceneRef.current.add(helper);
        skeletonHelperRef.current = helper;
      }

      setState((prev) => ({ ...prev, customModelUrl: url }));
    });
  };

  const handleExportGLB = () => {
    if (!modelGroupRef.current) return;
    const exporter = new GLTFExporter();
    exporter.parse(
      modelGroupRef.current,
      (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "character-model.gltf";
        a.click();
      },
      (error) => console.error("An error occurred while exporting GLTF", error),
      { binary: false }
    );
  };

  const handleSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "3d-snapshot.png";
    a.click();
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden bg-zinc-950 text-zinc-100 relative select-none">
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-zinc-800/90 backdrop-blur-md p-2 rounded-xl border border-zinc-700/60 shadow-xl">
        <label className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer text-xs font-semibold transition">
          <Upload size={15} />
          <span>Load .GLTF / .GLB</span>
          <input
            type="file"
            accept=".gltf,.glb"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>

        <div className="h-4 w-px bg-zinc-700" />

        <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-700/50">
          <button
            onClick={() => setState((s) => ({ ...s, gizmoMode: "translate" }))}
            className={`p-1.5 rounded text-xs transition ${
              state.gizmoMode === "translate"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Translate (Move)"
          >
            <Move size={15} />
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, gizmoMode: "rotate" }))}
            className={`p-1.5 rounded text-xs transition ${
              state.gizmoMode === "rotate"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Rotate"
          >
            <RotateCw size={15} />
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, gizmoMode: "scale" }))}
            className={`p-1.5 rounded text-xs transition ${
              state.gizmoMode === "scale"
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Scale"
          >
            <Maximize2 size={15} />
          </button>
        </div>

        <div className="h-4 w-px bg-zinc-700" />

        <button
          onClick={handleSnapshot}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-medium transition"
        >
          <Camera size={15} />
          <span>Snapshot</span>
        </button>

        <button
          onClick={handleExportGLB}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-xs font-medium transition"
        >
          <Download size={15} />
          <span>Export 3D</span>
        </button>
      </div>

      <div ref={mountRef} className="flex-1 h-full w-full relative" />

      <div className="w-80 border-l border-zinc-800 bg-zinc-900/95 backdrop-blur flex flex-col h-full z-10 shadow-2xl overflow-y-auto">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-indigo-400" />
            <h3 className="font-semibold text-sm text-zinc-100">
              3D & Lighting Controls
            </h3>
          </div>
        </div>

        <div className="p-4 space-y-6 text-xs text-zinc-300">
          <div className="space-y-3">
            <label className="text-zinc-400 font-medium flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Sun size={14} className="text-amber-400" />
              <span>Directional Light Position</span>
            </label>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Light X Position</span>
                  <span className="font-mono">{state.lightPos.x}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={state.lightPos.x}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      lightPos: { ...s.lightPos, x: Number(e.target.value) }
                    }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Light Y Position</span>
                  <span className="font-mono">{state.lightPos.y}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={state.lightPos.y}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      lightPos: { ...s.lightPos, y: Number(e.target.value) }
                    }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Light Z Position</span>
                  <span className="font-mono">{state.lightPos.z}</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={state.lightPos.z}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      lightPos: { ...s.lightPos, z: Number(e.target.value) }
                    }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <label className="text-zinc-400 font-medium block uppercase tracking-wider text-[10px]">
              Light Colors & Intensity
            </label>

            <div className="flex items-center justify-between">
              <span>Light Color</span>
              <input
                type="color"
                value={state.lightColor}
                onChange={(e) =>
                  setState((s) => ({ ...s, lightColor: e.target.value }))
                }
                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <span>Ambient Color</span>
              <input
                type="color"
                value={state.ambientColor}
                onChange={(e) =>
                  setState((s) => ({ ...s, ambientColor: e.target.value }))
                }
                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Light Intensity</span>
                <span className="font-mono">{state.lightIntensity}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={state.lightIntensity}
                onChange={(e) =>
                  setState((s) => ({ ...s, lightIntensity: Number(e.target.value) }))
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span>Cast Shadows</span>
              <button
                onClick={() =>
                  setState((s) => ({ ...s, shadowsEnabled: !s.shadowsEnabled }))
                }
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  state.shadowsEnabled ? "bg-indigo-600" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    state.shadowsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-3 border-t border-zinc-800 pt-4">
            <label className="text-zinc-400 font-medium block uppercase tracking-wider text-[10px]">
              Material Modifications
            </label>

            <div className="flex items-center justify-between">
              <span>Material Tint/Color</span>
              <input
                type="color"
                value={state.materialColor}
                onChange={(e) =>
                  setState((s) => ({ ...s, materialColor: e.target.value }))
                }
                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Roughness</span>
                <span className="font-mono">{state.roughness}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.roughness}
                onChange={(e) =>
                  setState((s) => ({ ...s, roughness: Number(e.target.value) }))
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Metalness</span>
                <span className="font-mono">{state.metalness}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.metalness}
                onChange={(e) =>
                  setState((s) => ({ ...s, metalness: Number(e.target.value) }))
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span>Wireframe Mode</span>
              <button
                onClick={() =>
                  setState((s) => ({ ...s, wireframe: !s.wireframe }))
                }
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  state.wireframe ? "bg-indigo-600" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    state.wireframe ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

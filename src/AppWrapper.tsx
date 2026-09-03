import { useState } from "react";
import App from "./App";
import { AppNavigation, type AppMode } from "./components/AppNavigation";
import { FreeCanvasMode, type CanvasImageItem } from "./components/FreeCanvasMode";
import { ThreeDMode, type ThreeDState } from "./components/ThreeDMode";

export function AppWrapper() {
  const [appMode, setAppMode] = useState<AppMode>("card");
  const [canvasImages, setCanvasImages] = useState<CanvasImageItem[]>([]);
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [threeDState, setThreeDState] = useState<ThreeDState>({
    lightPos: { x: 3, y: 5, z: 4 },
    lightColor: "#ffffff",
    ambientColor: "#404050",
    lightIntensity: 1.5,
    shadowsEnabled: true,
    materialColor: "#d0d0e0",
    roughness: 0.4,
    metalness: 0.2,
    wireframe: false,
    gizmoMode: "translate",
    customModelUrl: null
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <AppNavigation mode={appMode} setMode={setAppMode} />

      <div className="flex-1 flex w-full h-full overflow-hidden relative">
        <div
          className="w-full h-full flex flex-col flex-1"
          style={{ display: appMode === "card" ? "flex" : "none" }}
        >
          <App />
        </div>

        <div
          className="studio-skin w-full h-full flex flex-col flex-1"
          style={{ display: appMode === "canvas" ? "flex" : "none" }}
        >
          <FreeCanvasMode
            images={canvasImages}
            setImages={setCanvasImages}
            selectedId={selectedCanvasId}
            setSelectedId={setSelectedCanvasId}
          />
        </div>

        <div
          className="studio-skin w-full h-full flex flex-col flex-1"
          style={{ display: appMode === "3d" ? "flex" : "none" }}
        >
          <ThreeDMode state={threeDState} setState={setThreeDState} />
        </div>
      </div>
    </div>
  );
}

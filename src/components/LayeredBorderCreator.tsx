import React, { useState } from "react";
import { cardSlots } from "../data/cardSlots";
import {
  Layers,
  Sparkles,
  ImagePlus,
  Frame,
  Check,
  SlidersHorizontal,
  FolderOpen,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Droplets,
  Box
} from "lucide-react";

export interface SlotImageObject {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  materialType: "solid" | "liquid";
  // Liquid parameters
  viscosity: number; // 0-100
  yieldStress: number; // 0-100
  adhesion: number; // 0-100
  shearBehavior: number; // -100 (shear thinning) to +100 (shear thickening)
  // Solid parameters
  stiffness: number; // 0-100
  plasticity: number; // 0-100
  moisture: number; // 0-100
  density: number; // 0-100
  granularity: number; // 0-100
  saturation: number; // 0-100
  suspensionDensity: number; // 0-100
}

export interface SlotAssetConfig {
  slotId: number;
  fillColor?: string;
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
  visible?: boolean;
  objects?: SlotImageObject[];
}

interface LayeredBorderCreatorProps {
  slotAssets: Record<number, SlotAssetConfig>;
  setSlotAssets: React.Dispatch<React.SetStateAction<Record<number, SlotAssetConfig>>>;
  onApplyBorderToCard?: () => void;
}

export const LayeredBorderCreator: React.FC<LayeredBorderCreatorProps> = ({
  slotAssets,
  setSlotAssets,
  onApplyBorderToCard
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<number>(1);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const [globalBorderColor, setGlobalBorderColor] = useState<string>("#e2b048");
  const [globalFrameWeight, setGlobalFrameWeight] = useState<number>(75);
  const [masterBorderImage, setMasterBorderImage] = useState<string | null>(null);
  const [masterFrameOverlay, setMasterFrameOverlay] = useState<string | null>(null);
  const [masterGraphicOverlay, setMasterGraphicOverlay] = useState<string | null>(null);

  const currentSlot = cardSlots.find((s) => s.id === selectedSlotId) || cardSlots[0];
  const currentSlotConfig = slotAssets[selectedSlotId] || {
    slotId: selectedSlotId,
    fillColor: "#1e1e24",
    opacity: 100,
    borderWidth: 2,
    borderColor: "#e2b048",
    visible: true,
    objects: []
  };

  const slotObjects = currentSlotConfig.objects || [];
  const selectedObject = slotObjects.find((obj) => obj.id === selectedObjectId) || slotObjects[0] || null;

  const updateCurrentSlotConfig = (key: keyof SlotAssetConfig, value: any) => {
    setSlotAssets((prev) => ({
      ...prev,
      [selectedSlotId]: {
        ...currentSlotConfig,
        slotId: selectedSlotId,
        [key]: value
      }
    }));
  };

  // Add a new image object to the active slot
  const handleAddObject = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const newObj: SlotImageObject = {
          id: `obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          src,
          x: 0,
          y: 0,
          width: 120,
          height: 120,
          opacity: 100,
          materialType: "solid",
          // Liquid defaults
          viscosity: 50,
          yieldStress: 30,
          adhesion: 40,
          shearBehavior: 0, // 0 = Newtonian, <0 = Thinning, >0 = Thickening
          // Solid defaults
          stiffness: 60,
          plasticity: 40,
          moisture: 20,
          density: 50,
          granularity: 30,
          saturation: 50,
          suspensionDensity: 40
        };

        setSlotAssets((prev) => {
          const existing = prev[selectedSlotId]?.objects || [];
          return {
            ...prev,
            [selectedSlotId]: {
              ...prev[selectedSlotId],
              slotId: selectedSlotId,
              objects: [...existing, newObj]
            }
          };
        });
        setSelectedObjectId(newObj.id);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // Update properties of the selected object inside the active slot
  const updateSelectedObject = (key: keyof SlotImageObject, value: any) => {
    if (!selectedObject) return;
    const updatedObjects = slotObjects.map((obj) =>
      obj.id === selectedObject.id ? { ...obj, [key]: value } : obj
    );
    updateCurrentSlotConfig("objects", updatedObjects);
  };

  // Delete object from slot
  const handleDeleteObject = (id: string) => {
    const updatedObjects = slotObjects.filter((obj) => obj.id !== id);
    updateCurrentSlotConfig("objects", updatedObjects);
    if (selectedObjectId === id) {
      setSelectedObjectId(updatedObjects[0]?.id || null);
    }
  };

  const handleMasterUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string | null) => void
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setter(src);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-100 p-4 space-y-6 overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">Layered Border Creator & Object Physics</h2>
            <p className="text-xs text-zinc-400">
              Multi-object border creation with liquid (viscosity, yield stress) and solid (stiffness, density) material properties.
            </p>
          </div>
        </div>

        {onApplyBorderToCard && (
          <button
            onClick={onApplyBorderToCard}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition shadow-lg"
          >
            <Check size={16} />
            <span>Apply to Card Studio</span>
          </button>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Master Frame Assets */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 font-semibold text-xs text-amber-400 uppercase tracking-wider">
            <Frame size={16} />
            <span>Master Border & Frame Assets</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Border Artwork (PNG/WebP)</label>
              <label className="flex items-center gap-3 p-3 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 border-dashed rounded-xl cursor-pointer transition">
                <FolderOpen size={18} className="text-amber-400" />
                <div className="flex-1 overflow-hidden">
                  <span className="block font-medium text-zinc-200 truncate">
                    {masterBorderImage ? "Custom Border Active" : "Upload Border Layer"}
                  </span>
                  <span className="block text-[10px] text-zinc-500">Transparent PNG frame</span>
                </div>
                <input
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleMasterUpload(e, setMasterBorderImage)}
                />
              </label>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Full Card Frame Overlay</label>
              <label className="flex items-center gap-3 p-3 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 border-dashed rounded-xl cursor-pointer transition">
                <ImagePlus size={18} className="text-amber-400" />
                <div className="flex-1 overflow-hidden">
                  <span className="block font-medium text-zinc-200 truncate">
                    {masterFrameOverlay ? "Frame Overlay Active" : "Upload Full Overlay"}
                  </span>
                  <span className="block text-[10px] text-zinc-500">Full card artwork overlay</span>
                </div>
                <input
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleMasterUpload(e, setMasterFrameOverlay)}
                />
              </label>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Corner Ornament / Crest</label>
              <label className="flex items-center gap-3 p-3 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 border-dashed rounded-xl cursor-pointer transition">
                <Sparkles size={18} className="text-amber-400" />
                <div className="flex-1 overflow-hidden">
                  <span className="block font-medium text-zinc-200 truncate">
                    {masterGraphicOverlay ? "Ornament Active" : "Upload Ornament Graphic"}
                  </span>
                  <span className="block text-[10px] text-zinc-500">Emblem or crest graphic</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleMasterUpload(e, setMasterGraphicOverlay)}
                />
              </label>
            </div>

            <div className="border-t border-zinc-800 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Frame Tint Accent</span>
                <input
                  type="color"
                  value={globalBorderColor}
                  onChange={(e) => setGlobalBorderColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-zinc-400">Ornament Density</span>
                  <span className="font-mono">{globalFrameWeight}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={globalFrameWeight}
                  onChange={(e) => setGlobalFrameWeight(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right Column: 20 Slots & Multi-Object Physical Parameters */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Select Slot (20 Total Slots)
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold">
              Slot #{selectedSlotId}: {currentSlot.name}
            </span>
          </div>

          {/* 20 Slots Selector Grid */}
          <div className="grid grid-cols-5 gap-2">
            {cardSlots.map((slot) => {
              const cfg = slotAssets[slot.id];
              const isSelected = slot.id === selectedSlotId;
              const objectCount = cfg?.objects?.length || 0;
              return (
                <button
                  key={slot.id}
                  onClick={() => {
                    setSelectedSlotId(slot.id);
                    setSelectedObjectId(cfg?.objects?.[0]?.id || null);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between h-20 transition relative overflow-hidden ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 text-white shadow-lg"
                      : "bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-mono text-[10px] font-bold text-amber-400">
                      #{slot.id}
                    </span>
                    {objectCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[9px] font-mono">
                        {objectCount} obj
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium line-clamp-2 leading-tight">
                    {slot.name}
                  </span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                    {slot.kind}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slot Objects List & Material Controls */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-5 shadow-xl text-xs">
            {/* Header + Add Object (+) Button */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-amber-400" />
                <h3 className="font-semibold text-zinc-200">
                  Objects in Slot #{currentSlot.id} ({slotObjects.length})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Plus (+) Button to Add Image Object */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-md">
                  <Plus size={15} />
                  <span>Add Image Object</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddObject}
                  />
                </label>

                <button
                  onClick={() =>
                    updateCurrentSlotConfig("visible", !(currentSlotConfig.visible ?? true))
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition"
                >
                  {currentSlotConfig.visible !== false ? (
                    <>
                      <Eye size={14} className="text-emerald-400" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} className="text-zinc-500" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Multiple Objects List / Selector */}
            {slotObjects.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {slotObjects.map((obj, idx) => {
                    const isSelectedObj = obj.id === selectedObject?.id;
                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedObjectId(obj.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition shrink-0 ${
                          isSelectedObj
                            ? "bg-amber-500/20 border-amber-500 text-amber-200"
                            : "bg-zinc-800/60 hover:bg-zinc-800 border-zinc-700/60 text-zinc-400"
                        }`}
                      >
                        <img
                          src={obj.src}
                          alt={obj.name}
                          className="w-5 h-5 object-cover rounded"
                        />
                        <span className="font-medium max-w-[100px] truncate">
                          Obj #{idx + 1}: {obj.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteObject(obj.id);
                          }}
                          className="p-1 hover:text-rose-400 transition"
                          title="Delete Object"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Object Physics & Material Properties */}
                {selectedObject && (
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">
                          {selectedObject.name} Physical Parameters
                        </span>
                      </div>

                      {/* State Toggle: Solid vs Liquid Checkbox / Toggle */}
                      <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                        <label
                          onClick={() => updateSelectedObject("materialType", "solid")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg cursor-pointer transition font-medium ${
                            selectedObject.materialType === "solid"
                              ? "bg-amber-600 text-white shadow"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <Box size={14} />
                          <span>Solid</span>
                        </label>

                        <label
                          onClick={() => updateSelectedObject("materialType", "liquid")}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg cursor-pointer transition font-medium ${
                            selectedObject.materialType === "liquid"
                              ? "bg-indigo-600 text-white shadow"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <Droplets size={14} />
                          <span>Liquid</span>
                        </label>
                      </div>
                    </div>

                    {/* LIQUID SLIDERS (4 Sliders) */}
                    {selectedObject.materialType === "liquid" ? (
                      <div className="space-y-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-3.5">
                        <div className="text-indigo-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <Droplets size={14} />
                          <span>Liquid Fluidity & Rheology Sliders</span>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-zinc-300 font-medium">1. Viscosity</span>
                            <span className="font-mono text-indigo-400 font-bold">
                              {selectedObject.viscosity} cP
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedObject.viscosity}
                            onChange={(e) => updateSelectedObject("viscosity", Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-zinc-300 font-medium">2. Yield Stress</span>
                            <span className="font-mono text-indigo-400 font-bold">
                              {selectedObject.yieldStress} Pa
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedObject.yieldStress}
                            onChange={(e) => updateSelectedObject("yieldStress", Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-zinc-300 font-medium">3. Adhesion</span>
                            <span className="font-mono text-indigo-400 font-bold">
                              {selectedObject.adhesion}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedObject.adhesion}
                            onChange={(e) => updateSelectedObject("adhesion", Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-zinc-300 font-medium">
                              4. Shear Thinning &lt;--&gt; Shear Thickening
                            </span>
                            <span className="font-mono text-indigo-400 font-bold">
                              {selectedObject.shearBehavior < 0
                                ? `Thinning (${selectedObject.shearBehavior})`
                                : selectedObject.shearBehavior > 0
                                ? `Thickening (+${selectedObject.shearBehavior})`
                                : "Newtonian (0)"}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            value={selectedObject.shearBehavior}
                            onChange={(e) => updateSelectedObject("shearBehavior", Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    ) : (
                      /* SOLID SLIDERS (7 Sliders) */
                      <div className="space-y-3.5 bg-amber-950/20 border border-amber-900/30 rounded-xl p-3.5">
                        <div className="text-amber-400 font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                          <Box size={14} />
                          <span>Solid Material Physics & Structure Sliders</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-zinc-300 font-medium">1. Stiffness</span>
                              <span className="font-mono text-amber-400 font-bold">
                                {selectedObject.stiffness}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedObject.stiffness}
                              onChange={(e) => updateSelectedObject("stiffness", Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-zinc-300 font-medium">2. Plasticity</span>
                              <span className="font-mono text-amber-400 font-bold">
                                {selectedObject.plasticity}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedObject.plasticity}
                              onChange={(e) => updateSelectedObject("plasticity", Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-zinc-300 font-medium">3. Moisture</span>
                              <span className="font-mono text-amber-400 font-bold">
                                {selectedObject.moisture}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedObject.moisture}
                              onChange={(e) => updateSelectedObject("moisture", Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-zinc-300 font-medium">4. Density</span>
                              <span className="font-mono text-amber-400 font-bold">
                                {selectedObject.density}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedObject.density}
                              onChange={(e) => updateSelectedObject("density", Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-zinc-300 font-medium">5. Granularity</span>
                              <span className="font-mono text-amber-400 font-bold">
                                {selectedObject.granularity}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedObject.granularity}
                              onChange={(e) => updateSelectedObject("granularity", Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-zinc-300 font-medium">6. Saturation</span>
                              <span className="font-mono text-amber-400 font-bold">
                                {selectedObject.saturation}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={selectedObject.saturation}
                              onChange={(e) => updateSelectedObject("saturation", Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-zinc-300 font-medium">7. Suspension Density</span>
                            <span className="font-mono text-amber-400 font-bold">
                              {selectedObject.suspensionDensity}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={selectedObject.suspensionDensity}
                            onChange={(e) => updateSelectedObject("suspensionDensity", Number(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 border border-zinc-800 border-dashed rounded-xl">
                <p className="text-xs">No image objects added to Slot #{currentSlot.id} yet.</p>
                <p className="text-[10px] text-zinc-600 mt-1">
                  Click the <strong className="text-amber-400">+ Add Image Object</strong> button above to upload multiple object images and customize their solid / liquid physics.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

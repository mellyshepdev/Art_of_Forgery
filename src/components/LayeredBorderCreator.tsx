import React, { useState } from "react";
import { cardSlots, slotById, type CardSlot } from "../data/cardSlots";
import {
  Layers,
  Upload,
  Palette,
  Sparkles,
  Sliders,
  ImagePlus,
  Frame,
  Check,
  RotateCcw,
  SlidersHorizontal,
  FolderOpen,
  Eye,
  EyeOff
} from "lucide-react";

export interface SlotAssetConfig {
  slotId: number;
  imageUrl?: string | null;
  fillColor?: string;
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
  visible?: boolean;
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
  const [globalBorderColor, setGlobalBorderColor] = useState<string>("#e2b048");
  const [globalFrameWeight, setGlobalFrameWeight] = useState<number>(75);
  const [masterBorderImage, setMasterBorderImage] = useState<string | null>(null);
  const [masterFrameOverlay, setMasterFrameOverlay] = useState<string | null>(null);
  const [masterGraphicOverlay, setMasterGraphicOverlay] = useState<string | null>(null);

  const currentSlot = cardSlots.find((s) => s.id === selectedSlotId) || cardSlots[0];
  const currentAsset = slotAssets[selectedSlotId] || {
    slotId: selectedSlotId,
    fillColor: "#1e1e24",
    opacity: 100,
    borderWidth: 2,
    borderColor: "#e2b048",
    visible: true
  };

  const updateCurrentSlotAsset = (key: keyof SlotAssetConfig, value: any) => {
    setSlotAssets((prev) => ({
      ...prev,
      [selectedSlotId]: {
        ...currentAsset,
        slotId: selectedSlotId,
        [key]: value
      }
    }));
  };

  const handleSlotImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      updateCurrentSlotAsset("imageUrl", src);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
            <h2 className="text-base font-bold text-zinc-100">Layered Border Creator</h2>
            <p className="text-xs text-zinc-400">
              Customize artwork, frame overlays, and individual texture imports for each of the 20 card slots.
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

      {/* Main Grid: Master Frame Assets & 20 Slots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Master Border Overlays */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 font-semibold text-xs text-amber-400 uppercase tracking-wider">
            <Frame size={16} />
            <span>Master Border & Frame Assets</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Custom Border Artwork */}
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

            {/* Frame Overlay */}
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

            {/* Border Graphic / Ornament */}
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

        {/* Center & Right Column: 20 Card Slots Selection & Customization */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Select Slot (20 Total Slots Available)
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold">
              Slot #{selectedSlotId}: {currentSlot.name}
            </span>
          </div>

          {/* 20 Slots Grid Selector */}
          <div className="grid grid-cols-5 gap-2">
            {cardSlots.map((slot) => {
              const asset = slotAssets[slot.id];
              const isSelected = slot.id === selectedSlotId;
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
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
                    {asset?.imageUrl && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Image Imported" />
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

          {/* Active Slot Fine-Tuning Panel */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-amber-400" />
                <h3 className="font-semibold text-zinc-200">
                  Configure Slot #{currentSlot.id} — {currentSlot.name}
                </h3>
              </div>

              <button
                onClick={() =>
                  updateCurrentSlotAsset("visible", !(currentAsset.visible ?? true))
                }
                className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition"
              >
                {currentAsset.visible !== false ? (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Import Artwork/Texture for this slot */}
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">
                  Import Texture / Image for Slot #{currentSlot.id}
                </label>
                <label className="flex items-center gap-3 p-3 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 border-dashed rounded-xl cursor-pointer transition">
                  <Upload size={18} className="text-emerald-400" />
                  <div className="flex-1 overflow-hidden">
                    <span className="block font-medium text-zinc-200 truncate">
                      {currentAsset.imageUrl ? "Texture Active" : "Choose Image File"}
                    </span>
                    <span className="block text-[10px] text-zinc-500">PNG, JPG, WEBP</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSlotImageUpload}
                  />
                </label>
              </div>

              {/* Slot Color & Border Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Slot Fill Color</span>
                  <input
                    type="color"
                    value={currentAsset.fillColor || "#1e1e24"}
                    onChange={(e) => updateCurrentSlotAsset("fillColor", e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Slot Border Color</span>
                  <input
                    type="color"
                    value={currentAsset.borderColor || "#e2b048"}
                    onChange={(e) => updateCurrentSlotAsset("borderColor", e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-400">Opacity</span>
                    <span className="font-mono">{currentAsset.opacity ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentAsset.opacity ?? 100}
                    onChange={(e) =>
                      updateCurrentSlotAsset("opacity", Number(e.target.value))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

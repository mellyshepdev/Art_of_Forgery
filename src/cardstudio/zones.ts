
Zones · TS
import type { ZoneGeometry, ZoneId } from "./types";
 
// ---------------------------------------------------------------------------
// Zone geometry — derived from the reference template's numbered markers.
// All boxes are % of the fixed 500x710 card. This is the ONLY place layout
// lives: change a number here and it moves everywhere (fill layer, text,
// selection outline, marker dot) consistently. Do NOT let per-card state
// touch these values — only Fill/content state is per-card.
// ---------------------------------------------------------------------------
 
export const zoneGeometry: Record<ZoneId, ZoneGeometry> = {
  "1": {
    id: "1", label: "Top-left crest", shape: "circle",
    box: { top: 2, left: 3, width: 15, height: 10.6 },
  },
  "2": {
    id: "2", label: "Name banner", shape: "pill",
    box: { top: 3.5, left: 20, width: 60, height: 7.5 },
    text: {
      defaultValue: "ORYN, WARDEN OF THE WILD", maxLength: 34,
      fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 17,
      fontWeight: 800, color: "#f0dfaa", align: "center", uppercase: true,
    },
  },
  "3": {
    id: "3", label: "Top-right crest", shape: "circle",
    box: { top: 2, left: 82, width: 15, height: 10.6 },
  },
  "4": {
    id: "4", label: "Left rail — upper", shape: "rect",
    box: { top: 16, left: 0, width: 6, height: 22 },
  },
  "5": {
    id: "5", label: "Core artwork", shape: "circle",
    box: { top: 11, left: 12, width: 76, height: 53.5 },
    isPortrait: true,
  },
  "6": {
    id: "6", label: "Right rail — upper", shape: "rect",
    box: { top: 16, left: 94, width: 6, height: 22 },
  },
  "7": {
    id: "7", label: "Left rail — lower", shape: "rect",
    box: { top: 40, left: 0, width: 6, height: 18 },
  },
  "8": {
    id: "8", label: "Right rail — lower", shape: "rect",
    box: { top: 40, left: 94, width: 6, height: 18 },
  },
  "9": {
    id: "9", label: "Ability 1 icon", shape: "circle",
    box: { top: 58.5, left: 15, width: 8, height: 5.6 },
  },
  "10": {
    id: "10", label: "Ability 1 text", shape: "rect",
    box: { top: 58, left: 26, width: 58, height: 6.6 },
    text: {
      defaultValue: "Deal 18 damage. Entangle the target for 1 turn.", maxLength: 90,
      fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 9,
      fontWeight: 400, color: "#bcbba9", align: "left",
    },
  },
  "11": {
    id: "11", label: "Ability 2 icon", shape: "circle",
    box: { top: 65, left: 15, width: 8, height: 5.6 },
  },
  "12": {
    id: "12", label: "Ability 2 text", shape: "rect",
    box: { top: 64.5, left: 26, width: 58, height: 6.6 },
    text: {
      defaultValue: "Prevent the next 12 damage dealt to an ally.", maxLength: 90,
      fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 9,
      fontWeight: 400, color: "#bcbba9", align: "left",
    },
  },
  "13": {
    id: "13", label: "Ability 3 icon", shape: "circle",
    box: { top: 71.5, left: 15, width: 8, height: 5.6 },
  },
  "14": {
    id: "14", label: "Ability 3 text", shape: "rect",
    box: { top: 71, left: 26, width: 58, height: 6.6 },
    text: {
      defaultValue: "At the start of turn, restore 4 HP to your companions.", maxLength: 90,
      fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 9,
      fontWeight: 400, color: "#bcbba9", align: "left",
    },
  },
  "15": {
    id: "15", label: "Mounted companion portrait", shape: "circle",
    box: { top: 82, left: 5, width: 29.6, height: 17.3 },
    isPortrait: true,
  },
  "16": {
    id: "16", label: "Mounted companion name", shape: "rect",
    box: { top: 96, left: 5, width: 29.6, height: 3.2 },
    text: {
      defaultValue: "BRIAR STAG · MOUNT / THORNBURST", maxLength: 40,
      fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 10,
      fontWeight: 700, color: "#f0dda3", align: "center", uppercase: true,
    },
  },
  "17": {
    id: "17", label: "Faction / edition seal", shape: "circle",
    box: { top: 84.5, left: 42, width: 16, height: 11.3 },
  },
  "18": {
    id: "18", label: "Flying companion name", shape: "rect",
    box: { top: 96, left: 65.4, width: 29.6, height: 3.2 },
    text: {
      defaultValue: "DUSK OWL · FLYING / FORESIGHT", maxLength: 40,
      fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 10,
      fontWeight: 700, color: "#f0dda3", align: "center", uppercase: true,
    },
  },
  "19": {
    id: "19", label: "Flying companion portrait", shape: "circle",
    box: { top: 82, left: 65.4, width: 29.6, height: 17.3 },
    isPortrait: true,
  },
};
 
export const zoneOrder: ZoneId[] = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
];
 
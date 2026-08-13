export type CardTemplate = {
  id: string;
  name: string;
  file: string;
};

/** Illustrated card frames. Every template shares the same 19-slot grid,
 *  so switching template never moves a slot. */
export const cardTemplates: CardTemplate[] = [
  { id: "ivory", name: "Ivory Relief", file: "1786336500942" },
  { id: "oak", name: "Carved Oak", file: "1786447505085" },
  { id: "gilded", name: "Gilded Sand", file: "1786446577476" },
  { id: "stone", name: "Weathered Stone", file: "1786447584072" },
  { id: "timber", name: "Pale Timber", file: "1786447924864" },
  { id: "tide", name: "Tidecaller", file: "1786447743434" },
  { id: "mire", name: "Mire Bloom", file: "1786447928255" },
  { id: "amethyst", name: "Amethyst Rot", file: "1786448081380" },
  { id: "violet", name: "Violet Drip", file: "1786448143234" },
  { id: "fungal", name: "Fungal Court", file: "1786448382337" },
  { id: "coral", name: "Coral Reliquary", file: "1786448621660" },
  { id: "honeycomb", name: "Honeycomb Orchard", file: "1786448726052" },
  { id: "alchemy", name: "Alchemist's Bench", file: "Gemini_Generated_Image_6ib6yh6ib6yh6ib6" },
  { id: "vault", name: "Parchment Vault", file: "Gemini_Generated_Image_aikoa3aikoa3aiko" },
  { id: "grave", name: "Gravebound", file: "Gemini_Generated_Image_g883j5g883j5g883" },
  { id: "chapel", name: "Bone Chapel", file: "Gemini_Generated_Image_z68eaaz68eaaz68e" },
];

export const templateSrc = (t: CardTemplate) => `/images/templates/${t.file}.webp`;

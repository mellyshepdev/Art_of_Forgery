# Art of Forgery

The card studio behind Black Sheep Co. — a Vite + React app for laying out
illustrated playing cards on a fixed grid, so every card in a set lands with its
artwork, badges, abilities and seals in exactly the same place.

Built to a single-file bundle and served by Apache in a container named `forge`,
routed by Traefik at `forge.prime-quality.online`.

> **Where this lives.** `main` on GitLab `gbonds1/card-creator` is the line that
> ships, and unit8 is the host it is built and deployed from. GitHub
> `mellyshepdev/Art_of_Forgery` is a second lineage that grew the Free Canvas,
> 3D and Border modes on its own branches; work from it is merged in rather than
> pushed to. The app is called Forge in the UI and card-creator in the GitLab
> path — same thing.

## The 20-slot master grid

`src/data/cardSlots.ts` is the source of truth, and it is deliberately frozen.
Twenty numbered regions, ids 1–20:

| id | name | kind | id | name | kind |
|---:|------|------|---:|------|------|
| 1 | HP badge | text | 11 | Ability 2 icon | image |
| 2 | Name bar | text | 12 | Ability 2 text | text |
| 3 | Rank badge | text | 13 | Ability 3 icon | image |
| 4 | Rivet upper-left | fill | 14 | Ability 3 text | text |
| 5 | Main portrait | image | 15 | Mounted companion | image |
| 6 | Rivet upper-right | fill | 16 | Stud left of faction | fill |
| 7 | Rivet lower-left | fill | 17 | Faction seal | image |
| 8 | Rivet lower-right | fill | 18 | Stud right of faction | fill |
| 9 | Ability 1 icon | image | 19 | Flying companion | image |
| 10 | Ability 1 text | text | 20 | Name plate 2 | text |

Rules the grid depends on:

- **Coordinates are fractions of the card, never pixels.** `x`, `y`, `w`, `h`
  are all 0–1, so a slot holds its position at any render size or zoom.
- **Every template shares this one grid.** That is what guarantees switching
  template never moves a slot — the frame art changes underneath, the regions
  do not.
- **Look slots up by id, never by array position**, with `slotById(id)`.
  Anything indexing `slots[2]` is a bug waiting to happen.
- **Ids are load-bearing — never renumber them.** `localStorage` keys both the
  per-slot fills and the hand-placed point outlines by `slot.id`. Reordering the
  array is safe; renumbering silently detaches every saved outline from its slot.
- `radii` is per-corner rounding in % of the slot's own box, CSS order
  (TL, TR, BR, BL). 50 is fully round, 0 square. Omitted means "the shape's
  default", so slots authored before `radii` existed keep their exact outline.
- `points` takes over once a slot has been fine-tuned point by point, because an
  arbitrary outline can no longer be described by corner rounding. A pointed
  slot is drawn entirely in SVG — fill and edge both — rather than clipped,
  since `clip-path` only subtracts from the element's box and would leave a
  point dragged outside it with an outline and no fill.

## Modes

The strip at the top of the window switches between four:

- **Card** — the studio proper: the grid, the frames, the point editor, export.
- **Border** — the Layered Border Creator. Per-slot border, fill and stacked
  image objects, each object either a solid or a liquid with its own physical
  parameters (viscosity, yield stress, adhesion, shear behaviour; stiffness,
  plasticity, moisture, density, granularity, saturation, suspension density).
- **Canvas** — free canvas: drop images in and arrange them off-grid.
- **3D** — character studio, with light rig, material and gizmo controls.

Border, Canvas and 3D hold their state in `AppWrapper`, so switching tabs never
discards part-built work.

## Studio layout (Card mode)

**Left panel** has two tabs, toggled by the pair of icons in its heading:

- **Areas (Slots)** — all 20 regions in id order. Each row shows the id, the
  slot's name, and its `shape - kind`. Clicking a row is the same as clicking
  the region's outline on the card: it selects the slot, zooms to fit it, locks
  the zoom and opens the properties panel. Unlike the outline, it still works
  when the region is tiny, hidden, or sitting under another slot. `Export JSON`
  sits at the top of this panel; Import/Export of artwork at the bottom.
- **Paint** — brushes, eyedropper, background removal, blank canvas.

**Right panel** is the selected slot: shape, `x`/`y`/`w`/`h` as editable
numbers, per-corner radii, fill colour and opacity, and the point editor.

### Fine-tuning a region

1. Areas (Slots) → click the region. It zooms in and selects.
2. Switch the tool to **edit slots**. Drag the whole slot to move it, the corner
   handles to round it, or grab the numbered dots on the outline.
   Selecting a slot zooms to fit *that* slot rather than a flat amount, so the
   tiny ones open near the 1500% ceiling (the studs land at 1500% and 1494%,
   the rivets around 1140%) and the big ones barely move (main portrait, name
   bar and the ability text rows sit at the 240% floor). The toolbar's
   **Exit zoom / Fit to canvas** button returns to the whole card.
3. Touching a dot commits the traced outline to `points` for real — until then
   the dots are just a sample of the current rounded-rect, so grabbing one never
   snaps the shape to something else. **More dots** subdivides for finer work.
4. **Export JSON** (top of the left panel) emits the whole slot array, `points`
   included, already formatted as `cardSlots.ts` lines. Paste it over the array
   in `src/data/cardSlots.ts` to make the change permanent.

Edits are held in `localStorage` while you work; the export is the only thing
that makes them survive a cache clear. Freeze deliberate changes into the file.

## Develop

```
npm install
npm run dev      # vite dev server
npm run build    # single-file bundle into dist/
```

Needs Node 20.19+ (vite 7). Node 12 boxes cannot build this.

## Deploy

```
docker compose up -d --build
```

`restart: "no"` in `docker-compose.yml` is load-bearing — forge is idle-stopped
by locator after 15m and brought back by wake-on-request. A restart policy would
resurrect it on every daemon restart and make the idle policy look broken.
Routing lives in Traefik's file provider (`dynamic-config/forge.yml`), not in
container labels; `traefik.enable=false` keeps the docker provider from quietly
adding a second way in.

// Questford — a walkable street-grid town. Three avenues run east–west, each
// lined on its north side with shopfronts; leafy park bands and a central
// fountain plaza sit between them, with pedestrian lanes crossing north–south.
// EVERY building faces the same way (roof up, entrance down onto the street
// below it) so the streetscape reads consistently.

export const WORLD_W = 2800;
export const WORLD_H = 2120;

export const ROAD_W = 130;
export const AVENUES = [535, 1275, 2015];           // y-centers of the three streets
export const VPATHS = [425, 1205, 1985];            // x-centers of pedestrian cross-lanes
export const VPATH_W = 84;

export interface BuildingDef {
  slug: string; label: string; blurb: string; emoji: string;
  color: string; roof: string; awning: string; storefront: string;
  x: number; y: number; w: number; h: number; doorSide: 'top' | 'bottom';
}

const BW = 300, BH = 270;
const ROW_Y = [160, 900, 1640];                     // top-y of each building row
const LOT_X = [80, 470, 860, 1250, 1640, 2030, 2420]; // 7 lots per row

// the 8 real careers + which (row,lot) they occupy
interface CareerMeta { slug: string; label: string; blurb: string; emoji: string; color: string; roof: string; awning: string; storefront: string; row: number; lot: number; }
const CAREERS: CareerMeta[] = [
  { slug: 'culinary-arts', label: 'The Questford Bistro', blurb: 'Fire up the line and run the dinner rush.', emoji: '🍳', color: '#ea580c', roof: '#9a3412', awning: '#fb923c', storefront: '🍽️', row: 0, lot: 0 },
  { slug: 'information-technology', label: 'ByteForge Tech Hub', blurb: 'Ship code, squash bugs, design systems.', emoji: '💻', color: '#2563eb', roof: '#1e3a8a', awning: '#60a5fa', storefront: '🛰️', row: 0, lot: 2 },
  { slug: 'health-sciences', label: 'Questford General Hospital', blurb: 'Triage the ER and save lives.', emoji: '🏥', color: '#dc2626', roof: '#7f1d1d', awning: '#fca5a5', storefront: '🚑', row: 0, lot: 4 },
  { slug: 'law-government', label: 'Hall of Justice', blurb: 'Cross-examine witnesses and win the case.', emoji: '⚖️', color: '#7c3aed', roof: '#4c1d95', awning: '#c4b5fd', storefront: '🏛️', row: 0, lot: 6 },
  { slug: 'media-communication', label: 'The Questford Times', blurb: 'Chase the story and make the headline.', emoji: '📰', color: '#0891b2', roof: '#155e75', awning: '#67e8f9', storefront: '📡', row: 1, lot: 1 },
  { slug: 'financial-services', label: 'Keystone Bank', blurb: 'Balance the books and grow the portfolio.', emoji: '🏦', color: '#16a34a', roof: '#14532d', awning: '#86efac', storefront: '🏧', row: 1, lot: 3 },
  { slug: 'education', label: 'Questford Academy', blurb: 'Run the classroom and inspire the class.', emoji: '🎓', color: '#d97706', roof: '#92400e', awning: '#fcd34d', storefront: '🔔', row: 1, lot: 5 },
  { slug: 'arts-entertainment', label: 'The Grand Theater', blurb: 'Direct the show and steal the spotlight.', emoji: '🎭', color: '#db2777', roof: '#831843', awning: '#f9a8d4', storefront: '🎪', row: 2, lot: 2 },
];

export const BUILDINGS: BuildingDef[] = CAREERS.map(c => ({
  slug: c.slug, label: c.label, blurb: c.blurb, emoji: c.emoji, color: c.color, roof: c.roof, awning: c.awning, storefront: c.storefront,
  x: LOT_X[c.lot], y: ROW_Y[c.row], w: BW, h: BH, doorSide: 'bottom',
}));

// Amenity buildings — the "life sim" spots (market, style shop, gym). They use
// the same building art but open a shop interior instead of a career sim.
interface AmenityMeta { slug: string; label: string; blurb: string; emoji: string; color: string; roof: string; awning: string; storefront: string; icon: string; row: number; lot: number; }
const AMENITY_META: AmenityMeta[] = [
  { slug: 'market', label: 'Questmart', blurb: 'Stock up on energy and upgrades.', emoji: '🛒', color: '#0d9488', roof: '#115e59', awning: '#5eead4', storefront: '🛒', icon: 'ShoppingCart', row: 2, lot: 0 },
  { slug: 'home', label: 'Cottage Noir', blurb: 'Head home to relax and restyle.', emoji: '🏠', color: '#0ea5e9', roof: '#0369a1', awning: '#7dd3fc', storefront: '🏠', icon: 'Home', row: 1, lot: 6 },
];
export const AMENITIES: BuildingDef[] = AMENITY_META.map(a => ({
  slug: a.slug, label: a.label, blurb: a.blurb, emoji: a.emoji, color: a.color, roof: a.roof, awning: a.awning, storefront: a.storefront,
  x: LOT_X[a.lot], y: ROW_Y[a.row], w: BW, h: BH, doorSide: 'bottom',
}));
export const AMENITY_ICON: Record<string, string> = Object.fromEntries(AMENITY_META.map(a => [a.slug, a.icon]));
export const AMENITY_SLUGS = AMENITY_META.map(a => a.slug);

// Filler shopfronts occupy every remaining lot so each street is a continuous
// row of buildings (non-interactive). All face down, like the real ones.
const FILL_COLORS: [string, string][] = [
  ['#94a3b8', '#475569'], ['#a8a29e', '#57534e'], ['#7d8597', '#3f4655'], ['#b0a8a0', '#5b524a'],
  ['#8b93a3', '#454c5a'], ['#9f8e7e', '#5c4f42'], ['#88a0a8', '#41545b'], ['#a39bb0', '#534b60'],
];
const used = new Set([...CAREERS, ...AMENITY_META].map(c => `${c.row}-${c.lot}`));
export const FILLERS: BuildingDef[] = [];
ROW_Y.forEach((ry, r) => LOT_X.forEach((lx, l) => {
  if (used.has(`${r}-${l}`)) return;
  const [color, roof] = FILL_COLORS[(r * 7 + l) % FILL_COLORS.length];
  const h = 220 + ((r * 13 + l * 29) % 50);          // slight height variety
  FILLERS.push({ slug: `fill-${r}-${l}`, label: '', blurb: '', emoji: '', color, roof, awning: color, storefront: '', x: lx, y: ry + (BH - h), w: BW, h, doorSide: 'bottom' });
}));

export function doorPoint(b: BuildingDef) {
  return { x: b.x + b.w / 2, y: b.doorSide === 'bottom' ? b.y + b.h + 6 : b.y - 6 };
}

// Central fountain plaza sits in the first park band.
export const PARK = { x: 540, y: 620, w: 1720, h: 240 };
export const FOUNTAIN = { x: 1400, y: 730, r: 72 };
export const SPAWN = { x: 1120, y: 800 };

// Park bands (green spaces between the avenues) — used for grass tinting/props.
export const PARK_BANDS = [
  { x: 0, y: 600, w: WORLD_W, h: 300 },
  { x: 0, y: 1340, w: WORLD_W, h: 300 },
];

// ---- props (on grass / plaza, never on the road lanes) ----
export const TREES: { x: number; y: number; s: number }[] = [
  { x: 360, y: 700, s: 1.1 }, { x: 760, y: 690, s: 0.95 }, { x: 1900, y: 690, s: 1 }, { x: 2300, y: 700, s: 1.05 },
  { x: 360, y: 1450, s: 1 }, { x: 820, y: 1460, s: 1.1 }, { x: 1500, y: 1450, s: 0.9 }, { x: 2050, y: 1460, s: 1 }, { x: 2420, y: 1450, s: 0.95 },
  { x: 1700, y: 730, s: 0.9 }, { x: 1080, y: 700, s: 0.85 },
];
export const LIGHTS: { x: number; y: number }[] = [
  { x: 250, y: 600 }, { x: 1000, y: 600 }, { x: 1820, y: 600 }, { x: 2560, y: 600 },
  { x: 250, y: 1340 }, { x: 1000, y: 1340 }, { x: 1820, y: 1340 }, { x: 2560, y: 1340 },
  { x: 250, y: 2090 }, { x: 1400, y: 2090 }, { x: 2560, y: 2090 },
];
export const BUSHES: { x: number; y: number; s: number }[] = [
  { x: 640, y: 660, s: 1 }, { x: 2120, y: 660, s: 0.9 }, { x: 600, y: 1420, s: 1 }, { x: 1980, y: 1420, s: 0.9 },
  { x: 1180, y: 660, s: 0.8 }, { x: 1620, y: 660, s: 0.85 }, { x: 980, y: 1430, s: 0.9 }, { x: 2300, y: 1430, s: 0.85 },
];
export const FLOWERBEDS: { x: number; y: number; c: string }[] = [
  { x: 1180, y: 700, c: '#f472b6' }, { x: 1620, y: 700, c: '#facc15' },
  { x: 700, y: 1400, c: '#a78bfa' }, { x: 2100, y: 1400, c: '#fb7185' },
  { x: 1300, y: 1420, c: '#fde047' }, { x: 1520, y: 1420, c: '#f472b6' },
];
export const BENCHES: { x: number; y: number; flip: boolean }[] = [
  { x: 1240, y: 800, flip: false }, { x: 1560, y: 800, flip: true },
  { x: 760, y: 1500, flip: false }, { x: 2000, y: 1500, flip: true },
];
export const STALLS: { x: number; y: number; c: string; emoji: string }[] = [
  { x: 980, y: 790, c: '#f59e0b', emoji: '🧺' },
  { x: 1820, y: 790, c: '#10b981', emoji: '🍉' },
];
export const SIGNPOST = { x: 640, y: 800 };

// Cars drive each avenue in two directions and wrap around.
export interface Lane { axis: 'h'; fixed: number; dir: 1 | -1; color: string; speed: number }
export const CAR_LANES: Lane[] = AVENUES.flatMap((y, i) => [
  { axis: 'h' as const, fixed: y - 26, dir: 1 as const, color: ['#ef4444', '#10b981', '#f59e0b'][i], speed: 120 + i * 14 },
  { axis: 'h' as const, fixed: y + 26, dir: -1 as const, color: ['#3b82f6', '#8b5cf6', '#e11d48'][i], speed: 130 + i * 12 },
]);

// Pedestrian loops on the plaza / park bands (NPCs follow these).
export type Path = { x: number; y: number }[];
export const NPC_PATHS: Path[] = [
  [{ x: 620, y: 660 }, { x: 2180, y: 660 }, { x: 2180, y: 840 }, { x: 620, y: 840 }],
  [{ x: 620, y: 1400 }, { x: 2180, y: 1400 }, { x: 2180, y: 1580 }, { x: 620, y: 1580 }],
  [{ x: 1040, y: 700, }, { x: 1760, y: 700 }, { x: 1760, y: 820 }, { x: 1040, y: 820 }],
];

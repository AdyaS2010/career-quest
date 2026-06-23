// PICO-8 City (Kenney, CC0) tile engine helpers — shared by the walkable
// per-domain worlds. Tileset: 24×15 grid of 8px tiles, packed (no spacing).
export const TILE = 8;
export const SHEET_COLS = 24;
export const SHEET_URL = '/assets/pico8/Tilemap/tilemap_packed.png';
export const MAP_TMX = '/assets/pico8/Tiled/sample-map.tmx';

export interface BaseMap { w: number; h: number; terrain: number[]; objects: number[] }

const FLIP_MASK = 0x1fffffff; // strip Tiled's flip flags from a GID

function parseLayer(xml: Document, name: string, w: number, h: number): number[] {
  const layer = [...xml.querySelectorAll('layer')].find(l => l.getAttribute('name') === name);
  const csv = layer?.querySelector('data')?.textContent || '';
  // GID 0 = empty cell → -1; otherwise strip flip flags and make it 0-based.
  const nums = csv.split(',').map(s => parseInt(s.trim(), 10) || 0).map(g => (g === 0 ? -1 : ((g & FLIP_MASK) - 1)));
  const out = new Array(w * h).fill(-1);
  for (let i = 0; i < Math.min(nums.length, out.length); i++) out[i] = nums[i];
  return out; // -1 = empty cell, else 0-based tile index
}

let _cache: BaseMap | null = null;
export async function loadBaseMap(): Promise<BaseMap> {
  if (_cache) return _cache;
  const txt = await fetch(MAP_TMX).then(r => r.text());
  const xml = new DOMParser().parseFromString(txt, 'application/xml');
  const map = xml.querySelector('map')!;
  const w = parseInt(map.getAttribute('width') || '55', 10);
  const h = parseInt(map.getAttribute('height') || '30', 10);
  const terrain = parseLayer(xml, 'Terrain', w, h);
  const objects = parseLayer(xml, 'Objects', w, h);
  
  // Reduce building at x=28..32, y=13..16 to clear the road and restore grass/road
  for (let x = 28; x <= 32; x++) {
    terrain[13 * w + x] = 265; // road
    terrain[14 * w + x] = 265; // road
    terrain[15 * w + x] = 20;  // grass
    terrain[16 * w + x] = 20;  // grass
  }
  
  _cache = { w, h, terrain, objects };
  return _cache;
}

// Load the spritesheet image once.
let _sheet: HTMLImageElement | null = null;
export function loadSheet(): Promise<HTMLImageElement> {
  if (_sheet && _sheet.complete) return Promise.resolve(_sheet);
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => { _sheet = img; res(img); };
    img.onerror = rej;
    img.src = SHEET_URL;
  });
}

// Classify each tile index as "water" by sampling its average colour from the
// sheet (PICO-8 water is strongly blue). Used to make canals solid/unwalkable.
// Classify every tile from the sheet pixels (run once, cached). Walkable GROUND
// is detected positively — grass (green), sand (orange), lot/sidewalk (muted
// blue-dominant purple-gray) or road (dark neutral). Everything else under index
// 262 is a building/roof (solid); water (blue) is solid too. This is robust where
// guessing index ranges was not — validated against an offline PNG decode.
let _cls: { water: Set<number>; building: Set<number>; solid: Set<number>; door: Set<number>; road: Set<number>; solidObj: Set<number> } | null = null;
export function classifyTerrain(sheet: HTMLImageElement) {
  if (_cls) return _cls;
  const water = new Set<number>(), building = new Set<number>(), solid = new Set<number>(), door = new Set<number>(), road = new Set<number>(), solidObj = new Set<number>();
  const c = document.createElement('canvas'); c.width = sheet.width; c.height = sheet.height;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(sheet, 0, 0);
  const rows = Math.floor(sheet.height / TILE), cols = Math.floor(sheet.width / TILE);
  for (let i = 0; i < rows * cols; i++) {
    const tx = (i % cols) * TILE, ty = Math.floor(i / cols) * TILE;
    const d = x.getImageData(tx, ty, TILE, TILE).data;
    let white = 0, op = 0, r = 0, g = 0, b = 0, dcW = 0, dcN = 0, sat = 0; // dc* = door zone (bottom-centre), sat = colourful pixels
    for (let yy = 0; yy < TILE; yy++) for (let xx = 0; xx < TILE; xx++) {
      const p = (yy * TILE + xx) * 4; if (d[p + 3] < 128) continue; op++; r += d[p]; g += d[p + 1]; b += d[p + 2];
      const bright = d[p] > 190 && d[p + 1] > 190 && d[p + 2] > 190; if (bright) white++;
      if (Math.max(d[p], d[p + 1], d[p + 2]) - Math.min(d[p], d[p + 1], d[p + 2]) > 45) sat++;
      if (yy >= 4 && xx >= 3 && xx <= 5) { dcN++; if (d[p] > 150 && d[p + 1] > 150 && d[p + 2] > 150) dcW++; }
    }
    if (!op) continue;
    const opF = op / 64, satF = sat / op;
    // Objects that should BLOCK: colourful props (trees/cars/lamps/hydrants/people)
    // or tile-filling props. Flat grey/white decals (road markings, manholes) don't.
    if (satF > 0.2 || opF > 0.62) solidObj.add(i);
    r /= op; g /= op; b /= op; const wf = white / op;
    if (b > 110 && b > r + 35 && b > g + 15) { water.add(i); solid.add(i); continue; } // water
    if (r < 120 && g < 115 && b < 115 && Math.abs(r - b) < 30) road.add(i); // dark asphalt → cars drive here
    if (i >= 262) continue; // roads / crosswalks / props in this range are walkable ground
    const grass = g > r + 15 && g > b;
    const sand = r > 200 && g > 120 && b < 95;
    const lot = b >= r - 5 && r >= g - 5 && b >= 130 && b <= 205 && r >= 110;
    const roadCol = r < 115 && g < 110 && b < 110;
    const pavement = (Math.max(r, g, b) - Math.min(r, g, b)) < 32 && r >= 90 && r <= 212 && g >= 85 && b >= 80;
    const ground = grass || sand || lot || roadCol || pavement; // walkable surfaces
    // `building` = broad (any wall/roof/coloured tile) — used only for placing
    // doorsteps/signs, NOT for collision.
    if (wf > 0.13 || !ground) {
      building.add(i);
      // a doorway: a bright opening in the lower-centre of a wall
      if (wf > 0.04 && wf < 0.45 && !(i >= 212 && i <= 215) && dcN && dcW / dcN > 0.55) door.add(i);
    }
    // `solid` = collision. Block heavily window-framed walls OR clearly-coloured
    // NON-ground tiles (roofs/walls). Grass, sand, lots, sidewalks, curbs stay
    // walkable (sand/grass are saturated but are GROUND, so excluded).
    if (wf > 0.28 || (!ground && satF > 0.32)) solid.add(i);
  }
  _cls = { water, building, solid, door, road, solidObj };
  return _cls;
}
export function isBuilding(idx: number) { return _cls ? _cls.building.has(idx) : false; }
export function isRoad(idx: number) { return _cls ? _cls.road.has(idx) : false; }
export function isDoorTile(idx: number) { return _cls ? _cls.door.has(idx) : false; }
export function isSolidObject(idx: number) { return _cls ? _cls.solidObj.has(idx) : false; }

// Walkable cells directly south of an actual DOOR tile — the welcome-mat spot.
export function doorFrontCells(map: BaseMap, walk: boolean[]): number[] {
  const out: number[] = [];
  for (let y = 1; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const i = y * map.w + x;
    if (walk[i] && isDoorTile(map.terrain[(y - 1) * map.w + x])) out.push(i);
  }
  return out;
}

// Build a walkable grid: blocked by solid TERRAIN (buildings/roofs/water) and by
// solid PROP objects (trees/cars/lampposts/hydrants/people). Flat decals (road
// markings, manholes) and grey ground details stay walkable.
export function buildWalkable(map: BaseMap, solid: Set<number>): boolean[] {
  const walk = new Array(map.w * map.h).fill(false);
  for (let i = 0; i < walk.length; i++) {
    const t = map.terrain[i], o = map.objects[i];
    walk[i] = t >= 0 && !solid.has(t) && !(o >= 0 && isSolidObject(o));
  }
  return walk;
}

// Walkable cells that sit directly in front of (just south of) a building tile —
// i.e. building doorsteps. Great spots for "enter here" markers.
export function doorstepCells(map: BaseMap): number[] {
  const out: number[] = [];
  for (let y = 1; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const i = y * map.w + x;
    const north = (y - 1) * map.w + x;
    if (isBuilding(map.terrain[north]) && !isBuilding(map.terrain[i]) && map.terrain[i] >= 0 && map.objects[i] < 0) out.push(i);
  }
  return out;
}

// BFS from a start cell → set of reachable walkable cell indices.
export function reachable(map: BaseMap, walk: boolean[], start: number): Set<number> {
  const seen = new Set<number>();
  if (!walk[start]) return seen;
  const q = [start]; seen.add(start);
  while (q.length) {
    const cur = q.shift()!; const cx = cur % map.w, cy = Math.floor(cur / map.w);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const ni = ny * map.w + nx;
      if (!seen.has(ni) && walk[ni]) { seen.add(ni); q.push(ni); }
    }
  }
  return seen;
}

// Pick `count` reachable cells spread across the map (greedy farthest-point) so
// the simulation portals don't bunch up. Returns {x,y} tile coords.
export function spreadCells(map: BaseMap, cells: number[], count: number): { x: number; y: number }[] {
  if (!cells.length) return [];
  const pts = cells.map(i => ({ x: i % map.w, y: Math.floor(i / map.w) }));
  const chosen = [pts[Math.floor(pts.length / 2)]];
  while (chosen.length < count && chosen.length < pts.length) {
    let best = pts[0], bestD = -1;
    for (const p of pts) {
      let d = Infinity;
      for (const c of chosen) d = Math.min(d, (p.x - c.x) ** 2 + (p.y - c.y) ** 2);
      if (d > bestD) { bestD = d; best = p; }
    }
    chosen.push(best);
  }
  return chosen.slice(0, count);
}

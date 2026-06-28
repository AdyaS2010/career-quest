// Themed, walkable interiors for each workplace. Each room is a real simulation
// space: drawn furniture (FurnitureSprite), interior NPCs (patients, students,
// customers), wall decor and a rug. Walk to a workstation to begin the shift.
import type { FurnitureKind } from './interiorArt';

export const ROOM_W = 1040;
export const ROOM_H = 660;
export const ROOM_SPAWN = { x: ROOM_W / 2, y: ROOM_H - 105 };
export const ROOM_EXIT = { x: ROOM_W / 2, y: ROOM_H - 24 };

export interface Furniture { kind: FurnitureKind; x: number; y: number; w: number; h: number; color: string; accent?: string }
export interface RoomNpc { x: number; y: number; kind: 'seated' | 'standing' | 'patient'; dir?: string; skin?: string; hair?: string; top?: string; blanket?: string }
export interface Decor { x: number; y: number; kind: 'poster' | 'window' | 'clock'; w?: number; h?: number; color?: string }
export interface Rug { x: number; y: number; w: number; h: number; color: string }
export interface StationAnchor { x: number; y: number; emoji: string }

export interface InteriorDef {
  slug: string; room: string;
  floor: string; floorAlt: string; wall: string; wallTrim: string; accent: string;
  mentorName: string; mentorFace: string; mentorLine: string;
  rug: Rug; furniture: Furniture[]; npcs: RoomNpc[]; decor: Decor[]; stations: StationAnchor[];
}

export const INTERIORS: Record<string, InteriorDef> = {
  'culinary-arts': {
    slug: 'culinary-arts', room: 'The Bistro Kitchen',
    floor: '#e7d3b1', floorAlt: '#dcc59c', wall: '#7c2d12', wallTrim: '#9a3412', accent: '#fb923c',
    mentorName: 'Chef Remy', mentorFace: '👨‍🍳',
    mentorLine: "Heard, chef? Take orders at the register, cook on the line, then plate at the pass. Clean, fast, beautiful  -  let's move!",
    stations: [{ x: 210, y: 200, emoji: '🧾' }, { x: 520, y: 175, emoji: '🔥' }, { x: 830, y: 200, emoji: '🍽️' }],
    rug: { x: 360, y: 372, w: 320, h: 150, color: '#7c2d12' },
    furniture: [
      { kind: 'fridge', x: 56, y: 116, w: 72, h: 100, color: '#cbd5e1' },
      { kind: 'cabinet', x: 912, y: 116, w: 72, h: 100, color: '#d8c39c' },
      { kind: 'counter', x: 96, y: 250, w: 180, h: 70, color: '#9aa6b5' },
      { kind: 'stove', x: 460, y: 246, w: 120, h: 76, color: '#6b7280' },
      { kind: 'counter', x: 762, y: 250, w: 188, h: 70, color: '#9aa6b5' },
      { kind: 'booth', x: 70, y: 420, w: 150, h: 86, color: '#7c2d12' },
      { kind: 'booth', x: 820, y: 420, w: 150, h: 86, color: '#7c2d12' },
      { kind: 'booth', x: 70, y: 530, w: 150, h: 86, color: '#9a3412' },
      { kind: 'booth', x: 820, y: 530, w: 150, h: 86, color: '#9a3412' },
    ],
    npcs: [
      { x: 250, y: 318, kind: 'standing', dir: 'right', top: '#f8fafc', skin: '#e0a87e' },
      { x: 360, y: 560, kind: 'standing', dir: 'up', top: '#ef4444' },
    ],
    decor: [{ x: 150, y: 26, kind: 'window', w: 80, h: 54 }, { x: 740, y: 26, kind: 'poster', w: 70, h: 56, color: '#fb923c' }, { x: 470, y: 30, kind: 'clock' }],
  },
  'information-technology': {
    slug: 'information-technology', room: 'ByteForge Dev Floor',
    floor: '#222b3d', floorAlt: '#2a3650', wall: '#0f172a', wallTrim: '#1e3a8a', accent: '#60a5fa',
    mentorName: 'Ada', mentorFace: '👩‍💻',
    mentorLine: "Welcome to the floor! Build the algorithm at your workstation, squash bugs at the terminal, and design the system on the whiteboard. Ship it!",
    stations: [{ x: 210, y: 200, emoji: '⌨️' }, { x: 520, y: 175, emoji: '🐛' }, { x: 830, y: 200, emoji: '🗺️' }],
    rug: { x: 370, y: 372, w: 300, h: 150, color: '#1e3a8a' },
    furniture: [
      { kind: 'server', x: 58, y: 110, w: 60, h: 124, color: '#1f2937' },
      { kind: 'server', x: 126, y: 110, w: 60, h: 124, color: '#1f2937' },
      { kind: 'board', x: 842, y: 22, w: 150, h: 66, color: '#e5e7eb' },
      { kind: 'desk', x: 110, y: 258, w: 170, h: 56, color: '#475569' },
      { kind: 'screen', x: 152, y: 214, w: 80, h: 56, color: '#0f172a', accent: '#22c55e' },
      { kind: 'desk', x: 760, y: 258, w: 170, h: 56, color: '#475569' },
      { kind: 'screen', x: 802, y: 214, w: 80, h: 56, color: '#0f172a', accent: '#38bdf8' },
      { kind: 'desk', x: 446, y: 470, w: 150, h: 58, color: '#334155' },
      { kind: 'server', x: 194, y: 110, w: 60, h: 124, color: '#1f2937' },
      { kind: 'sofa', x: 70, y: 440, w: 180, h: 82, color: '#1e3a8a' },
      { kind: 'cabinet', x: 910, y: 430, w: 72, h: 96, color: '#334155' },
      { kind: 'desk', x: 790, y: 470, w: 150, h: 58, color: '#475569' },
    ],
    npcs: [
      { x: 195, y: 252, kind: 'seated', top: '#22c55e', skin: '#c68642' },
      { x: 560, y: 320, kind: 'standing', dir: 'left', top: '#8b5cf6' },
      { x: 845, y: 252, kind: 'seated', top: '#38bdf8', skin: '#8d5524' },
      { x: 150, y: 410, kind: 'standing', dir: 'right', top: '#f59e0b' },
    ],
    decor: [{ x: 300, y: 24, kind: 'window', w: 90, h: 56 }, { x: 480, y: 30, kind: 'clock' }, { x: 620, y: 26, kind: 'poster', w: 64, h: 54, color: '#60a5fa' }],
  },
  'health-sciences': {
    slug: 'health-sciences', room: 'Questford General  -  ER',
    floor: '#e6f0f3', floorAlt: '#d3e6ec', wall: '#0e7490', wallTrim: '#155e75', accent: '#22d3ee',
    mentorName: 'Dr. Cruz', mentorFace: '🧑‍⚕️',
    mentorLine: "Incoming! Triage at the first bay, run the exam in the middle, then fill the order at the pharmacy. Calm hands save lives.",
    stations: [{ x: 210, y: 200, emoji: '🩺' }, { x: 520, y: 175, emoji: '🚑' }, { x: 830, y: 200, emoji: '💊' }],
    rug: { x: 372, y: 374, w: 296, h: 140, color: '#0e7490' },
    furniture: [
      { kind: 'cabinet', x: 56, y: 112, w: 80, h: 100, color: '#e2e8f0' },
      { kind: 'cabinet', x: 904, y: 112, w: 80, h: 100, color: '#fecaca' },
      { kind: 'bed', x: 90, y: 250, w: 180, h: 72, color: '#e2e8f0' },
      { kind: 'cart', x: 478, y: 240, w: 84, h: 84, color: '#0f172a' },
      { kind: 'bed', x: 760, y: 250, w: 180, h: 72, color: '#e2e8f0' },
      { kind: 'bed', x: 90, y: 440, w: 180, h: 72, color: '#e2e8f0' },
      { kind: 'counter', x: 410, y: 470, w: 220, h: 60, color: '#0e7490' },
      { kind: 'cabinet', x: 904, y: 440, w: 80, h: 100, color: '#bae6fd' },
      { kind: 'cart', x: 770, y: 450, w: 84, h: 84, color: '#0f172a' },
    ],
    npcs: [
      { x: 96, y: 252, kind: 'patient', blanket: '#60a5fa' },
      { x: 766, y: 252, kind: 'patient', blanket: '#fca5a5' },
      { x: 96, y: 442, kind: 'patient', blanket: '#a7f3d0' },
      { x: 600, y: 320, kind: 'standing', dir: 'left', top: '#22d3ee', skin: '#e0a87e' },
    ],
    decor: [{ x: 300, y: 26, kind: 'poster', w: 70, h: 54, color: '#22d3ee' }, { x: 470, y: 30, kind: 'clock' }, { x: 640, y: 26, kind: 'window', w: 84, h: 54 }],
  },
  'law-government': {
    slug: 'law-government', room: 'Questford Courtroom',
    floor: '#efe7d6', floorAlt: '#e3d6bd', wall: '#4c1d95', wallTrim: '#5b21b6', accent: '#c4b5fd',
    mentorName: 'Judge Hale', mentorFace: '👩‍⚖️',
    mentorLine: "Order in the court. Examine evidence at the counsel table, cross-examine at the stand, then deliver your argument at the podium. Make your case!",
    stations: [{ x: 210, y: 215, emoji: '🔎' }, { x: 520, y: 245, emoji: '🗣️' }, { x: 830, y: 215, emoji: '⚖️' }],
    rug: { x: 380, y: 410, w: 280, h: 130, color: '#4c1d95' },
    furniture: [
      { kind: 'bench', x: 390, y: 96, w: 260, h: 74, color: '#7c2d12' },
      { kind: 'desk', x: 110, y: 278, w: 160, h: 60, color: '#92400e' },
      { kind: 'desk', x: 770, y: 278, w: 160, h: 60, color: '#92400e' },
      { kind: 'podium', x: 482, y: 300, w: 76, h: 80, color: '#a16207' },
      { kind: 'bench', x: 70, y: 470, w: 210, h: 58, color: '#7c2d12' },
      { kind: 'bench', x: 760, y: 470, w: 210, h: 58, color: '#7c2d12' },
      { kind: 'bench', x: 70, y: 556, w: 210, h: 52, color: '#9a3412' },
      { kind: 'bench', x: 760, y: 556, w: 210, h: 52, color: '#9a3412' },
    ],
    npcs: [
      { x: 520, y: 130, kind: 'seated', top: '#1f2937', hair: '#9ca3af' },
      { x: 190, y: 280, kind: 'seated', top: '#3b82f6' },
      { x: 850, y: 280, kind: 'seated', top: '#ef4444' },
      { x: 150, y: 474, kind: 'seated', top: '#10b981' },
      { x: 840, y: 474, kind: 'seated', top: '#f59e0b' },
      { x: 220, y: 474, kind: 'seated', top: '#a855f7' },
    ],
    decor: [{ x: 150, y: 26, kind: 'poster', w: 64, h: 56, color: '#c4b5fd' }, { x: 820, y: 26, kind: 'clock' }, { x: 270, y: 28, kind: 'window', w: 80, h: 54 }],
  },
  'media-communication': {
    slug: 'media-communication', room: 'The Questford Times Newsroom',
    floor: '#dfeef2', floorAlt: '#cce2ea', wall: '#155e75', wallTrim: '#0e7490', accent: '#67e8f9',
    mentorName: 'Editor Lane', mentorFace: '🧑‍💼',
    mentorLine: "Deadline's in an hour! Chase the story at the reporter's desk, frame the shot on camera, then go live at the anchor desk. Make headlines!",
    stations: [{ x: 210, y: 200, emoji: '📝' }, { x: 520, y: 175, emoji: '🎥' }, { x: 830, y: 215, emoji: '📺' }],
    rug: { x: 372, y: 380, w: 296, h: 140, color: '#155e75' },
    furniture: [
      { kind: 'board', x: 58, y: 22, w: 168, h: 66, color: '#0891b2' },
      { kind: 'desk', x: 110, y: 258, w: 170, h: 56, color: '#334155' },
      { kind: 'screen', x: 152, y: 214, w: 80, h: 56, color: '#0f172a', accent: '#67e8f9' },
      { kind: 'camera', x: 470, y: 232, w: 84, h: 90, color: '#1f2937' },
      { kind: 'bench', x: 740, y: 252, w: 220, h: 72, color: '#0f172a' },
      { kind: 'board', x: 842, y: 22, w: 150, h: 66, color: '#0f172a' },
      { kind: 'desk', x: 90, y: 460, w: 170, h: 56, color: '#334155' },
      { kind: 'screen', x: 132, y: 416, w: 80, h: 56, color: '#0f172a', accent: '#22d3ee' },
      { kind: 'desk', x: 320, y: 460, w: 170, h: 56, color: '#334155' },
      { kind: 'screen', x: 362, y: 416, w: 80, h: 56, color: '#0f172a', accent: '#a78bfa' },
    ],
    npcs: [
      { x: 196, y: 252, kind: 'seated', top: '#0891b2' },
      { x: 850, y: 256, kind: 'seated', top: '#e11d48', hair: '#1f2937' },
      { x: 175, y: 458, kind: 'seated', top: '#22d3ee' },
      { x: 405, y: 458, kind: 'seated', top: '#f59e0b', hair: '#7c2d12' },
    ],
    decor: [{ x: 300, y: 26, kind: 'window', w: 84, h: 54 }, { x: 470, y: 30, kind: 'clock' }, { x: 640, y: 26, kind: 'poster', w: 64, h: 54, color: '#67e8f9' }],
  },
  'financial-services': {
    slug: 'financial-services', room: 'Keystone Bank',
    floor: '#e8efe6', floorAlt: '#dbe7d6', wall: '#14532d', wallTrim: '#166534', accent: '#86efac',
    mentorName: 'Mr. Wells', mentorFace: '💼',
    mentorLine: "Welcome to Keystone. Help customers at the teller window, advise on investments at the desk, then balance the vault. Trust is everything here.",
    stations: [{ x: 210, y: 200, emoji: '💵' }, { x: 520, y: 175, emoji: '📈' }, { x: 830, y: 215, emoji: '🔐' }],
    rug: { x: 372, y: 380, w: 296, h: 140, color: '#14532d' },
    furniture: [
      { kind: 'vault', x: 870, y: 30, w: 112, h: 112, color: '#475569' },
      { kind: 'counter', x: 100, y: 250, w: 190, h: 64, color: '#166534' },
      { kind: 'desk', x: 462, y: 258, w: 130, h: 60, color: '#15803d' },
      { kind: 'counter', x: 742, y: 250, w: 190, h: 64, color: '#166534' },
      { kind: 'cabinet', x: 70, y: 430, w: 76, h: 96, color: '#15803d' },
      { kind: 'sofa', x: 740, y: 440, w: 190, h: 82, color: '#14532d' },
      { kind: 'screen', x: 300, y: 250, w: 78, h: 60, color: '#0f172a', accent: '#86efac' },
    ],
    npcs: [
      { x: 190, y: 252, kind: 'seated', top: '#16a34a' },
      { x: 300, y: 540, kind: 'standing', dir: 'up', top: '#f59e0b' },
      { x: 760, y: 320, kind: 'standing', dir: 'left', top: '#3b82f6' },
      { x: 790, y: 252, kind: 'seated', top: '#22c55e', hair: '#1f2937' },
      { x: 820, y: 470, kind: 'standing', dir: 'down', top: '#ec4899' },
    ],
    decor: [{ x: 150, y: 26, kind: 'poster', w: 64, h: 56, color: '#86efac' }, { x: 470, y: 30, kind: 'clock' }, { x: 300, y: 28, kind: 'window', w: 80, h: 54 }],
  },
  'education': {
    slug: 'education', room: 'Questford Academy Classroom',
    floor: '#f0e6cf', floorAlt: '#e6d6b4', wall: '#92400e', wallTrim: '#b45309', accent: '#fcd34d',
    mentorName: 'Ms. Apple', mentorFace: '👩‍🏫',
    mentorLine: "Class is starting! Teach the lesson at the chalkboard, manage the classroom, then grade work at your desk. Inspire these young minds!",
    stations: [{ x: 210, y: 215, emoji: '📚' }, { x: 520, y: 245, emoji: '🍎' }, { x: 830, y: 215, emoji: '✏️' }],
    rug: { x: 380, y: 400, w: 280, h: 120, color: '#92400e' },
    furniture: [
      { kind: 'board', x: 360, y: 18, w: 320, h: 66, color: '#14532d' },
      { kind: 'studentDesk', x: 140, y: 300, w: 86, h: 48, color: '#a16207' },
      { kind: 'studentDesk', x: 290, y: 320, w: 86, h: 48, color: '#a16207' },
      { kind: 'studentDesk', x: 664, y: 320, w: 86, h: 48, color: '#a16207' },
      { kind: 'studentDesk', x: 814, y: 300, w: 86, h: 48, color: '#a16207' },
      { kind: 'desk', x: 460, y: 474, w: 140, h: 60, color: '#92400e' },
      { kind: 'studentDesk', x: 140, y: 430, w: 86, h: 48, color: '#b45309' },
      { kind: 'studentDesk', x: 290, y: 450, w: 86, h: 48, color: '#b45309' },
      { kind: 'studentDesk', x: 664, y: 450, w: 86, h: 48, color: '#b45309' },
      { kind: 'studentDesk', x: 814, y: 430, w: 86, h: 48, color: '#b45309' },
      { kind: 'shelf', x: 60, y: 120, w: 80, h: 124, color: '#7c4a24' },
      { kind: 'shelf', x: 900, y: 120, w: 80, h: 124, color: '#7c4a24' },
    ],
    npcs: [
      { x: 183, y: 296, kind: 'seated', top: '#ef4444' },
      { x: 333, y: 316, kind: 'seated', top: '#3b82f6' },
      { x: 707, y: 316, kind: 'seated', top: '#22c55e' },
      { x: 857, y: 296, kind: 'seated', top: '#8b5cf6' },
      { x: 183, y: 426, kind: 'seated', top: '#f59e0b' },
      { x: 333, y: 446, kind: 'seated', top: '#14b8a6' },
      { x: 707, y: 446, kind: 'seated', top: '#ec4899' },
    ],
    decor: [{ x: 150, y: 26, kind: 'window', w: 84, h: 54 }, { x: 820, y: 28, kind: 'clock' }, { x: 760, y: 24, kind: 'poster', w: 64, h: 56, color: '#fcd34d' }],
  },
  'arts-entertainment': {
    slug: 'arts-entertainment', room: 'The Grand Theater  -  Backstage',
    floor: '#2a1024', floorAlt: '#341430', wall: '#831843', wallTrim: '#9d174d', accent: '#f9a8d4',
    mentorName: 'Director Sol', mentorFace: '🎬',
    mentorLine: "Places, everyone! Paint the set at the studio, run the lighting board, then take the stage for the big number. Lights, camera  -  dazzle them!",
    stations: [{ x: 210, y: 215, emoji: '🎨' }, { x: 520, y: 245, emoji: '🎭' }, { x: 830, y: 215, emoji: '💡' }],
    rug: { x: 380, y: 410, w: 280, h: 120, color: '#831843' },
    furniture: [
      { kind: 'stage', x: 340, y: 78, w: 360, h: 96, color: '#7f1d1d' },
      { kind: 'easel', x: 120, y: 250, w: 130, h: 86, color: '#fdfcf7' },
      { kind: 'desk', x: 800, y: 256, w: 130, h: 58, color: '#1f2937' },
      { kind: 'screen', x: 818, y: 214, w: 80, h: 56, color: '#0f172a', accent: '#f9a8d4' },
      { kind: 'bench', x: 70, y: 450, w: 210, h: 50, color: '#7f1d1d' },
      { kind: 'bench', x: 760, y: 450, w: 210, h: 50, color: '#7f1d1d' },
      { kind: 'bench', x: 70, y: 540, w: 210, h: 50, color: '#9d174d' },
      { kind: 'bench', x: 760, y: 540, w: 210, h: 50, color: '#9d174d' },
      { kind: 'easel', x: 300, y: 250, w: 120, h: 84, color: '#fdfcf7' },
    ],
    npcs: [
      { x: 520, y: 150, kind: 'standing', dir: 'down', top: '#f59e0b' },
      { x: 150, y: 454, kind: 'seated', top: '#ec4899' },
      { x: 840, y: 454, kind: 'seated', top: '#8b5cf6' },
      { x: 220, y: 544, kind: 'seated', top: '#22d3ee' },
    ],
    decor: [{ x: 150, y: 26, kind: 'poster', w: 64, h: 56, color: '#f9a8d4' }, { x: 820, y: 28, kind: 'clock' }, { x: 270, y: 26, kind: 'poster', w: 60, h: 54, color: '#fb7185' }],
  },
};

export function interiorFor(slug: string): InteriorDef {
  return INTERIORS[slug] ?? INTERIORS['culinary-arts'];
}

// Floor finish per room  -  gives each interior a designed, distinct feel.
export const FLOOR_PATTERN: Record<string, 'wood' | 'tile' | 'carpet' | 'marble'> = {
  'culinary-arts': 'tile', 'information-technology': 'carpet', 'health-sciences': 'tile', 'law-government': 'marble',
  'media-communication': 'carpet', 'financial-services': 'marble', 'education': 'wood', 'arts-entertainment': 'wood',
};

// Real-world "Next Steps": a portfolio project idea + curated resources/links so
// the game points players to genuine ways to pursue a field they enjoyed.
export interface ResourceLink { label: string; url: string }
export interface DomainResources { project: string; links: ResourceLink[] }
export const RESOURCES: Record<string, DomainResources> = {
  'culinary-arts': {
    project: 'Plan & cost a 3-course menu, cook one dish, and photograph the plating for a mini portfolio.',
    links: [
      { label: 'Rouxbe Online Culinary School', url: 'https://rouxbe.com' },
      { label: 'ServSafe Food Handler Cert', url: 'https://www.servsafe.com' },
      { label: 'Escoffier Online Courses', url: 'https://www.escoffieronline.com' },
    ],
  },
  'information-technology': {
    project: 'Build a small web app (or automate a chore) and publish the code to GitHub.',
    links: [
      { label: 'freeCodeCamp', url: 'https://www.freecodecamp.org' },
      { label: 'The Odin Project', url: 'https://www.theodinproject.com' },
      { label: 'Harvard CS50 (free)', url: 'https://cs50.harvard.edu/x' },
    ],
  },
  'health-sciences': {
    project: 'Earn a CPR/First-Aid certification and write a one-page reflection on a clinic visit.',
    links: [
      { label: 'Red Cross  -  Take a Class', url: 'https://www.redcross.org/take-a-class' },
      { label: 'Khan Academy  -  Health & Medicine', url: 'https://www.khanacademy.org/science/health-and-medicine' },
      { label: 'HOSA Future Health Pros', url: 'https://hosa.org' },
    ],
  },
  'law-government': {
    project: 'Write a mock case brief on a real issue and argue it in a debate or mock trial.',
    links: [
      { label: 'iCivics', url: 'https://www.icivics.org' },
      { label: 'Khan Academy  -  US Government', url: 'https://www.khanacademy.org/humanities/us-government-and-civics' },
      { label: 'National High School Mock Trial', url: 'https://www.nationalmocktrial.org' },
    ],
  },
  'media-communication': {
    project: 'Produce a 2-minute news segment or a podcast episode and publish it.',
    links: [
      { label: 'Poynter NewsU', url: 'https://www.poynter.org/news-university' },
      { label: 'NPR Training', url: 'https://training.npr.org' },
      { label: 'Adobe Express (free tools)', url: 'https://www.adobe.com/express' },
    ],
  },
  'financial-services': {
    project: 'Build a personal monthly budget and a mock investment portfolio; track it for a month.',
    links: [
      { label: 'Khan Academy  -  Finance', url: 'https://www.khanacademy.org/economics-finance-domain' },
      { label: 'Investopedia', url: 'https://www.investopedia.com' },
      { label: 'Next Gen Personal Finance', url: 'https://www.ngpf.org' },
    ],
  },
  'education': {
    project: 'Design a 15-minute lesson, teach it to a friend, and collect their feedback.',
    links: [
      { label: 'Khan Academy', url: 'https://www.khanacademy.org' },
      { label: 'Coursera  -  Teaching', url: 'https://www.coursera.org/browse/social-sciences/education' },
      { label: 'edX', url: 'https://www.edx.org' },
    ],
  },
  'arts-entertainment': {
    project: 'Create one finished portfolio piece (art, short film, or song) and share it publicly.',
    links: [
      { label: 'Skillshare', url: 'https://www.skillshare.com' },
      { label: 'Behance (build a portfolio)', url: 'https://www.behance.net' },
      { label: 'Coursera  -  Arts & Humanities', url: 'https://www.coursera.org/browse/arts-and-humanities' },
    ],
  },
};
export const INTERNSHIP_LINKS: ResourceLink[] = [
  { label: 'Handshake', url: 'https://joinhandshake.com' },
  { label: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs' },
  { label: 'Chegg Internships', url: 'https://www.internships.com' },
];

// Shop interiors for the "life sim" amenity buildings. Spend wallet coins on
// persistent upgrades (stamina, sprint) and character cosmetics.
import type { FurnitureKind } from './interiorArt';

export interface ShopItem {
  id: string; label: string; desc: string; cost: number;
  kind: 'energyMax' | 'speed' | 'cosmetic';
  field?: 'top' | 'hair' | 'pants' | 'skin';
  value?: string | number;
  swatch?: string;       // colour chip for cosmetics
}

export interface AFurniture { kind: FurnitureKind; x: number; y: number; w: number; h: number; color: string; accent?: string }

export interface AmenityDef {
  slug: string; room: string;
  floor: string; floorAlt: string; wall: string; wallTrim: string; accent: string;
  clerkName: string; clerkFace: string; greeting: string;
  counterLabel?: string;   // what the counter is called (e.g. "Wardrobe")
  items: ShopItem[];
  furniture: AFurniture[];
}

export const AMENITY_DEFS: Record<string, AmenityDef> = {
  home: {
    slug: 'home', room: 'Cottage Noir', floor: '#1c1917', floorAlt: '#0c0a09', wall: '#0f172a', wallTrim: '#1e293b', accent: '#fbbf24',
    clerkName: 'Vanity & Console', clerkFace: '🪞🕹️',
    greeting: "Welcome to Cottage Noir! Step up to the mirror and console to customize your look, upgrade your sprint speed, or train your stamina.",
    counterLabel: 'Mirror & Console',
    items: [
      // Cosmetics
      { id: 'home-top-default', label: 'Classic Green Hoodie', desc: 'Your signature look', cost: 0, kind: 'cosmetic', field: 'top', value: '#22c55e', swatch: '#22c55e' },
      { id: 'home-top-navy', label: 'Navy Sweater', desc: 'Cozy and classic', cost: 50, kind: 'cosmetic', field: 'top', value: '#1e3a8a', swatch: '#1e3a8a' },
      { id: 'top-violet', label: 'Violet Hoodie', desc: 'Bold and brilliant', cost: 90, kind: 'cosmetic', field: 'top', value: '#8b5cf6', swatch: '#8b5cf6' },
      { id: 'top-rose', label: 'Rose Jacket', desc: 'Soft and stylish', cost: 90, kind: 'cosmetic', field: 'top', value: '#ec4899', swatch: '#ec4899' },
      { id: 'top-amber', label: 'Amber Coat', desc: 'Warm and sunny', cost: 90, kind: 'cosmetic', field: 'top', value: '#f59e0b', swatch: '#f59e0b' },
      { id: 'hair-blonde', label: 'Blonde Hair', desc: 'Light it up', cost: 70, kind: 'cosmetic', field: 'hair', value: '#d4a017', swatch: '#d4a017' },
      { id: 'hair-auburn', label: 'Auburn Hair', desc: 'Rich and red', cost: 70, kind: 'cosmetic', field: 'hair', value: '#7c2d12', swatch: '#7c2d12' },
      { id: 'home-pants-blue', label: 'Blue Jeans', desc: 'Everyday denim', cost: 0, kind: 'cosmetic', field: 'pants', value: '#1d4ed8', swatch: '#1d4ed8' },
      { id: 'pants-charcoal', label: 'Charcoal Jeans', desc: 'Goes with anything', cost: 60, kind: 'cosmetic', field: 'pants', value: '#334155', swatch: '#334155' },
      { id: 'home-skin-2', label: 'Warm Tan', desc: 'Skin tone', cost: 0, kind: 'cosmetic', field: 'skin', value: '#e0a87e', swatch: '#e0a87e' },
      { id: 'home-skin-3', label: 'Deep Brown', desc: 'Skin tone', cost: 0, kind: 'cosmetic', field: 'skin', value: '#8d5524', swatch: '#8d5524' },
      // Upgrades relocated from Questmart / Gym
      { id: 'gym-sprint1', label: 'Sprint Drills I', desc: 'Move noticeably faster', cost: 140, kind: 'speed', value: 1 },
      { id: 'gym-sprint2', label: 'Sprint Drills II', desc: 'Even faster on your feet', cost: 220, kind: 'speed', value: 2 },
      { id: 'gym-sprint3', label: 'Marathon Form', desc: 'Top movement speed', cost: 320, kind: 'speed', value: 3 },
      { id: 'mkt-stam1', label: 'Trail Mix', desc: '+15 max energy', cost: 60, kind: 'energyMax', value: 15 },
      { id: 'mkt-stam2', label: 'Power Smoothie', desc: '+25 max energy', cost: 120, kind: 'energyMax', value: 25 },
      { id: 'gym-stam', label: 'Endurance Circuit', desc: '+30 max energy', cost: 160, kind: 'energyMax', value: 30 },
      { id: 'mkt-tee', label: 'Noir Tee (teal)', desc: 'A fresh teal top', cost: 70, kind: 'cosmetic', field: 'top', value: '#14b8a6', swatch: '#14b8a6' },
    ],
    furniture: [
      // Partition walls (Y-sorted: segment bottoms are at 260 and 560 respectively)
      { kind: 'wall_v', x: 320, y: 96, w: 32, h: 164, color: '#7c2d12' },
      { kind: 'wall_v', x: 320, y: 380, w: 32, h: 180, color: '#7c2d12' },
      { kind: 'wall_v', x: 720, y: 96, w: 32, h: 164, color: '#7c2d12' },
      { kind: 'wall_v', x: 720, y: 380, w: 32, h: 180, color: '#7c2d12' },

      // ── Left Room: Kitchen & Living ──
      { kind: 'fridge', x: 50, y: 110, w: 48, h: 96, color: '#b45309' },
      { kind: 'sink', x: 98, y: 120, w: 48, h: 48, color: '#b45309' },
      { kind: 'cabinet', x: 146, y: 120, w: 48, h: 48, color: '#b45309' },
      { kind: 'stove', x: 194, y: 120, w: 48, h: 48, color: '#1f2937' },
      { kind: 'fireplace', x: 250, y: 110, w: 56, h: 72, color: '#92400e' }, // chimney near partition
      
      { kind: 'table_v', x: 250, y: 240, w: 48, h: 120, color: '#b45309' },
      { kind: 'stool', x: 210, y: 260, w: 32, h: 32, color: '#b45309' },
      { kind: 'stool', x: 210, y: 310, w: 32, h: 32, color: '#b45309' },
      { kind: 'stool', x: 300, y: 260, w: 32, h: 32, color: '#b45309' },
      { kind: 'stool', x: 300, y: 310, w: 32, h: 32, color: '#b45309' },
      
      // Sofa and TV (Speed Sort Game Station)
      { kind: 'tv', x: 130, y: 380, w: 64, h: 56, color: '#1f2937' },
      { kind: 'sofa', x: 80, y: 460, w: 160, h: 64, color: '#b45309' },
      { kind: 'barrel', x: 260, y: 530, w: 40, h: 48, color: '#92400e' },

      // ── Middle Room: Reception / Vanity ──
      { kind: 'server', x: 370, y: 120, w: 48, h: 96, color: '#475569' },
      { kind: 'rack', x: 630, y: 120, w: 96, h: 48, color: '#475569' },
      
      // Bookshelf (Memory Match Game Station) — positioned properly against the right side of the room, off the rug
      { kind: 'shelf', x: 610, y: 430, w: 96, h: 96, color: '#b45309' },
      { kind: 'chest', x: 550, y: 450, w: 48, h: 40, color: '#b45309' },
      
      // Torches & decor
      { kind: 'torch', x: 360, y: 100, w: 20, h: 40, color: '#fbbf24' },
      { kind: 'torch', x: 700, y: 100, w: 20, h: 40, color: '#fbbf24' },
      { kind: 'crate', x: 660, y: 530, w: 44, h: 44, color: '#92400e' },

      // ── Right Room: Bedroom, Study & Music ──
      { kind: 'bed', x: 850, y: 120, w: 128, h: 128, color: '#10b981' },
      { kind: 'shelf', x: 750, y: 120, w: 96, h: 96, color: '#b45309' },
      
      // Desk (Word Scramble Game Station) — interactive
      { kind: 'desk', x: 850, y: 360, w: 144, h: 48, color: '#b45309' },
      { kind: 'screen', x: 900, y: 320, w: 48, h: 48, color: '#1f2937' },
      
      { kind: 'piano', x: 780, y: 440, w: 128, h: 128, color: '#1f2937' },
      { kind: 'barrel', x: 940, y: 480, w: 40, h: 48, color: '#92400e' },
      { kind: 'torch', x: 960, y: 300, w: 20, h: 40, color: '#fbbf24' },
    ],

  },
};

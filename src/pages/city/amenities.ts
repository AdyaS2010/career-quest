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
  market: {
    slug: 'market', room: 'Questmart', floor: '#e7efe6', floorAlt: '#d6e6d4', wall: '#0d9488', wallTrim: '#115e59', accent: '#5eead4',
    clerkName: 'Pip the Grocer', clerkFace: '🧑‍🌾',
    greeting: "Welcome to Questmart! Top up your stamina capacity and sprint speeds here. Keep your hustle strong out there!",
    counterLabel: 'Checkout',
    items: [
      { id: 'mkt-stam1', label: 'Trail Mix', desc: '+15 max energy', cost: 60, kind: 'energyMax', value: 15 },
      { id: 'mkt-stam2', label: 'Power Smoothie', desc: '+25 max energy', cost: 120, kind: 'energyMax', value: 25 },
      { id: 'gym-stam', label: 'Endurance Circuit', desc: '+30 max energy', cost: 160, kind: 'energyMax', value: 30 },
      { id: 'gym-sprint1', label: 'Sprint Drills I', desc: 'Move noticeably faster', cost: 140, kind: 'speed', value: 1 },
      { id: 'gym-sprint2', label: 'Sprint Drills II', desc: 'Even faster on your feet', cost: 220, kind: 'speed', value: 2 },
      { id: 'gym-sprint3', label: 'Marathon Form', desc: 'Top movement speed', cost: 320, kind: 'speed', value: 3 },
      { id: 'mkt-tee', label: 'Questmart Tee (teal)', desc: 'A fresh teal top', cost: 70, kind: 'cosmetic', field: 'top', value: '#14b8a6', swatch: '#14b8a6' },
    ],
    furniture: [
      { kind: 'shelf', x: 60, y: 130, w: 70, h: 170, color: '#0d9488' },
      { kind: 'shelf', x: 150, y: 130, w: 70, h: 170, color: '#0d9488' },
      { kind: 'shelf', x: 820, y: 130, w: 70, h: 170, color: '#0d9488' },
      { kind: 'shelf', x: 910, y: 130, w: 70, h: 170, color: '#0d9488' },
      { kind: 'produce', x: 70, y: 430, w: 150, h: 80, color: '#16a34a' },
      { kind: 'produce', x: 820, y: 430, w: 150, h: 80, color: '#f59e0b' },
    ],
  },
  home: {
    slug: 'home', room: 'Cottage Noir', floor: '#1c1917', floorAlt: '#0c0a09', wall: '#0f172a', wallTrim: '#1e293b', accent: '#fbbf24',
    clerkName: 'Vanity Mirror', clerkFace: '🪞',
    greeting: "Step up to the vanity mirror. Select and apply any styles you own or spend coins to browse other boutique looks.",
    counterLabel: 'Wardrobe',
    items: [
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
    ],
    furniture: [
      { kind: 'bed', x: 60, y: 130, w: 190, h: 90, color: '#334155' },
      { kind: 'shelf', x: 430, y: 130, w: 120, h: 110, color: '#1a0f0a' },
      { kind: 'fridge', x: 760, y: 130, w: 70, h: 96, color: '#475569' },
      { kind: 'counter', x: 840, y: 150, w: 150, h: 64, color: '#1e293b' },
      { kind: 'sofa', x: 120, y: 430, w: 200, h: 84, color: '#1e293b' },
      { kind: 'tv', x: 150, y: 300, w: 120, h: 86, color: '#0f172a' },
    ],
  },
};

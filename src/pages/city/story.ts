// The narrative spine of Questford  -  "The Calling."
// Chapters advance off REAL progress (careers started / mastered, read from
// Supabase) so the story and the gameplay can never disagree. We only persist
// tiny "have they seen this beat yet" flags in localStorage  -  no DB changes.

export interface StoryProgress {
  started: number;   // careers with any challenge attempted
  mastered: number;  // careers fully mastered
}

export interface DialogueLine {
  speaker: string;
  portrait: string;  // emoji portrait
  text: string;
}

export interface Chapter {
  id: string;
  index: number;
  title: string;
  objective: string;
  // fraction 0..1 of how done this chapter's objective is
  progress: (p: StoryProgress) => number;
  isComplete: (p: StoryProgress) => boolean;
  intro: DialogueLine[];   // shown when the chapter begins
  reward?: string;
}

// The story: a fresh graduate arrives in Questford for the city's famous
// "Internship Rotation"  -  try real internships at eight workplaces, earn
// references, build a résumé, and land a dream offer.
const VALE = 'Mayor Questopher';   // Mayor & career-guide counselor
const VALE_FACE = '🧑‍💼';
const QUESTOPHER = 'Mayor Questopher';    // unified speaker name
const Q_FACE = '🧑‍💼';

export const CHAPTERS: Chapter[] = [
  {
    id: 'orientation',
    index: 0,
    title: 'Chapter 1  -  Orientation Day',
    objective: 'Pick a workplace and start your first internship shift',
    progress: (p) => (p.started >= 1 ? 1 : 0),
    isComplete: (p) => p.started >= 1,
    reward: 'Your internship logbook is open.',
    intro: [
      { speaker: VALE, portrait: VALE_FACE, text: "You must be our newest intern! Welcome to Questford  -  the only town where you can try eight careers before you even graduate." },
      { speaker: VALE, portrait: VALE_FACE, text: "Here's how the Rotation works: every building is a real workplace. Walk in, clock into a shift, and do the actual job. Do well and you earn a reference." },
      { speaker: QUESTOPHER, portrait: Q_FACE, text: "I am Mayor Questopher, your counselor and guide! See a glowing door? Walk up, press E, and step inside. Let's land your first internship!" },
    ],
  },
  {
    id: 'first-reference',
    index: 1,
    title: 'Chapter 2  -  Your First Reference',
    objective: 'Complete every shift at one workplace to master it',
    progress: (p) => Math.min(1, p.mastered / 1),
    isComplete: (p) => p.mastered >= 1,
    reward: '📄 A glowing reference letter for your file.',
    intro: [
      { speaker: QUESTOPHER, portrait: Q_FACE, text: "First shift done  -  nice! Finish all the workstations inside a building and you'll truly master that internship." },
      { speaker: VALE, portrait: VALE_FACE, text: "Master a workplace and it earns a golden trophy on the map  -  and a signed reference letter in your portfolio. Recruiters love those." },
    ],
  },
  {
    id: 'resume',
    index: 2,
    title: 'Chapter 3  -  Building the Résumé',
    objective: 'Master internships at 3 different workplaces',
    progress: (p) => Math.min(1, p.mastered / 3),
    isComplete: (p) => p.mastered >= 3,
    reward: 'Word spreads  -  the town is watching you.',
    intro: [
      { speaker: VALE, portrait: VALE_FACE, text: "One internship mastered already? Your logbook's filling up fast." },
      { speaker: VALE, portrait: VALE_FACE, text: "The interns who get the best offers are the well-rounded ones. Master three different fields and you'll have a résumé that turns heads." },
    ],
  },
  {
    id: 'dream-offer',
    index: 3,
    title: 'Chapter 4  -  The Dream Offer',
    objective: 'Master all 8 internships across Questford',
    progress: (p) => Math.min(1, p.mastered / 8),
    isComplete: (p) => p.mastered >= 8,
    reward: 'An offer letter from any field you choose. ✉️',
    intro: [
      { speaker: VALE, portrait: VALE_FACE, text: "Three references! Most interns stop here. But I think you could do something no one's done…" },
      { speaker: QUESTOPHER, portrait: Q_FACE, text: "All eight internships, mastered. Pull that off and every employer in Questford will be fighting over you. Want to try?" },
    ],
  },
];

export const ENDING: DialogueLine[] = [
  { speaker: VALE, portrait: VALE_FACE, text: "Eight workplaces. Eight references. You've done the full Rotation  -  the first intern in Questford history to master every field." },
  { speaker: VALE, portrait: VALE_FACE, text: "So here's the thing every workplace in town sent over this morning…" },
  { speaker: VALE, portrait: VALE_FACE, text: "An offer letter. From every single one. The career is yours to choose. ✉️🏆" },
  { speaker: QUESTOPHER, portrait: Q_FACE, text: "Knew it from day one. Now go out there and pick the future you want  -  you've earned all of them. 🛡️✨" },
];

export function currentChapter(p: StoryProgress): Chapter {
  return CHAPTERS.find((c) => !c.isComplete(p)) ?? CHAPTERS[CHAPTERS.length - 1];
}

// ---- localStorage persistence of "seen" beats (per user) ----
interface SeenState { introSeen: boolean; chaptersSeen: string[]; endingSeen: boolean; }

function key(userId: string) { return `questford_story_${userId}`; }

export function loadSeen(userId: string): SeenState {
  try {
    const raw = localStorage.getItem(key(userId));
    if (raw) return { introSeen: false, chaptersSeen: [], endingSeen: false, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { introSeen: false, chaptersSeen: [], endingSeen: false };
}

export function saveSeen(userId: string, s: SeenState) {
  try { localStorage.setItem(key(userId), JSON.stringify(s)); } catch { /* ignore */ }
}

// Career-discovery quiz  -  scenario questions weighted across the 8 domains.
// Engaging, fast, and genuinely useful: it ranks the player's best-fit careers
// and suggests where to start, and the result is re-viewable any time.

export interface QuizDomain { slug: string; name: string; emoji: string; tagline: string; }
export const QUIZ_DOMAINS: Record<string, QuizDomain> = {
  'culinary-arts': { slug: 'culinary-arts', name: 'Culinary Arts', emoji: '🍳', tagline: 'You create joy people can taste.' },
  'information-technology': { slug: 'information-technology', name: 'Information Technology', emoji: '💻', tagline: 'You turn logic into things that work.' },
  'health-sciences': { slug: 'health-sciences', name: 'Health Sciences', emoji: '🏥', tagline: 'You keep people safe and well.' },
  'law-government': { slug: 'law-government', name: 'Law & Government', emoji: '⚖️', tagline: 'You stand up for what is right.' },
  'media-communication': { slug: 'media-communication', name: 'Media & Communication', emoji: '📰', tagline: 'You tell the stories that matter.' },
  'financial-services': { slug: 'financial-services', name: 'Financial Services', emoji: '🏦', tagline: 'You make numbers work for people.' },
  'education': { slug: 'education', name: 'Education', emoji: '🎓', tagline: 'You help others grow.' },
  'arts-entertainment': { slug: 'arts-entertainment', name: 'Arts & Entertainment', emoji: '🎭', tagline: 'You move people through art.' },
};

export interface QuizOption { label: string; emoji: string; weights: Record<string, number>; }
export interface QuizQuestion { q: string; options: QuizOption[]; }

export const QUIZ: QuizQuestion[] = [
  {
    q: "Free Saturday afternoon  -  what are you doing?",
    options: [
      { label: 'Cooking a feast for friends', emoji: '🍝', weights: { 'culinary-arts': 3, 'education': 1 } },
      { label: 'Building or tinkering with tech', emoji: '🔧', weights: { 'information-technology': 3, 'financial-services': 1 } },
      { label: 'Volunteering to help someone', emoji: '🤝', weights: { 'health-sciences': 3, 'education': 2 } },
      { label: 'Making art, music, or video', emoji: '🎨', weights: { 'arts-entertainment': 3, 'media-communication': 2 } },
    ],
  },
  {
    q: "Pick a superpower:",
    options: [
      { label: 'Heal any injury instantly', emoji: '✨', weights: { 'health-sciences': 3 } },
      { label: 'Persuade absolutely anyone', emoji: '🗣️', weights: { 'law-government': 3, 'media-communication': 2 } },
      { label: 'Understand any machine', emoji: '🤖', weights: { 'information-technology': 3 } },
      { label: 'Predict the markets', emoji: '📈', weights: { 'financial-services': 3 } },
    ],
  },
  {
    q: "Friends come to you for…",
    options: [
      { label: 'A patient explanation', emoji: '📚', weights: { 'education': 3 } },
      { label: 'Smart money advice', emoji: '💰', weights: { 'financial-services': 3 } },
      { label: 'Someone to argue their side', emoji: '⚖️', weights: { 'law-government': 3 } },
      { label: 'The best food in town', emoji: '🍽️', weights: { 'culinary-arts': 3 } },
    ],
  },
  {
    q: "Which headline would you love to be behind?",
    options: [
      { label: '"Local Hero Saves the Day"', emoji: '📰', weights: { 'media-communication': 3 } },
      { label: '"New Treatment Approved"', emoji: '🩺', weights: { 'health-sciences': 3 } },
      { label: '"Sold-Out Show Premieres"', emoji: '🎭', weights: { 'arts-entertainment': 3 } },
      { label: '"Startup Hits a Billion"', emoji: '🚀', weights: { 'information-technology': 2, 'financial-services': 2 } },
    ],
  },
  {
    q: "Your ideal workspace is…",
    options: [
      { label: 'A buzzing kitchen', emoji: '🔥', weights: { 'culinary-arts': 3 } },
      { label: 'A calm lab or office', emoji: '🔬', weights: { 'health-sciences': 2, 'information-technology': 2 } },
      { label: 'A stage or a courtroom', emoji: '🎬', weights: { 'arts-entertainment': 2, 'law-government': 2 } },
      { label: 'A lively classroom', emoji: '🍎', weights: { 'education': 3 } },
    ],
  },
  {
    q: "What matters most in a career?",
    options: [
      { label: 'Creativity & self-expression', emoji: '🌈', weights: { 'arts-entertainment': 2, 'media-communication': 2 } },
      { label: 'Helping people directly', emoji: '❤️', weights: { 'health-sciences': 2, 'education': 2 } },
      { label: 'Solving hard problems', emoji: '🧩', weights: { 'information-technology': 2, 'financial-services': 2 } },
      { label: 'Fairness & doing right', emoji: '🕊️', weights: { 'law-government': 3 } },
    ],
  },
];

export interface QuizResult { ranking: { slug: string; pct: number }[]; top: string; takenAt: number; }

export function scoreQuiz(answers: number[]): QuizResult {
  const totals: Record<string, number> = {};
  Object.keys(QUIZ_DOMAINS).forEach(s => (totals[s] = 0));
  answers.forEach((optIdx, qi) => {
    const opt = QUIZ[qi]?.options[optIdx];
    if (opt) for (const [slug, w] of Object.entries(opt.weights)) totals[slug] += w;
  });
  const max = Math.max(1, ...Object.values(totals));
  const ranking = Object.entries(totals)
    .map(([slug, v]) => ({ slug, pct: Math.round((v / max) * 100) }))
    .sort((a, b) => b.pct - a.pct);
  return { ranking, top: ranking[0].slug, takenAt: Date.now() };
}

const KEY = (uid: string) => `questford_quiz_${uid}`;
export function loadQuiz(uid: string): QuizResult | null {
  try { const raw = localStorage.getItem(KEY(uid)); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveQuiz(uid: string, r: QuizResult) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(r)); } catch { /* ignore */ }
}

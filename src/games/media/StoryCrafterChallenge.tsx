import { useState, useCallback } from 'react';
import { Layout, Image as ImageIcon, Type, Printer, CheckCircle2, XCircle, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface StoryElement {
  id: string;
  type: 'headline' | 'image' | 'text';
  content: string;
  category: 'tech' | 'sports' | 'politics';
}

const ELEMENTS: StoryElement[] = [
  // Tech
  { id: 'h_tech1', type: 'headline', content: "AI BREAKTHROUGH: MACHINES LEARN TO DREAM", category: 'tech' },
  { id: 'i_tech1', type: 'image', content: "🤖", category: 'tech' },
  { id: 't_tech1', type: 'text', content: "Local university researchers have developed a new neural architecture that exhibits signs of REM sleep patterns during downtime.", category: 'tech' },
  { id: 'h_tech2', type: 'headline', content: "NEW SMARTPHONE BATTERY LASTS 10 YEARS", category: 'tech' },
  { id: 'i_tech2', type: 'image', content: "🔋", category: 'tech' },
  { id: 't_tech2', type: 'text', content: "Say goodbye to daily charging. A new solid-state micro-battery promises to outlast the device itself.", category: 'tech' },

  // Sports
  { id: 'h_sport1', type: 'headline', content: "CITY TIGERS WIN CHAMPIONSHIP IN OVERTIME", category: 'sports' },
  { id: 'i_sport1', type: 'image', content: "🏆", category: 'sports' },
  { id: 't_sport1', type: 'text', content: "In a stunning upset, the beloved underdogs secured the regional title with a buzzer-beater shot.", category: 'sports' },
  { id: 'h_sport2', type: 'headline', content: "STAR QUARTERBACK SIGNS RECORD DEAL", category: 'sports' },
  { id: 'i_sport2', type: 'image', content: "🏈", category: 'sports' },
  { id: 't_sport2', type: 'text', content: "The $500M contract makes him the highest-paid athlete in the history of the league.", category: 'sports' },

  // Politics
  { id: 'h_pol1', type: 'headline', content: "MAYOR ANNOUNCES MASSIVE NEW PARK PROJECT", category: 'politics' },
  { id: 'i_pol1', type: 'image', content: "🌳", category: 'politics' },
  { id: 't_pol1', type: 'text', content: "Downtown will see a 50-acre green space revitalization aimed at reducing urban heat index.", category: 'politics' },
  { id: 'h_pol2', type: 'headline', content: "CITY COUNCIL APPROVES NEW TRANSIT BUDGET", category: 'politics' },
  { id: 'i_pol2', type: 'image', content: "🚆", category: 'politics' },
  { id: 't_pol2', type: 'text', content: "Commuters rejoice as funds are allocated for 50 new light rail trains and expanded routes.", category: 'politics' }
];

type TargetCategory = 'tech' | 'sports' | 'politics';

interface StoryCrafterChallengeProps {
  onComplete: (score: number) => void;
}

export function StoryCrafterChallenge({ onComplete }: StoryCrafterChallengeProps) {
  const [phase, setPhase] = useState<'intro' | 'crafting' | 'review' | 'transition'>('intro');
  const [currentRound, setCurrentRound] = useState(0);

  // We expect EXACTLY 1 Headline, 1 Image, 1 Text
  const [layout, setLayout] = useState<{ headline: StoryElement | null, image: StoryElement | null, text: StoryElement | null }>({
    headline: null,
    image: null,
    text: null
  });

  // Pick random targets for the assignments
  const [targets] = useState<TargetCategory[]>(() => {
    const categories: TargetCategory[] = ['tech', 'sports', 'politics'];
    const shuffled = [...categories].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  });

  const targetCategory = targets[currentRound];

  const [isPrinting, setIsPrinting] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);

  // Shuffle elements for the sidebar
  const [availableElements] = useState(() => {
    return [...ELEMENTS].sort(() => Math.random() - 0.5);
  });

  const { playSfx } = useAudio();

  const handleDragStart = (e: React.DragEvent, element: StoryElement) => {
    e.dataTransfer.setData('elementId', element.id);
  };

  const handleDrop = (slotType: 'headline' | 'image' | 'text', e: React.DragEvent) => {
    e.preventDefault();
    const elementId = e.dataTransfer.getData('elementId');
    const element = availableElements.find(el => el.id === elementId);

    if (element) {
      if (element.type !== slotType) {
        playSfx('error');
        return; // Can only drop headlines in headline slots, etc.
      }

      playSfx('click');
      setLayout(prev => ({
        ...prev,
        [slotType]: element
      }));
    }
  };

  const handlePublish = useCallback(() => {
    playSfx('success'); // Printing sound
    setIsPrinting(true);

    // Scoring Logic out of 50 points total (for this round)
    let points = 0;
    let msgs: string[] = [];

    // 1. Completion (10 points per slot filled = 30 max)
    if (layout.headline) { points += 10; } else { msgs.push("Missing a Headline."); }
    if (layout.image) { points += 10; } else { msgs.push("Missing an Image."); }
    if (layout.text) { points += 10; } else { msgs.push("Missing a Text Story."); }

    if (layout.headline && layout.image && layout.text) {
      msgs.push("Layout is fully populated! (+30pts)");

      // 2. Thematic Consistency (20 points max)
      const isHeadlineCorrect = layout.headline.category === targetCategory;
      const isImageCorrect = layout.image.category === targetCategory;
      const isTextCorrect = layout.text.category === targetCategory;

      if (isHeadlineCorrect && isImageCorrect && isTextCorrect) {
        points += 20;
        msgs.push(`Perfect thematic matching for '${targetCategory}'! (+20pts)`);
      } else {
        if (!isHeadlineCorrect) msgs.push(`Headline does not match the assigned theme '${targetCategory}'.`);
        if (!isImageCorrect) msgs.push(`Image does not match the assigned theme '${targetCategory}'.`);
        if (!isTextCorrect) msgs.push(`Text does not match the assigned theme '${targetCategory}'.`);

        // Partial credit for theme
        let correctCount = [isHeadlineCorrect, isImageCorrect, isTextCorrect].filter(Boolean).length;
        points += correctCount * 6;
      }

      // Check if story pieces actually go together perfectly (same specific story)
      // A bit advanced, we just check category for simplicity, but if they mixed two diff sports stories, we don't penalize too hard, just category.
    } else {
      msgs.push("Cannot assess theme on incomplete layout.");
    }

    const roundScore = Math.min(50, Math.max(0, points));

    setTimeout(() => {
      setScore(prev => prev + roundScore);
      setFeedback(msgs);
      if (currentRound < 1) {
        setPhase('transition');
      } else {
        setPhase('review');
      }
      setIsPrinting(false);
    }, 3000);
  }, [layout, targetCategory, currentRound, playSfx]);

  if (phase === 'intro') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-black p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Layout className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold font-serif">Front Page Editor</h2>
                <p className="text-gray-300 font-medium">Media & Communications • Journalism</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="bg-gray-100 border-l-4 border-gray-800 p-6 rounded-r-xl mb-8">
              <h3 className="font-bold text-gray-900 text-lg mb-2">📰 Assignment Briefing</h3>
              <p className="text-gray-700 leading-relaxed">
                You are the Chief Editor of The Daily Chronicle. It's 11:45 PM and the presses start rolling at midnight!
                <br /><br />
                The Publisher demands today's front page focus entirely on: <span className="font-black text-blue-600 uppercase border-b-2 border-blue-600">{targetCategory}</span>
                <br /><br />
                <strong>Your Goal:</strong> Drag and drop exactly ONE Headline, ONE Image, and ONE Article Body into the layout. They must all match the assigned topic for a perfect score!
              </p>
            </div>
            <button onClick={() => { playSfx('click'); setPhase('crafting'); }} className="w-full py-4 bg-black text-white font-bold rounded-xl text-xl transition-all shadow-xl hover:bg-gray-800">
              Enter the Newsroom
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'crafting' || isPrinting) {
    return (
      <div className="max-w-7xl mx-auto p-4 h-[85vh] flex gap-6">
        {/* Left Panel: The Wire (Assets) */}
        <div className="w-96 bg-white rounded-3xl shadow-xl flex flex-col border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> The Wire
              </h3>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full uppercase">Target: {targetCategory}</span>
            </div>
            <p className="text-xs text-gray-500">Drag components matching the target to the layout.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-100">
            {availableElements.map(element => (
              <div
                key={element.id}
                draggable
                onDragStart={(e) => handleDragStart(e, element)}
                className="bg-white p-4 border-l-4 border-gray-300 shadow-sm rounded-r-lg cursor-grab active:cursor-grabbing hover:border-blue-500 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">
                  {element.type === 'headline' && <Type className="w-4 h-4 text-gray-700" />}
                  {element.type === 'image' && <ImageIcon className="w-4 h-4 text-gray-700" />}
                  {element.type === 'text' && <Layout className="w-4 h-4 text-gray-700" />}
                  {element.type}
                </div>
                <div className="font-serif text-gray-900 group-hover:text-blue-900 transition-colors">
                  {element.type === 'image' ? (
                    <div className="text-5xl text-center bg-gray-50 rounded py-2">{element.content}</div>
                  ) : element.type === 'headline' ? (
                    <div className="font-black text-lg leading-tight">{element.content}</div>
                  ) : (
                    <div className="text-sm italic text-gray-700 line-clamp-3">{element.content}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: The Layout */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-200 rounded-3xl p-8 relative flex shadow-inner overflow-hidden border border-gray-300">

            {/* Newspaper Canvas */}
            <div className="flex-1 bg-white shadow-2xl rounded-sm p-10 border border-gray-300 relative mx-auto max-w-2xl w-full flex flex-col">
              {/* Newspaper Header */}
              <div className="text-center border-b-[6px] border-double border-black pb-4 mb-6">
                <h1 className="font-serif text-6xl font-black uppercase tracking-tighter">The Daily Chronicle</h1>
                <div className="flex justify-between text-sm font-serif mt-2 border-t border-black pt-1 px-4 font-bold">
                  <span>Vol. CXXI</span>
                  <span>{new Date().toLocaleDateString()}</span>
                  <span>LATE EDITION</span>
                </div>
              </div>

              {/* Drop Zones */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Headline Slot */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop('headline', e)}
                  className={`h-32 border-2 border-dashed transition-all flex items-center justify-center ${layout.headline ? 'border-transparent bg-white' : 'border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-500'}`}
                >
                  {layout.headline ? (
                    <div className="w-full text-center group relative">
                      <h2 className="font-serif font-black text-4xl leading-tight uppercase px-4">{layout.headline.content}</h2>
                      {!isPrinting && <button onClick={() => setLayout(p => ({ ...p, headline: null }))} className="absolute -top-4 -right-4 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><XCircle className="w-5 h-5" /></button>}
                    </div>
                  ) : (
                    <div className="text-blue-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                      <Type className="w-5 h-5" /> Drop Headline Here
                    </div>
                  )}
                </div>

                <div className="flex-1 flex gap-6 mt-2">
                  {/* Image Slot */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop('image', e)}
                    className={`flex-1 border-2 border-dashed transition-all flex flex-col items-center justify-center ${layout.image ? 'border-transparent bg-gray-50' : 'border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-500'}`}
                  >
                    {layout.image ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-300 relative group">
                        <div className="text-[120px] drop-shadow-xl">{layout.image.content}</div>
                        {!isPrinting && <button onClick={() => setLayout(p => ({ ...p, image: null }))} className="absolute -top-4 -right-4 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><XCircle className="w-5 h-5" /></button>}
                      </div>
                    ) : (
                      <div className="text-blue-400 font-bold uppercase tracking-widest text-sm flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8" /> Drop Image Here
                      </div>
                    )}
                  </div>

                  {/* Text Slot */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop('text', e)}
                    className={`flex-[1.5] border-2 border-dashed transition-all p-4 ${layout.text ? 'border-transparent bg-white' : 'border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-500 flex items-center justify-center'}`}
                  >
                    {layout.text ? (
                      <div className="relative group h-full">
                        <div className="font-serif text-lg leading-relaxed text-justify first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-2">
                          {layout.text.content}
                          <br /><br />
                          <span className="bg-gray-200 text-transparent select-none rounded animate-pulse">Lorem ipsum dolor sit amet consectetur.</span>
                        </div>
                        {!isPrinting && <button onClick={() => setLayout(p => ({ ...p, text: null }))} className="absolute -top-4 -right-4 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><XCircle className="w-5 h-5" /></button>}
                      </div>
                    ) : (
                      <div className="text-blue-400 font-bold uppercase tracking-widest text-sm flex flex-col items-center gap-2">
                        <Layout className="w-8 h-8" /> Drop Article Body Here
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Printing Overlay */}
            <AnimatePresence>
              {isPrinting && (
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 100 }} className="absolute inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="mb-8">
                    <Printer className="w-32 h-32 text-white" />
                  </motion.div>
                  <h2 className="text-5xl font-black font-serif text-white uppercase tracking-widest mb-4">Rolling Presses...</h2>
                  <p className="text-gray-400 text-xl font-medium animate-pulse">Printing tonight's edition</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex gap-4 items-center">
              <span className="font-bold text-gray-500 uppercase tracking-widest text-sm">Target Status:</span>
              <span className="bg-blue-100 text-blue-800 font-bold px-4 py-1.5 rounded-full uppercase border border-blue-200 shadow-inner block text-center min-w-[150px]">
                {targetCategory}
              </span>
            </div>
            <button
              onClick={handlePublish}
              disabled={isPrinting}
              className="px-10 py-4 bg-black text-white font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-3 disabled:opacity-50"
            >
              <Printer className="w-6 h-6" /> Publish Edition
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'transition') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl p-8 text-center border-t-8 border-t-black">
          <div className="text-6xl mb-4">🗞️</div>
          <h2 className="text-3xl font-black font-serif uppercase tracking-tight text-gray-900 mb-2">Morning Edition Printed</h2>
          <div className="bg-gray-100 rounded-xl p-4 mb-6 inline-block min-w-[200px] border border-gray-200 shadow-inner">
            <div className="text-4xl font-black text-black">{score}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Current Score</div>
          </div>

          <div className="text-left bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-900 uppercase tracking-widest text-sm mb-4 border-b border-gray-200 pb-2">Editor's Feedback (Morning Edition):</h4>
            <ul className="space-y-3">
              {feedback.map((msg, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 font-medium">
                  {msg.includes('+') ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={() => {
            playSfx('click');
            setLayout({ headline: null, image: null, text: null });
            setFeedback([]);
            setCurrentRound(1);
            setPhase('crafting');
          }} className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest rounded-xl text-lg hover:bg-gray-800 transition-colors shadow-lg">
            Start Evening Edition
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl p-8 text-center border-t-8 border-t-black">
        <div className="text-6xl mb-4">{score >= 80 ? '🗞️' : '📰'}</div>
        <h2 className="text-3xl font-black font-serif uppercase tracking-tight text-gray-900 mb-2">Final Editions Printed</h2>
        <div className="bg-gray-100 rounded-xl p-4 mb-6 inline-block min-w-[200px] border border-gray-200 shadow-inner">
          <div className="text-4xl font-black text-black">{score}</div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Final Score (Max 100)</div>
        </div>

        <div className="text-left bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-200 shadow-sm">
          <h4 className="font-bold text-gray-900 uppercase tracking-widest text-sm mb-4 border-b border-gray-200 pb-2">Editor's Feedback (Evening Edition):</h4>
          <ul className="space-y-3">
            {feedback.map((msg, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700 font-medium">
                {msg.includes('+') ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={() => onComplete(score)} className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest rounded-xl text-lg hover:bg-gray-800 transition-colors shadow-lg">
          Continue to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

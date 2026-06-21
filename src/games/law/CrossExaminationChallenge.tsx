import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';
import { ShieldAlert, BookOpen, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Evidence {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Statement {
  id: string;
  text: string;
  pressText: string; // What they say when pressed
  isLie: boolean;
  contradictingEvidenceId?: string; // Which evidence breaks the lie
  correctReasoning?: string;
  wrongReasonings?: string[];
}

interface Case {
  id: string;
  title: string;
  defendant: string;
  witness: {
    name: string;
    role: string;
    avatar: string;
  };
  evidenceBox: Evidence[];
  statements: Statement[];
}

const CASES: Case[] = [
  {
    id: 'case-1',
    title: "The Midnight Muffin Heist",
    defendant: "Chef Charlie",
    witness: {
      name: "Barry the Baker",
      role: "Head Pastry Chef",
      avatar: "👨‍🍳",
    },
    evidenceBox: [
      { id: 'ev-1', name: 'Smart Oven Log', description: 'IoT sensor data showing industrial Oven #3 was preheated to 400°F at precisely 2:00 AM.', icon: '🌡️' },
      { id: 'ev-2', name: 'Forensic Smudges', description: 'Chemical analysis confirms sticky blue stains on the rear exit handle contain high concentrations of artificial blueberry extract.', icon: '🫐' },
      { id: 'ev-3', name: 'Security Footage', description: 'Grainy video showing an individual in a Head Chef\'s uniform carrying a tray out the back door at 2:15 AM.', icon: '📹' },
    ],
    statements: [
      {
        id: 's1',
        text: "I finished my prep work, clocked out at 9 PM, and didn't return to the bakery until morning.",
        pressText: "I was exhausted! I went straight home and slept through the entire night. I have no idea what happened after hours.",
        isLie: true,
        contradictingEvidenceId: 'ev-3',
        correctReasoning: "The security footage clearly identifies someone wearing your specific Head Chef uniform leaving at 2:15 AM. You couldn't have been home sleeping!",
        wrongReasonings: ["The camera proves you were eating a muffin on the job!", "The employee schedule shows you were actually supposed to work a double shift."]
      },
      {
        id: 's2',
        text: "The kitchen was completely shut down and cold. Nobody baked anything after hours.",
        pressText: "I personally lock the ovens every night. If someone fired them up, the whole kitchen would be warm the next day.",
        isLie: true,
        contradictingEvidenceId: 'ev-1',
        correctReasoning: "The IoT Smart Oven logs contradict you completely: they record a manual preheat sequence initiated at exactly 2:00 AM.",
        wrongReasonings: ["The oven was actually left on accidentally since yesterday afternoon.", "You used the oven to hide the stolen diamonds you smuggled in the flour."]
      },
      {
        id: 's3',
        text: "I only bake with premium dark chocolate. I despise fruit and would never touch a blueberry.",
        pressText: "My palate is strictly cocoa-based! I'm practically allergic to anything berry-flavored.",
        isLie: true,
        contradictingEvidenceId: 'ev-2',
        correctReasoning: "If you never touch blueberries, how do you explain your fingerprints in the high-concentration blueberry extract found on the back door?",
        wrongReasonings: ["Blueberries are scientifically classified as a true berry, not a fruit, invalidating your statement.", "The smudges prove you were actually making a strawberry tart, which is a competing fruit."]
      },
    ]
  },
  {
    id: 'case-2',
    title: "The Haunted Server Crash",
    defendant: "Junior Dev Jenny",
    witness: {
      name: "Sysadmin Steve",
      role: "Lead Systems Engineer",
      avatar: "🤓",
    },
    evidenceBox: [
      { id: 'ev-1', name: 'Audit Logs', description: 'System records detailing a manual "sudo reboot" command executed from an internal IP address assigned to Terminal 3.', icon: '💻' },
      { id: 'ev-2', name: 'Access Control Data', description: 'RFID logs indicating Steve\'s unique keycard badge was used to unlock the secure server room at 2:55 PM.', icon: '💳' },
      { id: 'ev-3', name: 'Archived Slack Chat', description: 'A deleted message recovered from the #general channel sent at 2:58 PM reading: "Whoops, tripped over the cord. Hope that wasn\'t prod."', icon: '💬' },
    ],
    statements: [
      {
        id: 's1',
        text: "The server went offline due to an external DDoS attack or a massive regional power anomaly.",
        pressText: "It was a completely unpreventable force majeure event! Our internal systems were working perfectly before the hit.",
        isLie: true,
        contradictingEvidenceId: 'ev-1',
        correctReasoning: "The audit logs show the crash wasn't external at all; a manual reboot command was typed directly from Terminal 3.",
        wrongReasonings: ["A power outage would have fried the motherboard entirely, not just caused a reboot.", "Terminal 3 is the only computer in the office with an active internet connection."]
      },
      {
        id: 's2',
        text: "I was entirely isolated in the 4th-floor breakroom eating my lunch when the system went down at 3 PM.",
        pressText: "I have a solid alibi. I was nowhere near the physical hardware when the incident occurred.",
        isLie: true,
        contradictingEvidenceId: 'ev-2',
        correctReasoning: "Your specific RFID keycard was logged unlocking the server room door at 2:55 PM, placing you directly at the scene of the incident.",
        wrongReasonings: ["The breakroom on the 4th floor is currently under construction and has no tables.", "Someone must have cloned your keycard using a hidden skimmer in the elevator."]
      },
      {
        id: 's3',
        text: "I've been investigating all morning, and I have absolutely no plausible theory for what caused the outage.",
        pressText: "It's a complete mystery to me. I haven't discussed it with anyone or seen any internal communication about it.",
        isLie: true,
        contradictingEvidenceId: 'ev-3',
        correctReasoning: "You literally messaged the entire team saying 'Whoops, tripped over the cord' a mere two minutes before the system crashed!",
        wrongReasonings: ["You explicitly told the Junior Dev you were planning to sabotage the server to get overtime pay.", "You slipped on a banana peel in the server room and confessed to HR."]
      },
    ]
  },
  {
    id: 'case-3',
    title: "The Forged Contract",
    defendant: "Startup Sam",
    witness: {
      name: "CEO Chad",
      role: "Venture Capitalist",
      avatar: "💼",
    },
    evidenceBox: [
      { id: 'ev-1', name: 'The Physical Contract', description: 'The final signed agreement. The signature uses a distinct, bright blue ballpoint ink.', icon: '📝' },
      { id: 'ev-2', name: 'Document Metadata', description: 'Digital forensics reveal the PDF was exported and finalized on a Tuesday at 4:32 PM.', icon: '📄' },
      { id: 'ev-3', name: 'Corporate Bylaws', description: 'Article 4, Section B clearly states: "All binding agreements exceeding $10k must bear an official notary seal." (This document does not).', icon: '⚖️' },
    ],
    statements: [
      {
        id: 's1',
        text: "I reviewed and signed that contract personally, using my signature lucky green fountain pen.",
        pressText: "I am meticulous about my branding. I exclusively use green ink for all official company business!",
        isLie: true,
        contradictingEvidenceId: 'ev-1',
        correctReasoning: "You claim to exclusively sign with a green fountain pen, yet the physical contract before us is clearly signed in blue ballpoint ink!",
        wrongReasonings: ["A green fountain pen would have leaked through the parchment paper used for the contract.", "You actually signed the document digitally using an iPad stylus."]
      },
      {
        id: 's2',
        text: "I finalized the terms, formatted the digital paperwork, and concluded negotiations early Monday morning.",
        pressText: "We wanted to hit the ground running for the week, so everything was fully digitized before noon on Monday.",
        isLie: true,
        contradictingEvidenceId: 'ev-2',
        correctReasoning: "Digital forensic metadata proves the document wasn't even exported until Tuesday afternoon, directly contradicting your timeline!",
        wrongReasonings: ["Monday was a federal holiday, meaning all business negotiations were legally suspended.", "You formatted the document on a vintage typewriter, meaning there would be no digital metadata."]
      },
      {
        id: 's3',
        text: "The executed contract is bulletproof, finalizing the deal according to all strict internal protocols.",
        pressText: "I went by the book. It's a standard agreement, fully signed and legally sound.",
        isLie: true,
        contradictingEvidenceId: 'ev-3',
        correctReasoning: "Corporate bylaws explicitly require a notary seal for this type of agreement, but the contract lacks any such notarization!",
        wrongReasonings: ["The contract was printed on A4 paper, but corporate bylaws strictly mandate US Letter size.", "You forgot to double-space the initial paragraphs, rendering the financial terms illegible."]
      },
    ]
  }
];

interface CrossExaminationChallengeProps {
  onComplete: (score: number) => void;
}

export function CrossExaminationChallenge({ onComplete }: CrossExaminationChallengeProps) {
  // Randomly select a case on mount
  const [currentCase] = useState<Case>(() => CASES[Math.floor(Math.random() * CASES.length)]);
  const [statementIndex, setStatementIndex] = useState(0);
  const [pressure, setPressure] = useState(0); // 0-100, fills up as you break lies
  const [penalties, setPenalties] = useState(0); // Max 3
  const [phase, setPhase] = useState<'listening' | 'pressing' | 'objection_reasoning' | 'dramatic_splash' | 'success_splash' | 'failed'>('listening');

  const [showCourtRecord, setShowCourtRecord] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [splashText, setSplashText] = useState("");
  const [isWitnessSweating, setIsWitnessSweating] = useState(false);
  const [reasoningOptions, setReasoningOptions] = useState<string[]>([]);

  const { playSfx } = useAudio();

  const currentStatement = currentCase.statements[statementIndex];

  // Helper to trigger dramatic screen splash
  const triggerSplash = (text: string, nextPhase: typeof phase, duration = 1500) => {
    setSplashText(text);
    setPhase('dramatic_splash');
    playSfx('success'); // Assuming there's a heavy sound, using success as placeholder
    setTimeout(() => {
      setPhase(nextPhase);
    }, duration);
  };

  const handlePress = () => {
    playSfx('click');
    setPhase('pressing');
    setIsWitnessSweating(true);
  };

  const handleBackToListen = () => {
    playSfx('click');
    setPhase('listening');
    setIsWitnessSweating(false);
  };

  const handleNextStatement = () => {
    playSfx('click');
    if (statementIndex < currentCase.statements.length - 1) {
      setStatementIndex(prev => prev + 1);
      setPhase('listening');
      setIsWitnessSweating(false);
    } else {
      // Loop back to start if they haven't won
      setStatementIndex(0);
      setPhase('listening');
      setIsWitnessSweating(false);
    }
  };

  const handlePresentEvidence = () => {
    if (!selectedEvidence) return;
    setShowCourtRecord(false);

    // Check if the presented evidence correctly contradicts the CURRENT statement
    if (currentStatement.isLie && currentStatement.contradictingEvidenceId === selectedEvidence) {
      // Correct evidence presented! Now move to the argument phase.
      const options = [currentStatement.correctReasoning!, ...currentStatement.wrongReasonings!];
      setReasoningOptions(options.sort(() => Math.random() - 0.5));
      triggerSplash("OBJECTION!", 'objection_reasoning');
    } else {
      // Wrong evidence
      triggerSplash("HOLD IT!", 'listening');
      handlePenalty();
    }
  };

  const handleSelectReasoning = (reason: string) => {
    if (reason === currentStatement.correctReasoning) {
      triggerSplash("TAKE THAT!", 'success_splash');
    } else {
      triggerSplash("HOLD IT!", 'listening');
      handlePenalty();
    }
  };

  const handlePenalty = () => {
    playSfx('error');
    setPenalties(prev => {
      const newPenalties = prev + 1;
      if (newPenalties >= 3) {
        setPhase('failed');
      }
      return newPenalties;
    });
  };

  // Called after a successful OBJECTION! animation finishes
  useEffect(() => {
    if (phase === 'success_splash') {
      const wait = setTimeout(() => {
        setPressure(prev => {
          const newPressure = prev + Math.ceil(100 / currentCase.statements.filter(s => s.isLie).length);
          if (newPressure >= 99) {
            // Case Won!
            const finalScore = Math.max(0, 100 - (penalties * 25));
            onComplete(finalScore);
          } else {
            // Move to next statement
            setStatementIndex(prevIdx => (prevIdx + 1) % currentCase.statements.length);
            setPhase('listening');
            setIsWitnessSweating(false);
          }
          return newPressure;
        });
      }, 3000);
      return () => clearTimeout(wait);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentCase, penalties]);


  if (phase === 'failed') {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-12 border border-slate-800 text-slate-100 relative overflow-hidden">
          {/* Subtle noise/texture overlay could go here in a real app, settling for a gradient flair */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>

          <AlertTriangle className="w-24 h-24 mx-auto mb-6 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h2 className="text-5xl font-bold mb-4 text-white tracking-tight">Case Dismissed</h2>
          <p className="text-xl text-slate-400 mb-8 font-medium">Your objections lacked substantial evidence. The judge has ruled against you.</p>
          <button
            onClick={() => { setPenalties(0); setPressure(0); setStatementIndex(0); setPhase('listening'); }}
            className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] text-white"
          >
            Review Case Files & Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 relative font-sans text-slate-900">
      <div className="bg-slate-50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 border border-slate-200 min-h-[600px] flex flex-col items-center justify-between relative overflow-hidden">
        {/* Sleek Gradient Accent */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-100/50 to-transparent pointer-events-none"></div>

        {/* Dramatic Screen Flash on Splash phase */}
        <AnimatePresence>
          {phase === 'dramatic_splash' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md"
            >
              <h1 className="text-6xl md:text-[8rem] font-black tracking-tighter uppercase text-white drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" style={{ WebkitTextStroke: '2px #ef4444' }}>
                {splashText}
              </h1>
            </motion.div>
          )}

          {phase === 'success_splash' && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl rounded-3xl"
            >
              <div className="bg-emerald-100 p-8 rounded-full mb-8 shadow-[0_0_50px_rgba(52,211,153,0.3)]">
                <CheckCircle2 className="w-24 h-24 text-emerald-500" />
              </div>
              <h2 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">Contradiction Verified</h2>
              <p className="text-xl text-slate-500 text-center max-w-2xl px-4 font-medium">
                The evidence presented logically breaks the witness's testimony.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Bar: Case Info & Penalties */}
        <div className="w-full flex justify-between items-center mb-8 relative z-10 gap-6">
          <div className="bg-white border border-slate-200 px-6 py-3 rounded-xl shadow-sm flex flex-col min-w-[200px]">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Active Case</span>
            <span className="text-slate-800 font-bold text-lg leading-none">{currentCase.title}</span>
          </div>

          {/* Pressure Meter (Progress) */}
          <div className="flex-1 max-w-lg bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-indigo-600">
              <span>Truth Extracted</span>
              <span>{pressure}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden w-full relative">
              <motion.div
                className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pressure}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-black shadow-sm transition-all duration-300 ${i < penalties ? 'bg-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.4)]' : 'bg-slate-100 text-slate-300'
                  }`}
              >
                !
              </div>
            ))}
          </div>
        </div>

        {/* Witness Area */}
        <div className={`relative transition-transform duration-100 ${phase === 'success_splash' ? 'opacity-0' : 'opacity-100'}`}>
          {/* Spotlight */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <motion.div
            className="text-[12rem] mb-4 relative z-10 filter drop-shadow-2xl"
            animate={isWitnessSweating ? { x: [-10, 10, -10, 10, 0], rotate: [0, -2, 2, 0] } : {}}
            transition={{ duration: 0.5, repeat: isWitnessSweating ? Infinity : 0, repeatDelay: 2 }}
          >
            {currentCase.witness.avatar}
          </motion.div>

          {isWitnessSweating && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-0 right-0 text-6xl drop-shadow-md"
            >
              💦
            </motion.div>
          )}

          <div className="bg-white/80 backdrop-blur-md px-10 py-4 rounded-2xl border border-slate-200 mx-auto w-max relative z-10 shadow-sm">
            <div className="text-slate-800 text-center font-bold text-3xl tracking-tight mb-1">{currentCase.witness.name}</div>
            <div className="text-slate-400 text-center text-xs font-bold uppercase tracking-widest">{currentCase.witness.role}</div>
          </div>
        </div>

        {/* Dialogue Box Area */}
        <div className="w-full mt-8 relative z-10">
          {phase === 'objection_reasoning' ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 min-h-[160px] relative shadow-lg flex flex-col justify-center gap-6">
              <div className="absolute -top-4 left-8 bg-amber-500 text-white px-4 py-1.5 font-bold tracking-widest text-xs uppercase rounded-md shadow-sm z-10">
                Construct Your Argument
              </div>
              <p className="text-xl md:text-2xl text-slate-800 font-bold">How does this evidence prove the witness is lying?</p>
              <div className="flex flex-col gap-3">
                {reasoningOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectReasoning(opt)}
                    className="text-left p-4 md:p-5 rounded-xl border-2 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm text-slate-700 font-semibold transition-all"
                  >
                    "{opt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* The Dialogue Box */}
              <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 min-h-[160px] relative shadow-lg flex flex-col justify-center">
                <div className="absolute -top-4 left-8 bg-indigo-600 text-white px-4 py-1.5 font-bold tracking-widest text-xs uppercase rounded-md shadow-sm z-10">
                  Witness Testimony
                </div>

                <p className="text-2xl md:text-3xl text-slate-700 leading-relaxed font-medium">
                  "{phase === 'pressing' ? currentStatement.pressText : currentStatement.text}"
                </p>

                <div className="absolute bottom-6 right-8 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  Statement {statementIndex + 1} / {currentCase.statements.length}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 mt-6">
                <button
                  onClick={() => setShowCourtRecord(true)}
                  className="flex-1 py-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-lg border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-3 uppercase tracking-wider"
                >
                  <BookOpen className="w-5 h-5 text-slate-400" />
                  Open Record
                </button>

                {phase === 'listening' ? (
                  <button
                    onClick={handlePress}
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-1 transition-all uppercase tracking-widest"
                  >
                    Press for Details
                  </button>
                ) : (
                  <button
                    onClick={handleBackToListen}
                    className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-lg shadow-sm transition-all uppercase tracking-widest"
                  >
                    Stop Pressing
                  </button>
                )}

                <button
                  onClick={handleNextStatement}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Court Record Modal Overlay */}
      <AnimatePresence>
        {showCourtRecord && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute inset-8 bg-slate-50 border border-slate-200 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.15)] p-8 z-50 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-widest">
                <BookOpen className="w-6 h-6 text-indigo-500" /> Court Record
              </h3>
              <button
                onClick={() => setShowCourtRecord(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm uppercase tracking-widest bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg transition-colors"
              >
                Close ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-4">
              {currentCase.evidenceBox.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvidence(ev.id)}
                  className={`p-6 rounded-2xl border transition-all flex gap-6 items-center cursor-pointer ${selectedEvidence === ev.id ? 'bg-indigo-50 border-indigo-300 shadow-md ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                    }`}
                >
                  <div className="text-5xl bg-slate-50 p-4 rounded-xl border border-slate-100">{ev.icon}</div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-800 mb-1">{ev.name}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col gap-4">
              <button
                onClick={handlePresentEvidence}
                disabled={!selectedEvidence}
                className="w-full py-5 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white rounded-xl font-bold text-xl tracking-widest shadow-[0_4px_14px_0_rgba(239,68,68,0.39)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase"
              >
                <ShieldAlert className="w-6 h-6" />
                Present Evidence
              </button>
              <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                Select evidence that contradicts the current statement.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

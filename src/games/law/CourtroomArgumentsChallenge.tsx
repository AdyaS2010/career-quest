import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';
import { ShieldAlert, BookOpen, AlertTriangle, ArrowRight, CheckCircle2, Heart, Brain, Zap } from 'lucide-react';

interface ArgumentOption {
  id: string;
  text: string;
  type: 'logic' | 'passion' | 'risk';
  impact: number;      // How much it moves the sentiment meter (-100 to 100)
  riskFactor: number; // Chance to trigger an objection (0 to 1)
}

interface CounterArgument {
  id: string;
  text: string;
  isCorrect: boolean;
  logic: string;
}

interface SpeechPhase {
  id: string;
  prompt: string;
  options: ArgumentOption[];
  objectionCounter?: CounterArgument[]; // If an objection happens on this phase, here are the counters
}

interface JuryCase {
  id: string;
  title: string;
  description: string;
  opponent: string;
  opponentAvatar: string;
  playerAvatar: string;
  judgeAvatar: string;
  phases: SpeechPhase[];
}

// Fun, educational cases
const PERSUASION_CASES: JuryCase[] = [
  {
    id: 'case-1',
    title: "The Intellectual Property of the Secret Sauce",
    description: "Defending a local burger joint accused of stealing a mega-corporation's recipe. You must convince the jury the recipe was independently developed.",
    opponent: "Corp. Lawyer Vance",
    opponentAvatar: "💼",
    playerAvatar: "🧑‍⚖️",
    judgeAvatar: "⚖️",
    phases: [
      {
        id: 'opening',
        prompt: "Deliver your Opening Statement:",
        options: [
          { id: 'opt1', text: "Ladies and gentlemen, a recipe is a list of ingredients. You cannot patent basic culinary math.", type: 'logic', impact: 15, riskFactor: 0.1 },
          { id: 'opt2', text: "MegaBurger Corp wants to crush small businesses trying to achieve the American Dream!", type: 'passion', impact: 25, riskFactor: 0.4 },
          { id: 'opt3', text: "Their so-called 'secret sauce' is literally just ketchup and mayonnaise! It's a scam!", type: 'risk', impact: 40, riskFactor: 0.8 },
        ],
        objectionCounter: [
          { id: 'c1', text: "Trade secret law explicitly protects unique combinations of common ingredients, Your Honor.", isCorrect: true, logic: "Correctly identifies that trade secrets aren't about the ingredients themselves, but the specific proprietary blend." },
          { id: 'c2', text: "Freedom of speech allows me to criticize their sauce!", isCorrect: false, logic: "Irrelevant Constitutional argument." },
          { id: 'c3', text: "Ketchup and mayo mixed together is public domain.", isCorrect: false, logic: "Legally inaccurate oversimplification." },
        ]
      },
      {
        id: 'body',
        prompt: "Address the Missing Documentation:",
        options: [
          { id: 'opt4', text: "My client's recipe book was destroyed in a kitchen fire; an unfortunate accident, not a cover-up.", type: 'passion', impact: 15, riskFactor: 0.2 },
          { id: 'opt5', text: "We have provided timestamped grocery receipts proving ingredient purchases predating the lawsuit.", type: 'logic', impact: 25, riskFactor: 0.1 },
          { id: 'opt6', text: "The plaintiff purposefully ignited the kitchen fire to destroy the evidence themselves!", type: 'risk', impact: 50, riskFactor: 0.9 },
        ],
        objectionCounter: [
          { id: 'c4', text: "This is a baseless accusation constituting slander in open court!", isCorrect: false, logic: "While true, the defense shouldn't be helping the prosecution." },
          { id: 'c5', text: "I withdraw the statement and rely purely on circumstantial timelines.", isCorrect: true, logic: "The safest legal retreat when an unsupported heavy accusation is challenged." },
          { id: 'c6', text: "I demand MegaBurger's CEO take a polygraph right now!", isCorrect: false, logic: "Polygraphs are generally inadmissible and this is a wild escalation." },
        ]
      },
      {
        id: 'conclusion',
        prompt: "Deliver your Closing Argument:",
        options: [
          { id: 'opt7', text: "The timeline clearly shows independent parallel development. The law requires definitive proof of theft, which is absent.", type: 'logic', impact: 30, riskFactor: 0.1 },
          { id: 'opt8', text: "If you vote guilty, you aren't just punishing a chef; you are telling every independent creator they can't cook without corporate permission.", type: 'passion', impact: 35, riskFactor: 0.3 },
          { id: 'opt9', text: "Let's be honest, MegaBurger's sauce tastes terrible anyway. My client fixed it!", type: 'risk', impact: -20, riskFactor: 0.95 },
        ],
        objectionCounter: [
          { id: 'c7', text: "Taste is subjective and completely immaterial to the legal definition of intellectual property theft!", isCorrect: true, logic: "Correctly identifies that the quality of the stolen item has no bearing on whether it was stolen." },
          { id: 'c8', text: "The First Amendment protects culinary criticism.", isCorrect: false, logic: "Not applicable to IP theft." },
          { id: 'c9', text: "The jury has a right to know the sauce is bad.", isCorrect: false, logic: "Prejudicial and irrelevant." },
        ]
      }
    ]
  }
];

interface CourtroomArgumentsChallengeProps {
  onComplete: (score: number) => void;
}

export function CourtroomArgumentsChallenge({ onComplete }: CourtroomArgumentsChallengeProps) {
  const [currentCase] = useState(PERSUASION_CASES[0]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [sentiment, setSentiment] = useState(50); // 0 = Guilty, 100 = Not Guilty
  const [phase, setPhase] = useState<'delivering' | 'objection_incoming' | 'objection_counter' | 'feedback' | 'verdict'>('delivering');
  const [speaker, setSpeaker] = useState<'defense' | 'prosecutor' | 'judge'>('defense');
  const [dialogue, setDialogue] = useState<string>("Court is now in session. The Defense may present their arguments.");
  const [lastFeedback, setLastFeedback] = useState<{ title: string, msg: string, isGood: boolean } | null>(null);
  const [currentObjectionCounters, setCurrentObjectionCounters] = useState<CounterArgument[] | null>(null);

  const { playSfx } = useAudio();

  useEffect(() => {
    // playBgm('intense'); // BGM not implemented yet
    // return () => bgm?.stop();
  }, []);

  const currentSpeechPhase = currentCase.phases[phaseIndex];

  const handleSelectArgument = (option: ArgumentOption) => {
    setSpeaker('defense');
    setDialogue(option.text);
    playSfx('click');

    // Determine if Objection happens
    const roll = Math.random();
    if (roll < option.riskFactor && currentSpeechPhase.objectionCounter) {
      // OBJECTION!
      setTimeout(() => {
        setPhase('objection_incoming');
        playSfx('notification');
        setSpeaker('prosecutor');
        setDialogue("OBJECTION! That statement is completely out of line!");

        // Shuffle counters
        if (currentSpeechPhase.objectionCounter) {
          const shuffled = [...currentSpeechPhase.objectionCounter].sort(() => Math.random() - 0.5);
          setCurrentObjectionCounters(shuffled);
        }

        setTimeout(() => {
          setPhase('objection_counter');
        }, 2000);
      }, 1500);
    } else {
      // Clean land
      const newSentiment = Math.min(100, Math.max(0, sentiment + option.impact));

      setTimeout(() => {
        setSentiment(newSentiment);
        playSfx(option.impact > 0 ? 'success' : 'error');
        setLastFeedback({
          title: option.type === 'logic' ? 'Logical Point Made' : option.type === 'passion' ? 'Jury Swayed' : 'Risky Claim Landed',
          msg: option.impact > 0 ? 'The jury seems receptive to your argument.' : 'That didn\'t land well with the jury.',
          isGood: option.impact > 0
        });
        setPhase('feedback');
      }, 1500);
    }
  };

  const handleCounterSelect = (counter: CounterArgument) => {
    setSpeaker('judge');
    if (counter.isCorrect) {
      setDialogue("Objection Overruled. The defense may proceed. Outstanding legal reasoning, Counselor.");
      playSfx('success');
      setSentiment(prev => Math.min(100, prev + 15)); // Bonus for good counter
      setLastFeedback({
        title: "Objection Overruled!",
        msg: "You successfully defended your argument using sound legal logic.",
        isGood: true
      });
    } else {
      setDialogue("Objection Sustained! The jury will disregard the defense's last statement. Watch yourself, Counselor.");
      playSfx('error');
      setSentiment(prev => Math.max(0, prev - 25)); // Heavy penalty
      setLastFeedback({
        title: "Objection Sustained.",
        msg: "Your legal reasoning was flawed. The jury is doubting your credibility.",
        isGood: false
      });
    }
    setPhase('feedback');
  };

  const handleNextPhase = () => {
    playSfx('click');
    if (phaseIndex < currentCase.phases.length - 1) {
      setPhaseIndex(prev => prev + 1);
      setPhase('delivering');
      setSpeaker('defense');
      setDialogue("Let's move to the next point...");
    } else {
      setPhase('verdict');
      setSpeaker('judge');
      setDialogue(sentiment >= 60 ? "The Jury finds the defendant... NOT GUILTY!" : "The Jury finds the defendant... GUILTY!");
      playSfx(sentiment >= 60 ? 'success' : 'error');
      setTimeout(() => {
        onComplete(sentiment);
      }, 3000);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'logic': return <Brain className="w-4 h-4" />;
      case 'passion': return <Heart className="w-4 h-4" />;
      case 'risk': return <Zap className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'logic': return 'bg-blue-600 hover:bg-blue-500 border-blue-800';
      case 'passion': return 'bg-rose-600 hover:bg-rose-500 border-rose-800';
      case 'risk': return 'bg-amber-600 hover:bg-amber-500 border-amber-800';
      default: return 'bg-gray-600 hover:bg-gray-500 border-gray-800';
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-6 relative font-sans text-slate-900">
      <div className="bg-slate-50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-200 relative h-[700px] flex flex-col">

        {/* Sleek Gradient Accent from top like CrossExam */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-100/50 to-transparent pointer-events-none z-0"></div>

        {/* Case Context / Brief */}
        <AnimatePresence>
          {phaseIndex === 0 && phase === 'delivering' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -20 }}
              className="absolute bottom-[320px] left-10 z-40 w-[90%] max-w-[320px]"
            >
              <div className="bg-white/95 backdrop-blur-xl px-5 py-4 rounded-3xl border border-indigo-100 shadow-xl text-left relative">
                {/* Speech Bubble Pointer */}
                <div className="absolute -bottom-3 left-12 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-white/95 drop-shadow-md"></div>
                <div className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 opacity-80" />
                  Case Brief
                </div>
                <div className="text-slate-700 text-sm font-medium leading-relaxed">{currentCase.description}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sentiment Meter (Jury Belief) */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-3/4 max-w-xl xl:max-w-2xl z-20">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 tracking-wider uppercase px-2 shadow-sm">
            <span>Guilty</span>
            <span>Jury Sentiment</span>
            <span>Not Guilty</span>
          </div>
          <div className="h-6 bg-slate-200 rounded-full border border-slate-300 overflow-hidden relative shadow-inner">
            {/* Threshold markers */}
            <div className="absolute top-0 bottom-0 left-[60%] w-0.5 bg-slate-400 z-10 flex flex-col items-center justify-start">
            </div>
            <motion.div
              className={`h-full relative overflow-hidden ${sentiment >= 60 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'}`}
              initial={{ width: "50%" }}
              animate={{ width: `${sentiment}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite]"></div>
            </motion.div>
          </div>
          <div className="text-center mt-1 text-xs text-slate-500 font-mono font-semibold">Conviction Threshold: 60%</div>
        </div>

        {/* Visual Jury Box */}
        <div className="absolute top-[100px] left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 z-20 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-white/60 shadow-sm mt-4">
          {[...Array(12)].map((_, i) => {
            // Calculate if this juror is "convinced" based on the sentiment
            const threshold = (i / 11) * 100;
            const isConvinced = sentiment > threshold;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, y: isConvinced ? [-1, 1, -1] : 0 }}
                transition={{ delay: i * 0.03, y: { repeat: isConvinced ? Infinity : 0, duration: 2 + Math.random() } }}
                className={`w-8 h-8 rounded-full flex flex-col items-center justify-center text-sm shadow-inner transition-colors duration-500 ${isConvinced ? 'bg-gradient-to-br from-emerald-100 to-green-200 border border-emerald-300' : 'bg-gradient-to-br from-slate-100 to-rose-50 border border-slate-300'
                  }`}
              >
                <span className="transform -translate-y-0.5">{isConvinced ? '😊' : '🤨'}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Objection Splash */}
        <AnimatePresence>
          {phase === 'objection_incoming' && (
            <motion.div
              initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
              animate={{ scale: 1.2, rotate: -5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none backdrop-blur-md bg-slate-900/40"
            >
              <div className="bg-red-600 text-white font-black text-8xl md:text-9xl px-12 py-6 border-8 border-white shadow-[0_0_100px_rgba(220,38,38,0.8)] filter drop-shadow-2xl italic tracking-tighter">
                OBJECTION!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Characters Area */}
        <div className="relative flex-1 flex justify-between items-end px-10 pb-64 z-10 mt-12">
          {/* Player Avatar (Defense) */}
          <motion.div
            animate={{
              scale: speaker === 'defense' ? 1.1 : 0.9,
              opacity: speaker === 'defense' ? 1 : 0.4,
              y: speaker === 'defense' ? -100 : -60,
              filter: speaker === 'defense' ? 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.4))' : 'drop-shadow(0 0 10px rgba(0,0,0,0.1))'
            }}
            className="text-9xl transform scale-x-[-1] transition-all duration-300 relative z-20"
          >
            {currentCase.playerAvatar}
          </motion.div>

          {/* Judge Avatar */}
          <motion.div
            animate={{
              scale: speaker === 'judge' ? 1.2 : 0.8,
              opacity: speaker === 'judge' ? 1 : 0.4,
              y: speaker === 'judge' ? -20 : 0,
              filter: speaker === 'judge' ? 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.4))' : 'drop-shadow(0 0 10px rgba(0,0,0,0.1))'
            }}
            className="text-[10rem] absolute top-[15%] left-[40%] transform -translate-x-1/2 transition-all duration-300 z-10"
          >
            {currentCase.judgeAvatar}
          </motion.div>

          {/* Opponent Avatar (Prosecutor) */}
          <motion.div
            animate={{
              scale: speaker === 'prosecutor' ? 1.1 : 0.9,
              opacity: speaker === 'prosecutor' ? 1 : 0.4,
              y: speaker === 'prosecutor' ? -140 : -100,
              filter: speaker === 'prosecutor' ? 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.4))' : 'drop-shadow(0 0 10px rgba(0,0,0,0.1))'
            }}
            className="text-9xl transition-all duration-300 relative z-20"
          >
            {currentCase.opponentAvatar}
          </motion.div>
        </div>

        {/* Dynamic UI Section */}
        <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center">

          {/* Main Dialogue Box */}
          <div className="w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 p-6 min-h-[140px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] text-center relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[20px] border-b-white/90"></div>
            <div className="max-w-4xl mx-auto">
              <div className={`text-sm font-black mb-1 uppercase tracking-widest flex items-center justify-center gap-2 ${speaker === 'defense' ? 'text-blue-600' : speaker === 'prosecutor' ? 'text-red-600' : 'text-slate-600'}`}>
                <div className={`w-2 h-2 rounded-full ${speaker === 'defense' ? 'bg-blue-500 animate-pulse' : speaker === 'prosecutor' ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></div>
                {speaker === 'defense' ? 'Defense Attorney (You)' : speaker === 'prosecutor' ? currentCase.opponent : 'The Judge'}
              </div>
              <div className="text-slate-800 text-xl md:text-2xl font-bold leading-relaxed">
                "{dialogue}"
              </div>
            </div>
          </div>

          {/* Action Panels based on phase */}
          <div className="w-full bg-slate-100 p-6 min-h-[220px] border-t border-slate-200">
            <div className="max-w-5xl mx-auto">

              {/* Phase: Delivering Speech */}
              {phase === 'delivering' && (
                <>
                  <div className="text-slate-700 font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                    <ArrowRight className="w-5 h-5 text-indigo-500" />
                    {currentSpeechPhase.prompt}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentSpeechPhase.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectArgument(opt)}
                        className={`${getTypeColor(opt.type)} text-left text-white p-4 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all shadow-md group focus:outline-none focus:ring-2 focus:ring-indigo-500/50`}
                      >
                        <div className="flex items-center gap-2 mb-2 text-white/90 text-xs font-bold uppercase tracking-wider">
                          {getTypeIcon(opt.type)}
                          {opt.type} ARGUMENT
                          {opt.riskFactor > 0.5 && <span className="ml-auto bg-red-900/80 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><AlertTriangle className="w-3 h-3" /> HIGH RISK</span>}
                        </div>
                        <div className="text-sm font-semibold leading-snug">"{opt.text}"</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Phase: Counter Objection */}
              {phase === 'objection_counter' && currentObjectionCounters && currentObjectionCounters.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="text-red-600 font-bold mb-4 flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-lg inline-flex border border-red-200 shadow-sm uppercase tracking-wide text-sm">
                    <ShieldAlert className="w-5 h-5" />
                    DEFEND YOUR ARGUMENT: Select the legally sound counter.
                  </div>
                  <div className="flex flex-col gap-3">
                    {currentObjectionCounters.map(counter => (
                      <button
                        key={counter.id}
                        onClick={() => handleCounterSelect(counter)}
                        className="bg-white hover:bg-slate-50 text-left text-slate-800 p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-400 transition-all font-semibold flex items-center gap-4 group shadow-sm hover:shadow-md"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center flex-shrink-0 transition-colors">
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        "{counter.text}"
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Phase: Feedback / Transition */}
              {phase === 'feedback' && lastFeedback && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-2">
                  <div className={`text-2xl font-black uppercase tracking-tight mb-2 flex items-center gap-2 ${lastFeedback.isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {lastFeedback.isGood ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                    {lastFeedback.title}
                  </div>
                  <p className="text-slate-600 text-lg mb-6 font-medium">{lastFeedback.msg}</p>
                  <button
                    onClick={handleNextPhase}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all text-lg flex items-center gap-2 uppercase tracking-widest"
                  >
                    Continue <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


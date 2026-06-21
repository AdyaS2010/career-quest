import { useState, useCallback, useEffect } from 'react';
import { Activity, Eye, Play, Volume2, MessageSquare, TrendingUp, TrendingDown, AlignLeft } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { motion, AnimatePresence } from 'framer-motion';

interface InterviewQuestion {
  id: string;
  text: string;
  type: 'Hardball' | 'Softball' | 'Follow-up' | 'Bizarre';
  interestImpact: number;
  tensionImpact: number;
  guestResponse: string;
}

interface InterviewSubject {
  id: string;
  name: string;
  title: string;
  avatar: string;
  context: string;
  questions: InterviewQuestion[];
}

const SUBJECTS: InterviewSubject[] = [
  {
    id: 'sub-tech',
    name: 'Elara Vance',
    title: 'CEO, Horizon Tech',
    avatar: '👩‍💼',
    context: 'Horizon Tech just recalled their flagship smart-glasses due to "spontaneous heating". The audience wants answers, but Elara is defensive.',
    questions: [
      { id: 'q1', text: "How did Horizon Tech fail to notice the heating issue during testing?", type: 'Hardball', interestImpact: 25, tensionImpact: 35, guestResponse: "We ran extensive tests. This is a rare anomaly affecting less than 0.1% of units." },
      { id: 'q2', text: "What's the vision for Horizon's next big product?", type: 'Softball', interestImpact: -10, tensionImpact: -20, guestResponse: "We're focusing on seamless integration of AR into daily life. It's truly revolutionary." },
      { id: 'q3', text: "But isn't 0.1% still thousands of customers at risk of burns?", type: 'Follow-up', interestImpact: 30, tensionImpact: 40, guestResponse: "We are taking it seriously and offering full refunds. Safety is our top priority." },
      { id: 'q4', text: "Are you personally wearing the glasses right now?", type: 'Bizarre', interestImpact: 40, tensionImpact: 10, guestResponse: "...No, I have contacts in today. But I trust our products." },
      { id: 'q5', text: "Some say you rushed production to beat competitors. Is that true?", type: 'Hardball', interestImpact: 35, tensionImpact: 50, guestResponse: "Absolutely false. We never compromise on our release schedule integrity." },
      { id: 'q6', text: "How has your team handled the stress of the recall?", type: 'Softball', interestImpact: 5, tensionImpact: -15, guestResponse: "It's been tough, but we have a resilient team. We'll bounce back." }
    ]
  },
  {
    id: 'sub-gov',
    name: 'Mayor Sterling',
    title: 'Mayor of Metro City',
    avatar: '👨‍⚖️',
    context: 'A beloved city park is being bulldozed for a shopping mall. Public outcry is massive. The Mayor needs to explain.',
    questions: [
      { id: 'q1', text: "Why destroy a 100-year-old park for another mall?", type: 'Hardball', interestImpact: 30, tensionImpact: 40, guestResponse: "The city needs revenue. This project brings 5,000 jobs and millions in tax dollars." },
      { id: 'q2', text: "What's your favorite memory of playing in that park as a kid?", type: 'Softball', interestImpact: 10, tensionImpact: -30, guestResponse: "I used to feed the ducks there with my grandfather. It's beautiful... but we must look to the future." },
      { id: 'q3', text: "If you love it so much, why not build the mall on the abandoned factory site instead?", type: 'Follow-up', interestImpact: 40, tensionImpact: 45, guestResponse: "The logistics didn't work. The developers insisted on the downtown location." },
      { id: 'q4', text: "Did the developers fund your recent re-election campaign?", type: 'Hardball', interestImpact: 50, tensionImpact: 60, guestResponse: "My campaign donations are public record and completely legal. I resent the implication." },
      { id: 'q5', text: "Do you think malls are even relevant in the age of online shopping?", type: 'Bizarre', interestImpact: 15, tensionImpact: 5, guestResponse: "People still want physical spaces to gather and engage with the community." }
    ]
  }
];

export function InterviewMasterChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'interview' | 'results'>('intro');
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [isLive, setIsLive] = useState(false);

  // Metrics (0-100)
  const [audienceInterest, setInterest] = useState(50);
  const [guestTension, setTension] = useState(20); // If tension hits 100, they walk out!
  const [scoreAccumulator, setScoreAccumulator] = useState(0);

  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [isGuestSpeaking, setIsGuestSpeaking] = useState(false);

  const [interestHistory, setInterestHistory] = useState<number[]>([50]);

  const { playSfx } = useAudio();
  const subject = SUBJECTS[currentSubjectIndex];

  const MAX_QUESTIONS_PER_SUBJECT = 4;

  // Audience Interest Decay & Score accumulation
  useEffect(() => {
    if (!isLive || isGuestSpeaking || !!currentQuestion) return;

    const tick = setInterval(() => {
      // Interest drops by 1 every second of dead air
      setInterest(prev => {
        const newVal = Math.max(0, prev - 2);
        return newVal;
      });
      // Tension slowly drops over time
      setTension(prev => Math.max(0, prev - 1));

    }, 1000);

    return () => clearInterval(tick);
  }, [isLive, isGuestSpeaking, currentQuestion]);

  // Tick score based on interest while live
  useEffect(() => {
    if (!isLive) return;
    const scoreTick = setInterval(() => {
      setScoreAccumulator(prev => prev + (audienceInterest / 100));
    }, 500);
    return () => clearInterval(scoreTick);
  }, [isLive, audienceInterest]);

  // Graph history
  useEffect(() => {
    if (!isLive) return;
    const histTick = setInterval(() => {
      setInterestHistory(prev => [...prev.slice(-30), audienceInterest]);
    }, 1000);
    return () => clearInterval(histTick);
  }, [isLive, audienceInterest]);


  const handleAskQuestion = useCallback((q: InterviewQuestion) => {
    if (isGuestSpeaking || currentQuestion) return;

    playSfx('click');
    setCurrentQuestion(q);
    setQuestionsAsked(prev => [...prev, q.id]);

    // Apply instant impacts
    setInterest(prev => Math.min(100, Math.max(0, prev + q.interestImpact)));
    setTension(prev => Math.min(100, Math.max(0, prev + q.tensionImpact)));

    // Time to display question
    setTimeout(() => {
      setIsGuestSpeaking(true);

      // Time to display answer based on length
      const readingTime = Math.max(3000, q.guestResponse.length * 50);

      setTimeout(() => {
        setIsGuestSpeaking(false);
        setCurrentQuestion(null);

        // End interview logic
        if (guestTension + q.tensionImpact >= 100) {
          playSfx('error');
          endSubject(true); // Walkout
        } else if (questionsAsked.length + 1 >= MAX_QUESTIONS_PER_SUBJECT) {
          endSubject(false);
        }
      }, readingTime);

    }, 2000);

  }, [isGuestSpeaking, currentQuestion, playSfx, guestTension, questionsAsked.length]);

  const endSubject = (walkout: boolean) => {
    setIsLive(false);
    if (walkout) {
      // Heavy penalty for a walkout
      setInterest(0);
      setScoreAccumulator(prev => Math.max(0, prev - 20));
    }

    setTimeout(() => {
      if (currentSubjectIndex < SUBJECTS.length - 1) {
        setCurrentSubjectIndex(prev => prev + 1);
        setQuestionsAsked([]);
        setInterest(50);
        setTension(20);
        setInterestHistory([50]);
        setIsLive(true);
      } else {
        setPhase('results');
        playSfx('complete');
      }
    }, 3000);
  };

  const startGame = () => {
    playSfx('click');
    setPhase('interview');
    setIsLive(true);
  };

  if (phase === 'intro') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Volume2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Interview Master</h2>
                <p className="text-purple-200 font-medium">Media & Communications • Broadcasting</p>
              </div>
            </div>
          </div>
          <div className="p-8">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-xl mb-8">
              <h3 className="font-bold text-purple-900 text-lg mb-2">🎙️ Your Directive: The Anchor Desk</h3>
              <p className="text-purple-800 leading-relaxed">
                You are the host of the nation's top evening news program. You have <strong>two high-profile guests</strong> tonight.
                <br /><br />
                <strong>Your Goal:</strong> Keep the <strong>Audience Interest</strong> as high as possible by asking tough questions.<br />
                <strong>The Catch:</strong> Hard questions increase <strong>Guest Tension</strong>. If tension hits 100%, the guest will walk out, and your ratings will tank! Balance your questions carefully to maximize score.
              </p>
            </div>
            <button onClick={startGame} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xl hover:scale-[1.02] shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-3">
              <Play className="w-6 h-6 fill-current" /> Go Live
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'interview') {
    const availableQuestions = subject.questions.filter(q => !questionsAsked.includes(q.id));

    return (
      <div className="w-full max-w-6xl mx-auto p-4 flex gap-6 h-[80vh]">

        {/* Left Side: The Broadcast Monitor */}
        <div className="w-3/5 flex flex-col gap-4">
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative flex-1 border-[10px] border-slate-900 flex flex-col">

            {/* Live Status Bar */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
              <div className="flex gap-4">
                <div className={`px-4 py-1.5 rounded-md font-black text-sm tracking-wider flex items-center gap-2 ${isLive ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]' : 'bg-slate-700 text-slate-400'}`}>
                  <div className="w-2.5 h-2.5 bg-white rounded-full" /> {isLive ? 'LIVE' : 'OFF AIR'}
                </div>
                <div className="bg-slate-800/80 backdrop-blur-md text-slate-300 px-3 py-1.5 rounded-md font-mono text-sm border border-slate-700">CAM 1 - STUDIO A</div>
              </div>
              <div className="bg-slate-800/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold border border-slate-700 shadow-lg">
                Segment {currentSubjectIndex + 1} of {SUBJECTS.length}
              </div>
            </div>

            {/* Studio Viewport */}
            <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-800 flex justify-center items-end pb-8">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>

              {/* The Guest Avatar */}
              <motion.div
                animate={{ y: isGuestSpeaking ? [0, -10, 0] : 0 }}
                transition={{ repeat: isGuestSpeaking ? Infinity : 0, duration: 2 }}
                className="relative z-10 flex flex-col items-center"
              >
                <div className="text-[140px] drop-shadow-2xl">{subject.avatar}</div>
              </motion.div>

              {/* Desk */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-slate-800 border-t-4 border-indigo-900 transform perspective-1000 rotateX-12 z-0"></div>

              {/* Dialogue Overlays */}
              <AnimatePresence>
                {currentQuestion && !isGuestSpeaking && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="absolute bottom-12 left-10 right-10 bg-indigo-600/90 backdrop-blur-md border border-indigo-400 rounded-2xl p-6 shadow-2xl z-30">
                    <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" /> You (Host)
                    </div>
                    <p className="text-white text-2xl font-medium leading-tight">"{currentQuestion?.text}"</p>
                  </motion.div>
                )}

                {currentQuestion && isGuestSpeaking && (
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="absolute bottom-12 left-10 right-10 bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-2xl p-6 shadow-2xl z-30">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                      <AlignLeft className="w-3 h-3" /> {subject.name}
                    </div>
                    <p className="text-white text-2xl font-medium leading-tight">"{currentQuestion?.guestResponse}"</p>
                  </motion.div>
                )}

                {!isLive && guestTension >= 100 && (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-red-900/80 backdrop-blur-sm z-40">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🚪🚶‍♂️</div>
                      <h2 className="text-4xl font-black text-white tracking-widest uppercase text-shadow-xl">Guest Walkout!</h2>
                      <p className="text-red-200 text-xl mt-2 font-medium">Tension critical. Ratings plummeting.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Lower Third News Ticker */}
            <div className="bg-indigo-900 h-16 flex border-t-4 border-yellow-400 relative z-20">
              <div className="bg-red-600 w-48 flex items-center justify-center shadow-lg z-10 skew-x-[-15deg] -ml-4">
                <span className="text-white font-black text-xl italic tracking-wider skew-x-[15deg] mr-4">NEWS NOW</span>
              </div>
              <div className="flex-1 flex items-center px-6 overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-950">
                <motion.div animate={{ x: [-800, 800] }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="whitespace-nowrap text-white text-xl uppercase tracking-widest flex gap-12">
                  <span>{subject.name} - {subject.title} </span>
                  <span className="text-yellow-400">•</span>
                  <span>{subject.context}</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Producer Control Board */}
        <div className="w-2/5 flex flex-col gap-4">

          {/* Metrics Top Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 rounded-3xl p-5 shadow-xl border border-slate-800">
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-emerald-400" /> Audience Interest
              </h3>
              <div className="flex items-end gap-3 mb-2">
                <span className={`text-4xl font-black ${audienceInterest > 70 ? 'text-emerald-400' : audienceInterest > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(audienceInterest)}%
                </span>
                {audienceInterest > 70 && <TrendingUp className="w-6 h-6 text-emerald-400 mb-1" />}
                {audienceInterest <= 40 && <TrendingDown className="w-6 h-6 text-red-400 mb-1" />}
              </div>
              {/* Mini Graph */}
              <div className="h-12 flex items-end gap-[1px]">
                {interestHistory.map((val, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm transition-all duration-300 ${val > 70 ? 'bg-emerald-500' : val > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ height: `${val}%`, opacity: (i + 1) / interestHistory.length }} />
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-5 shadow-xl border border-slate-800">
              <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-orange-400" /> Guest Tension
              </h3>
              <div className="flex items-end gap-3 mb-3">
                <span className={`text-4xl font-black ${guestTension > 80 ? 'text-red-500' : guestTension > 50 ? 'text-orange-400' : 'text-blue-400'}`}>
                  {Math.round(guestTension)}%
                </span>
              </div>
              {/* Tension bar */}
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${guestTension > 80 ? 'bg-red-500 shadow-[0_0_10px_red]' : guestTension > 50 ? 'bg-orange-400' : 'bg-blue-500'}`} style={{ width: `${guestTension}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Keep below 100% or they walk!</p>
            </div>
          </div>

          {/* Question Selector */}
          <div className="bg-white rounded-3xl p-6 shadow-xl flex-1 flex flex-col border border-slate-200">
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-black text-slate-800 text-xl tracking-wide flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Prompter Queue
              </h3>
              <span className="text-sm font-bold text-slate-500">
                {questionsAsked.length} / {MAX_QUESTIONS_PER_SUBJECT} Asked
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
              {availableQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleAskQuestion(q)}
                  disabled={!isLive || isGuestSpeaking || !!currentQuestion}
                  className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-md transition-all group disabled:opacity-50 disabled:hover:border-slate-100 disabled:hover:bg-slate-50 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider
                                            ${q.type === 'Hardball' ? 'bg-red-100 text-red-700' :
                        q.type === 'Softball' ? 'bg-blue-100 text-blue-700' :
                          q.type === 'Follow-up' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'}`}>
                      {q.type}
                    </div>
                    <div className="flex gap-2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-emerald-600">Int: {q.interestImpact > 0 ? '+' : ''}{q.interestImpact}</span>
                      <span className="text-orange-600">Ten: {q.tensionImpact > 0 ? '+' : ''}{q.tensionImpact}</span>
                    </div>
                  </div>
                  <p className="text-slate-700 font-semibold group-hover:text-indigo-950 transition-colors">"{q.text}"</p>
                </button>
              ))}
              {availableQuestions.length === 0 && (
                <div className="text-center text-slate-500 italic py-10">All questions asked. Awaiting transition.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results Phase
  // Wait, let's make score reliable to 100:
  const finalCalculatedScore = Math.min(100, Math.round(scoreAccumulator));

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="text-6xl mb-4">
          {finalCalculatedScore >= 80 ? '🏆' : finalCalculatedScore >= 50 ? '📺' : '📡'}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Show Wrap-Up!</h2>
        <p className="text-gray-600 mb-8">
          {finalCalculatedScore >= 80
            ? "Incredible ratings! You grilled them perfectly without pushing them over the edge!"
            : finalCalculatedScore >= 50
              ? "A solid show, but the ratings dipped. Try balancing hardballs and softballs better!"
              : "Ouch. The audience fell asleep or the guests walked out. You need more practice at the anchor desk."}
        </p>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8">
          <div className="text-5xl font-black text-indigo-700 mb-1">{finalCalculatedScore}</div>
          <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Final Score (Max 100)</div>
        </div>

        <button onClick={() => onComplete(finalCalculatedScore)} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl text-xl hover:shadow-lg transition-all">
          End Broadcast
        </button>
      </motion.div>
    </div>
  );
}



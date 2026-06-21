import { useState } from 'react';
import { Scale, Search, CheckCircle2, XCircle, FileText, Camera, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

const CASES = [
  {
    id: 'c1',
    title: 'The Missing Contract',
    description: 'Determine which evidence can be used in the breach of contract trial.',
    evidence: [
      {
        id: 'e1',
        type: 'document',
        title: 'Signed Agreement',
        description: 'Original contract from 2023',
        details: 'Signature matches defendant\'s known signature. Date is valid.',
        isAdmissible: true,
        reason: 'Valid original document',
        icon: <FileText className="w-8 h-8 text-blue-600" />
      },
      {
        id: 'e2',
        type: 'photo',
        title: 'Social Media Screenshot',
        description: 'Printout of a tweet',
        details: 'No timestamp visible. Account is unverified.',
        isAdmissible: false,
        reason: 'Unverified hearsay, lacks authentication',
        icon: <Camera className="w-8 h-8 text-purple-600" />
      },
      {
        id: 'e3',
        type: 'testimony',
        title: 'Hearsay Statement',
        description: 'Witness heard from a friend...',
        details: 'Witness has no direct knowledge of the event.',
        isAdmissible: false,
        reason: 'Inadmissible hearsay',
        icon: <MessageSquare className="w-8 h-8 text-orange-600" />
      },
    ]
  }
];

interface EvidenceDetectiveChallengeProps {
  onComplete: (score: number) => void;
}

export function EvidenceDetectiveChallenge({ onComplete }: EvidenceDetectiveChallengeProps) {
  const [currentEvidenceIndex, setCurrentEvidenceIndex] = useState(0);
  const [isInspecting, setIsInspecting] = useState(false);
  const [stampAnimation, setStampAnimation] = useState<'admissible' | 'rejected' | null>(null);
  const [score, setScore] = useState(0);
  const { playSfx } = useAudio();

  const currentCase = CASES[0];
  const currentEvidence = currentCase.evidence[currentEvidenceIndex];

  const handleStamp = (verdict: 'admissible' | 'rejected') => {
    playSfx('click'); // Ideally a heavy stamp sound
    setStampAnimation(verdict);

    const isCorrect = (verdict === 'admissible' && currentEvidence.isAdmissible) ||
      (verdict === 'rejected' && !currentEvidence.isAdmissible);

    if (isCorrect) {
      setScore(prev => prev + 100);
      playSfx('success');
    } else {
      playSfx('error');
    }

    setTimeout(() => {
      setStampAnimation(null);
      setIsInspecting(false);

      if (currentEvidenceIndex < currentCase.evidence.length - 1) {
        setCurrentEvidenceIndex(prev => prev + 1);
      } else {
        const finalScore = Math.round(((score + (isCorrect ? 100 : 0)) / (currentCase.evidence.length * 100)) * 100);
        onComplete(finalScore);
      }
    }, 1500);
  };
  return (
    <div className="max-w-7xl mx-auto p-6 perspective-1000">
      <div className="bg-wood-pattern bg-[#5d4037] rounded-2xl shadow-2xl p-8 min-h-[600px] relative overflow-hidden border-8 border-[#3e2723]">
        {/* Desk Surface Texture */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center mb-8 bg-black/20 p-4 rounded-xl backdrop-blur-sm text-white">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8" />
            <div>
              <h3 className="text-2xl font-bold font-serif">Evidence Detective</h3>
              <p className="text-sm opacity-80">{currentCase.title}</p>
            </div>
          </div>
          <div className="text-xl font-mono">
            Case Files: {currentEvidenceIndex + 1}/{currentCase.evidence.length}
          </div>
        </div>

        {/* Main Desk Area */}
        <div className="relative z-10 flex gap-8 h-[400px]">
          {/* Evidence Folder */}
          <div className="w-1/3 flex flex-col items-center justify-center">
            <div className="w-full h-full bg-[#f5f5dc] rounded-lg shadow-lg rotate-1 transform transition-transform hover:rotate-0 p-6 flex flex-col items-center justify-center border border-[#d7ccc8]">
              <div className="text-gray-400 font-serif text-4xl mb-4">CASE FILE</div>
              <div className="text-gray-500 font-mono text-sm">CONFIDENTIAL</div>
            </div>
          </div>

          {/* Active Evidence Card */}
          <div className="w-1/3 relative perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentEvidence.id}
                initial={{ y: -500, opacity: 0, rotate: Math.random() * 10 - 5 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ x: 500, opacity: 0, rotate: 45 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-full h-full bg-white rounded-lg shadow-2xl p-6 flex flex-col relative"
              >
                <div className="absolute top-4 right-4 text-gray-300">#{currentEvidence.id}</div>

                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="mb-6 p-4 bg-gray-50 rounded-full border-2 border-gray-100">
                    {currentEvidence.icon}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2 font-serif">{currentEvidence.title}</h4>
                  <p className="text-gray-600 mb-4">{currentEvidence.description}</p>

                  {isInspecting ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800"
                    >
                      <div className="font-bold mb-1 flex items-center justify-center gap-2">
                        <Search className="w-4 h-4" /> Inspection Results
                      </div>
                      {currentEvidence.details}
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => { setIsInspecting(true); playSfx('click'); }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 font-semibold transition-colors"
                    >
                      <Search className="w-4 h-4" /> Inspect Details
                    </button>
                  )}
                </div>

                {/* Stamp Animation Overlay */}
                {stampAnimation && (
                  <motion.div
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none`}
                  >
                    <div className={`border-8 rounded-xl p-4 transform -rotate-12 font-black text-4xl uppercase tracking-widest opacity-80 ${stampAnimation === 'admissible'
                      ? 'border-green-600 text-green-600'
                      : 'border-red-600 text-red-600'
                      }`}>
                      {stampAnimation}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tools / Actions */}
          <div className="w-1/3 flex flex-col gap-4 justify-center">
            <button
              onClick={() => handleStamp('admissible')}
              disabled={!!stampAnimation}
              className="group relative h-32 bg-green-600 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center overflow-hidden border-b-8 border-green-800"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
              <CheckCircle2 className="w-12 h-12 text-white mb-2 relative z-10" />
              <span className="text-white font-bold text-xl tracking-wider relative z-10">ADMISSIBLE</span>
            </button>

            <button
              onClick={() => handleStamp('rejected')}
              disabled={!!stampAnimation}
              className="group relative h-32 bg-red-600 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center overflow-hidden border-b-8 border-red-800"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
              <XCircle className="w-12 h-12 text-white mb-2 relative z-10" />
              <span className="text-white font-bold text-xl tracking-wider relative z-10">REJECTED</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Stethoscope, Activity, Thermometer, Search, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  complaint: string;
  avatar: string;
  vitals: {
    hr: number;
    bp: string;
    temp: number;
    o2: number;
  };
}

interface Clue {
  id: string;
  location: 'head' | 'chest' | 'abdomen' | 'limbs';
  tool: 'stethoscope' | 'thermometer' | 'flashlight' | 'hands';
  text: string;
  isAbnormal: boolean;
}

interface Diagnosis {
  id: string;
  name: string;
  description: string;
  requiredClues: string[];
}

const PATIENTS: { patient: Patient; clues: Clue[]; diagnoses: Diagnosis[] }[] = [
  {
    patient: {
      id: 'p1',
      name: 'Robert Chen',
      age: 58,
      gender: 'Male',
      complaint: 'Severe chest pain radiating to arm',
      avatar: '👨🏻',
      vitals: { hr: 110, bp: '160/95', temp: 98.6, o2: 96 },
    },
    clues: [
      { id: 'c1', location: 'chest', tool: 'stethoscope', text: 'Irregular heart rhythm detected', isAbnormal: true },
      { id: 'c2', location: 'chest', tool: 'hands', text: 'Patient winces in pain when chest is pressed', isAbnormal: true },
      { id: 'c3', location: 'head', tool: 'flashlight', text: 'Pupils equal and reactive', isAbnormal: false },
      { id: 'c4', location: 'limbs', tool: 'hands', text: 'Left arm numbness reported', isAbnormal: true },
      { id: 'c5', location: 'head', tool: 'thermometer', text: 'Temperature normal (98.6°F)', isAbnormal: false },
    ],
    diagnoses: [
      { id: 'd1', name: 'Myocardial Infarction', description: 'Heart Attack', requiredClues: ['c1', 'c2', 'c4'] },
      { id: 'd2', name: 'Panic Attack', description: 'Severe anxiety episode', requiredClues: [] },
      { id: 'd3', name: 'Acid Reflux', description: 'Severe heartburn', requiredClues: [] },
    ],
  },
  {
    patient: {
      id: 'p2',
      name: 'Sarah Miller',
      age: 34,
      gender: 'Female',
      complaint: 'High fever and productive cough',
      avatar: '👩🏼',
      vitals: { hr: 95, bp: '120/80', temp: 102.8, o2: 92 },
    },
    clues: [
      { id: 'c6', location: 'chest', tool: 'stethoscope', text: 'Crackles heard in lower right lung', isAbnormal: true },
      { id: 'c7', location: 'head', tool: 'thermometer', text: 'High fever detected (102.8°F)', isAbnormal: true },
      { id: 'c8', location: 'head', tool: 'flashlight', text: 'Throat appears red and inflamed', isAbnormal: true },
      { id: 'c9', location: 'abdomen', tool: 'hands', text: 'Soft, non-tender', isAbnormal: false },
    ],
    diagnoses: [
      { id: 'd4', name: 'Pneumonia', description: 'Lung infection', requiredClues: ['c6', 'c7'] },
      { id: 'd5', name: 'Bronchitis', description: 'Inflammation of bronchial tubes', requiredClues: [] },
      { id: 'd6', name: 'Influenza', description: 'Viral flu', requiredClues: [] },
    ],
  },
];

interface SymptomDetectiveChallengeProps {
  onComplete: (score: number) => void;
}

export function SymptomDetectiveChallenge({ onComplete }: SymptomDetectiveChallengeProps) {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState<'stethoscope' | 'thermometer' | 'flashlight' | 'hands' | null>(null);
  const [discoveredClues, setDiscoveredClues] = useState<string[]>([]);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [score, setScore] = useState(0);
  const [showMissionBrief, setShowMissionBrief] = useState(true);
  const [successDiagnosisId, setSuccessDiagnosisId] = useState<string | null>(null);
  const { playSfx } = useAudio();

  const currentCase = PATIENTS[currentCaseIndex];

  const shuffledDiagnoses = useMemo(() => {
    return [...currentCase.diagnoses].sort(() => Math.random() - 0.5);
  }, [currentCaseIndex]);

  const handleBodyPartClick = (location: 'head' | 'chest' | 'abdomen' | 'limbs') => {
    if (!selectedTool) {
      setFeedback({ type: 'info', message: 'Select a tool first!' });
      return;
    }

    playSfx('click');

    const clue = currentCase.clues.find(c => c.location === location && c.tool === selectedTool);

    if (clue) {
      if (!discoveredClues.includes(clue.id)) {
        setDiscoveredClues([...discoveredClues, clue.id]);
        setFeedback({
          type: clue.isAbnormal ? 'error' : 'success',
          message: `${clue.isAbnormal ? 'ABNORMAL' : 'NORMAL'}: ${clue.text}`
        });
      } else {
        setFeedback({ type: 'info', message: 'Already examined this area with this tool.' });
      }


    } else {
      setFeedback({ type: 'info', message: 'Nothing significant found here with this tool.' });
    }
  };

  const handleDiagnose = (diagnosisId: string) => {
    const correctDiagnosis = currentCase.diagnoses[0]; // First one is always correct in this data structure

    if (diagnosisId === correctDiagnosis.id) {
      // Check if enough clues were found
      const foundRequired = correctDiagnosis.requiredClues.every(id => discoveredClues.includes(id));

      if (foundRequired) {
        playSfx('success');
        const caseScore = Math.max(50, 100 - (discoveredClues.length - correctDiagnosis.requiredClues.length) * 5); // Penalty for unnecessary tests

        // Use a functional update to safely calculate the totally new final score
        setScore(prevScore => {
          const newTotalScore = prevScore + caseScore;

          if (currentCaseIndex < PATIENTS.length - 1) {
            setSuccessDiagnosisId(diagnosisId);
            setTimeout(() => {
              setCurrentCaseIndex(prev => prev + 1);
              setDiscoveredClues([]);
              setSelectedTool(null);
              setShowDiagnosis(false);
              setFeedback(null);
              setSuccessDiagnosisId(null);
            }, 2000);
            return newTotalScore;
          } else {
            setSuccessDiagnosisId(diagnosisId);
            setTimeout(() => onComplete(Math.round(newTotalScore / PATIENTS.length)), 2000);
            return newTotalScore;
          }
        });
      } else {
        setFeedback({ type: 'error', message: 'Correct diagnosis, but you need more evidence!' });
      }
    } else {
      playSfx('error');
      setFeedback({ type: 'error', message: 'Incorrect diagnosis. Review the evidence.' });
      setScore(prev => prev - 10); // Deduct 10 points for a wrong guess, across the entire run
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Symptom Detective</h3>
              <p className="text-gray-600">Case {currentCaseIndex + 1}: {currentCase.patient.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <span className="text-xl">{score}</span>
              <span className="text-sm">PTS</span>
            </div>
            <div className="bg-black rounded-lg p-3 flex items-center gap-4 min-w-[300px]">
              <div className="text-green-500 animate-pulse">
                <Activity className="w-6 h-6" />
              </div>
              <div className="grid grid-cols-4 gap-4 text-xs font-mono text-green-500">
                <div>
                  <div className="text-gray-500">HR</div>
                  <div className="text-lg">{currentCase.patient.vitals.hr}</div>
                </div>
                <div>
                  <div className="text-gray-500">BP</div>
                  <div className="text-lg">{currentCase.patient.vitals.bp}</div>
                </div>
                <div>
                  <div className="text-gray-500">TEMP</div>
                  <div className="text-lg">{currentCase.patient.vitals.temp}°</div>
                </div>
                <div>
                  <div className="text-gray-500">O2</div>
                  <div className="text-lg">{currentCase.patient.vitals.o2}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showMissionBrief && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
              className="bg-blue-100/50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900 relative"
            >
              <button
                onClick={() => { playSfx('click'); setShowMissionBrief(false); }}
                className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 transition-colors p-1"
                title="Dismiss"
              >
                <X size={16} />
              </button>
              <strong>Mission: Patient Triage & Diagnosis</strong><br />
              Use medical tools to examine different body parts and gather clinical evidence.
              <ul className="mt-2 text-xs space-y-1">
                <li>• Select a <strong>Tool</strong> from the left, then click on the patient's body part (Head, Chest, Abdomen, or Limbs).</li>
                <li>• Find at least 3 relevant clues to unlock the diagnosis button.</li>
                <li>• Beware! Checking too many irrelevant areas or making the wrong diagnosis will lower your score!</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-12 gap-6">
          {/* Tools Palette */}
          <div className="col-span-2 space-y-3">
            <h4 className="font-bold text-gray-900 mb-2">Medical Tools</h4>
            {[
              { id: 'stethoscope', icon: <Stethoscope />, label: 'Listen' },
              { id: 'thermometer', icon: <Thermometer />, label: 'Temp' },
              { id: 'flashlight', icon: <Search />, label: 'Examine' },
              { id: 'hands', icon: <Activity />, label: 'Palpate' },
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id as any)}
                className={`w-full p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedTool === tool.id
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                  }`}
              >
                {tool.icon}
                <span className="text-xs font-semibold">{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Body Map */}
          <div className="col-span-6 relative bg-gray-50 rounded-2xl border-2 border-gray-200 p-8 flex items-center justify-center">
            <div className="relative h-[480px] w-[260px] mx-auto mt-4">
              {/* Silhouette Body SVG Representation */}
              <svg viewBox="0 0 200 500" className="w-full h-full drop-shadow-xl overflow-visible">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Head */}
                <g
                  onClick={() => handleBodyPartClick('head')}
                  className="cursor-pointer group"
                >
                  <circle cx="100" cy="60" r="45" fill="#e2e8f0" className="group-hover:fill-blue-200 transition-colors" stroke="#cbd5e1" strokeWidth="3" />
                  <text x="100" y="72" textAnchor="middle" fontSize="38">{currentCase.patient.avatar}</text>
                  <circle cx="100" cy="60" r="45" fill="transparent" className="group-hover:stroke-blue-400 transition-colors" stroke="transparent" strokeWidth="4" filter="url(#glow)" />
                </g>

                {/* Limbs (Back layer basically) */}
                <g
                  onClick={() => handleBodyPartClick('limbs')}
                  className="cursor-pointer group"
                >
                  {/* Left Arm */}
                  <rect x="25" y="115" width="30" height="160" rx="15" fill="#e2e8f0" className="group-hover:fill-blue-200 transition-colors" stroke="#cbd5e1" strokeWidth="3" transform="rotate(15 40 115)" />
                  {/* Right Arm */}
                  <rect x="145" y="115" width="30" height="160" rx="15" fill="#e2e8f0" className="group-hover:fill-blue-200 transition-colors" stroke="#cbd5e1" strokeWidth="3" transform="rotate(-15 160 115)" />
                  {/* Left Leg */}
                  <rect x="65" y="300" width="32" height="180" rx="15" fill="#e2e8f0" className="group-hover:fill-blue-200 transition-colors" stroke="#cbd5e1" strokeWidth="3" />
                  {/* Right Leg */}
                  <rect x="103" y="300" width="32" height="180" rx="15" fill="#e2e8f0" className="group-hover:fill-blue-200 transition-colors" stroke="#cbd5e1" strokeWidth="3" />

                  {/* Invisible hit box for glowing limbs together */}
                  <rect x="15" y="110" width="170" height="380" fill="transparent" className="group-hover:stroke-blue-400 transition-colors" stroke="transparent" strokeWidth="4" filter="url(#glow)" pointerEvents="none" rx="20" />
                </g>

                {/* Chest */}
                <g
                  onClick={() => handleBodyPartClick('chest')}
                  className="cursor-pointer group"
                >
                  <path d="M 60 110 L 140 110 Q 150 110 145 150 L 135 210 L 65 210 L 55 150 Q 50 110 60 110 Z" fill="#e2e8f0" className="group-hover:fill-blue-200 transition-colors" stroke="#cbd5e1" strokeWidth="3" />
                  <path d="M 60 110 L 140 110 Q 150 110 145 150 L 135 210 L 65 210 L 55 150 Q 50 110 60 110 Z" fill="transparent" className="group-hover:stroke-blue-400 transition-colors" stroke="transparent" strokeWidth="4" filter="url(#glow)" pointerEvents="none" />
                </g>

                {/* Abdomen */}
                <g
                  onClick={() => handleBodyPartClick('abdomen')}
                  className="cursor-pointer group"
                >
                  <path d="M 65 210 L 135 210 L 140 310 Q 140 330 100 330 Q 60 330 60 310 Z" fill="#e2e8f0" className="group-hover:fill-blue-200 transition-colors" stroke="#cbd5e1" strokeWidth="3" />
                  <path d="M 65 210 L 135 210 L 140 310 Q 140 330 100 330 Q 60 330 60 310 Z" fill="transparent" className="group-hover:stroke-blue-400 transition-colors" stroke="transparent" strokeWidth="4" filter="url(#glow)" pointerEvents="none" />
                </g>

              </svg>

              {/* Tool Cursor Follower (Visual only, simplified) */}
              {selectedTool && (
                <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow text-xs font-bold text-red-600 border border-red-200">
                  Using: {selectedTool.toUpperCase()}
                </div>
              )}
            </div>

            {/* Feedback Overlay */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-100 text-green-800' :
                    feedback.type === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                >
                  {feedback.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {feedback.type === 'error' && <AlertCircle className="w-5 h-5" />}
                  {feedback.message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Findings & Diagnosis */}
          <div className="col-span-4 flex flex-col h-full">
            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex-1 overflow-y-auto">
              <h4 className="font-bold text-gray-900 mb-3">Clinical Findings</h4>
              {discoveredClues.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  Select a tool and click body parts to examine patient.
                </div>
              ) : (
                <div className="space-y-2">
                  {discoveredClues.map(id => {
                    const clue = currentCase.clues.find(c => c.id === id);
                    if (!clue) return null;
                    return (
                      <div key={id} className={`p-3 rounded-lg border text-sm ${clue.isAbnormal ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}>
                        <div className="font-bold mb-1 capitalize">{clue.location} - {clue.tool}</div>
                        <div className="text-gray-700">{clue.text}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDiagnosis(true)}
              disabled={discoveredClues.length < 3}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              Make Diagnosis
            </button>
          </div>
        </div>
      </div>

      {/* Diagnosis Modal */}
      {showDiagnosis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Diagnosis</h3>
            <div className="grid grid-cols-1 gap-4 mb-6">
              {shuffledDiagnoses.map(diagnosis => {
                const isSuccess = successDiagnosisId === diagnosis.id;

                return (
                  <button
                    key={diagnosis.id}
                    disabled={!!successDiagnosisId}
                    onClick={() => handleDiagnose(diagnosis.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all group flex items-center justify-between ${isSuccess
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-red-500 hover:bg-red-50'
                      }`}
                  >
                    <div>
                      <div className={`font-bold ${isSuccess ? 'text-green-800' : 'text-gray-900 group-hover:text-red-700'}`}>{diagnosis.name}</div>
                      <div className={`text-sm ${isSuccess ? 'text-green-700' : 'text-gray-600'}`}>{diagnosis.description}</div>
                    </div>
                    {isSuccess && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowDiagnosis(false)}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div >
  );
}

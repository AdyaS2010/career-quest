import { useState } from 'react';
import { Calendar, CheckCircle2, FileText, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Treatment {
  id: string;
  name: string;
  type: 'medication' | 'therapy' | 'lifestyle';
  description: string;
  duration: number; // weeks
  icon: string;
}

interface Case {
  id: string;
  patientName: string;
  condition: string;
  description: string;
  labResults: { name: string; value: number; unit: string; normalRange: string }[];
  availableTreatments: Treatment[];
  correctSequence: string[]; // IDs of treatments in order
}

const CASES: Case[] = [
  {
    id: 'c1',
    patientName: 'David Kim',
    condition: 'Type 2 Diabetes',
    description: 'Patient presents with fatigue and increased thirst. Needs a comprehensive management plan.',
    labResults: [
      { name: 'HbA1c', value: 8.5, unit: '%', normalRange: '< 5.7%' },
      { name: 'Fasting Glucose', value: 180, unit: 'mg/dL', normalRange: '70-100' },
    ],
    availableTreatments: [
      { id: 't1', name: 'Metformin', description: 'Oral medication that lowers glucose production in the liver.', type: 'medication', duration: 12, icon: '💊' },
      { id: 't2', name: 'Dietary Changes', description: 'Low carb, high fiber diet to regulate blood sugar.', type: 'lifestyle', duration: 12, icon: '🥗' },
      { id: 't3', name: 'Insulin', description: 'Direct hormone injection for severe, uncontrolled diabetes.', type: 'medication', duration: 4, icon: '💉' },
      { id: 't4', name: 'Exercise Plan', description: 'Daily cardiovascular physical activity.', type: 'lifestyle', duration: 12, icon: '🏃' },
    ],
    correctSequence: ['t2', 't4', 't1'], // Diet/Exercise first, then Metformin
  },
  {
    id: 'c2',
    patientName: 'Maria Garcia',
    condition: 'Hypertension',
    description: 'Patient has consistently high blood pressure readings. First-line therapy and lifestyle adjustments are needed.',
    labResults: [
      { name: 'Systolic BP', value: 155, unit: 'mmHg', normalRange: '< 120' },
      { name: 'Diastolic BP', value: 95, unit: 'mmHg', normalRange: '< 80' },
    ],
    availableTreatments: [
      { id: 't5', name: 'Lisinopril', description: 'ACE inhibitor medication to relax blood vessels.', type: 'medication', duration: 12, icon: '💊' },
      { id: 't6', name: 'Sodium Reduction', description: 'Low salt diet to reduce fluid retention.', type: 'lifestyle', duration: 12, icon: '🧂' },
      { id: 't7', name: 'Stress Therapy', description: 'Counseling to manage stress and anxiety.', type: 'therapy', duration: 8, icon: '🧘' },
      { id: 't8', name: 'Beta Blocker', description: 'Advanced medication slowing heart rate (used if ACE fails).', type: 'medication', duration: 12, icon: '💊' },
    ],
    correctSequence: ['t6', 't7', 't5'], // Lifestyle and stress first, then first-line medication
  },
  {
    id: 'c3',
    patientName: 'James Wilson',
    condition: 'Asthma Exacerbation',
    description: 'Patient experiencing an acute asthma attack. Requires immediate relief followed by long-term management.',
    labResults: [
      { name: 'O2 Saturation', value: 91, unit: '%', normalRange: '> 95%' },
      { name: 'Peak Flow', value: 200, unit: 'L/min', normalRange: '400-600' },
    ],
    availableTreatments: [
      { id: 't9', name: 'Albuterol Inhaler', description: 'Short-acting rescue inhaler for immediate airway opening.', type: 'medication', duration: 1, icon: '💨' },
      { id: 't10', name: 'Inhaled Corticosteroid', description: 'Daily maintenance inhaler to prevent future attacks.', type: 'medication', duration: 12, icon: '🌬️' },
      { id: 't11', name: 'Trigger Avoidance', description: 'Identify and remove environmental allergens.', type: 'lifestyle', duration: 12, icon: '🧹' },
      { id: 't12', name: 'Oral Steroids', description: 'Heavy systemic medication for severe, prolonged attacks.', type: 'medication', duration: 2, icon: '💊' },
    ],
    correctSequence: ['t9', 't10', 't11'], // Rescue first, then maintenance, then lifestyle
  },
];

interface TreatmentPlannerChallengeProps {
  onComplete: (score: number) => void;
}

export function TreatmentPlannerChallenge({ onComplete }: TreatmentPlannerChallengeProps) {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [plan, setPlan] = useState<Treatment[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [problemScores, setProblemScores] = useState<number[]>([]);
  const [showMissionBrief, setShowMissionBrief] = useState(true);
  const { playSfx } = useAudio();

  const currentCase = CASES[currentCaseIndex];

  const handleAddToPlan = (treatment: Treatment) => {
    if (!plan.find(t => t.id === treatment.id)) {
      setPlan([...plan, treatment]);
    }
  };

  const handleRemoveFromPlan = (id: string) => {
    setPlan(plan.filter(t => t.id !== id));
  };

  const handleSubmit = () => {
    if (plan.length === 0) {
      setScore(0);
      setProblemScores(prev => [...prev, 0]);
      setShowResults(true);
      return;
    }

    let caseScore = 0;
    const correctIds = currentCase.correctSequence; // Now acts as correct set
    const currentIds = plan.map(t => t.id);

    let correctCount = 0;
    currentIds.forEach(id => {
      if (correctIds.includes(id)) correctCount++;
    });

    // Each correct item contributes to the base score
    caseScore += (correctCount / correctIds.length) * 100;

    // Penalty for dangerous/unnecessary extra treatments
    const wrongSelectionsCount = currentIds.filter(id => !correctIds.includes(id)).length;
    caseScore -= (wrongSelectionsCount * 20); // 20 pt penalty per wrong choice

    const finalScore = Math.max(0, Math.min(100, Math.round(caseScore)));
    setScore(finalScore);
    setProblemScores(prev => [...prev, finalScore]);
    setShowResults(true);
  };

  const handleNext = () => {
    setShowResults(false);
    if (currentCaseIndex < CASES.length - 1) {
      setPlan([]);
      setCurrentCaseIndex(prev => prev + 1);
    } else {
      const totalScore = problemScores.reduce((a, b) => a + Number(b), 0);
      onComplete(Math.round(totalScore / CASES.length));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Treatment Planner</h3>
              <p className="text-gray-600">Patient: {currentCase.patientName} - {currentCase.condition}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {CASES.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${idx < currentCaseIndex
                  ? 'bg-blue-500'
                  : idx === currentCaseIndex
                    ? 'bg-cyan-500'
                    : 'bg-gray-300'
                  }`}
              />
            ))}
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
              <strong>Mission: Select Patient Treatments</strong><br />
              Read the patient history and lab results. Click on available treatments to add them to the selection. Make sure to choose everything the patient needs, but avoid unnecessary treatments!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-12 gap-6">
          {/* Patient Data & Labs */}
          <div className="col-span-4 space-y-6">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Patient History
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">{currentCase.description}</p>

              <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Lab Results
              </h5>
              <div className="space-y-2">
                {currentCase.labResults.map((lab, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                    <span className="font-medium text-gray-700">{lab.name}</span>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{lab.value} {lab.unit}</div>
                      <div className="text-xs text-gray-500">Normal: {lab.normalRange}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3">Available Treatments</h4>
              <div className="space-y-2">
                {currentCase.availableTreatments.map(treatment => (
                  <button
                    key={treatment.id}
                    onClick={() => handleAddToPlan(treatment)}
                    disabled={plan.some(t => t.id === treatment.id)}
                    className="w-full p-4 bg-white rounded-xl border-2 border-transparent hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex items-start gap-3 text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <span className="text-3xl mt-1">{treatment.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 flex justify-between">
                        {treatment.name}
                        <span className="text-xs font-medium text-gray-500 capitalize bg-gray-100 px-2 py-0.5 rounded-full">{treatment.type}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{treatment.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Treatment Selection */}
          <div className="col-span-8">
            <div className="bg-gray-100 rounded-xl p-6 min-h-[500px] border-2 border-dashed border-gray-300 flex flex-col">
              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Selected Treatments
              </h4>

              <div className="space-y-3 flex-1">
                {plan.length === 0 && (
                  <div className="text-center text-gray-400 py-12">
                    Add treatments from the left panel.
                  </div>
                )}
                {plan.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex items-center gap-4">
                    <span className="text-3xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">{item.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{item.type}</div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="font-bold text-blue-600">{item.duration} Weeks</div>
                      <div className="text-xs text-gray-400">Duration</div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromPlan(item.id)}
                      className="text-red-400 hover:text-red-600 p-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {plan.length > 0 && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Submit Plan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Overlay */}
        {showResults && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="text-6xl mb-4">
                {score >= 80 ? '🌟' : score >= 60 ? '👍' : '⚠️'}
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {score >= 80 ? 'Excellent Plan!' : 'Plan Submitted'}
              </h3>
              <div className="text-5xl font-bold text-blue-600 mb-6">{score}%</div>
              <p className="text-gray-600 mb-6">
                {score >= 80
                  ? 'Great selection! You successfully identified the correct treatments.'
                  : 'Review the guidelines for proper treatment selection.'}
              </p>

              {score < 100 && (
                <div className="bg-blue-50 text-blue-900 p-4 rounded-lg text-sm text-left mb-6 border border-blue-100">
                  <strong className="block mb-2 text-blue-900 border-b border-blue-200 pb-1">Recommended Treatments:</strong>
                  <ul className="list-disc list-inside space-y-1 font-medium">
                    {currentCase.correctSequence.map(id => {
                      const t = currentCase.availableTreatments.find(x => x.id === id);
                      return <li key={id}>{t?.name}</li>;
                    })}
                  </ul>
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors"
              >
                {currentCaseIndex < CASES.length - 1 ? 'Next Patient' : 'Complete Challenge'}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

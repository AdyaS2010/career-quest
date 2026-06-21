import { useState } from 'react';
import { Pill, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

interface Diagnosis {
  id: string;
  name: string;
  description: string;
}

interface Treatment {
  id: string;
  name: string;
  type: 'medication' | 'procedure' | 'lifestyle';
  effectiveness: number;
  safety: number;
  compliance: number;
  contraindications: string[];
  icon: string;
}

interface PatientCase {
  diagnosis: Diagnosis;
  patientProfile: {
    age: number;
    conditions: string[];
    medications: string[];
  };
}

const CASES: PatientCase[] = [
  {
    diagnosis: {
      id: 'd1',
      name: 'Type 2 Diabetes',
      description: 'Patient newly diagnosed with elevated blood glucose levels',
    },
    patientProfile: {
      age: 52,
      conditions: ['Hypertension', 'Obesity'],
      medications: ['Lisinopril'],
    },
  },
  {
    diagnosis: {
      id: 'd2',
      name: 'Bacterial Pneumonia',
      description: 'Community-acquired pneumonia with productive cough',
    },
    patientProfile: {
      age: 34,
      conditions: [],
      medications: [],
    },
  },
];

const TREATMENTS: Record<string, Treatment[]> = {
  d1: [
    {
      id: 't1',
      name: 'Metformin',
      type: 'medication',
      effectiveness: 85,
      safety: 90,
      compliance: 80,
      contraindications: ['kidney disease'],
      icon: '💊',
    },
    {
      id: 't2',
      name: 'Insulin Therapy',
      type: 'medication',
      effectiveness: 95,
      safety: 70,
      compliance: 60,
      contraindications: [],
      icon: '💉',
    },
    {
      id: 't3',
      name: 'Diet & Exercise Plan',
      type: 'lifestyle',
      effectiveness: 70,
      safety: 100,
      compliance: 50,
      contraindications: [],
      icon: '🥗',
    },
    {
      id: 't4',
      name: 'Blood Glucose Monitoring',
      type: 'procedure',
      effectiveness: 60,
      safety: 100,
      compliance: 70,
      contraindications: [],
      icon: '📊',
    },
  ],
  d2: [
    {
      id: 't5',
      name: 'Amoxicillin',
      type: 'medication',
      effectiveness: 80,
      safety: 85,
      compliance: 85,
      contraindications: ['penicillin allergy'],
      icon: '💊',
    },
    {
      id: 't6',
      name: 'Azithromycin',
      type: 'medication',
      effectiveness: 85,
      safety: 90,
      compliance: 90,
      contraindications: [],
      icon: '💊',
    },
    {
      id: 't7',
      name: 'Rest & Hydration',
      type: 'lifestyle',
      effectiveness: 50,
      safety: 100,
      compliance: 80,
      contraindications: [],
      icon: '💧',
    },
    {
      id: 't8',
      name: 'Oxygen Therapy',
      type: 'procedure',
      effectiveness: 70,
      safety: 95,
      compliance: 75,
      contraindications: [],
      icon: '🫁',
    },
  ],
};

interface TreatmentPlannerChallengeProps {
  onComplete: (score: number) => void;
}

export function TreatmentPlannerChallenge({ onComplete }: TreatmentPlannerChallengeProps) {
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedTreatments, setSelectedTreatments] = useState<Treatment[]>([]);
  const [showOutcome, setShowOutcome] = useState(false);
  const [outcomeData, setOutcomeData] = useState<{ effectiveness: number; safety: number; compliance: number } | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  const currentCase = CASES[currentCaseIndex];
  const availableTreatments = TREATMENTS[currentCase.diagnosis.id];

  const handleSelectTreatment = (treatment: Treatment) => {
    if (selectedTreatments.find(t => t.id === treatment.id)) {
      setSelectedTreatments(selectedTreatments.filter(t => t.id !== treatment.id));
    } else {
      setSelectedTreatments([...selectedTreatments, treatment]);
    }
  };

  const hasContraindication = (treatment: Treatment): boolean => {
    const profile = currentCase.patientProfile;
    return treatment.contraindications.some(contra => 
      profile.conditions.some(cond => cond.toLowerCase().includes(contra.toLowerCase()))
    );
  };

  const handleSubmitPlan = () => {
    if (selectedTreatments.length === 0) return;

    // Check for contraindications
    const dangerousTreatments = selectedTreatments.filter(t => hasContraindication(t));
    const safetyPenalty = dangerousTreatments.length * 30;

    // Calculate average scores
    const avgEffectiveness = selectedTreatments.reduce((sum, t) => sum + t.effectiveness, 0) / selectedTreatments.length;
    const avgSafety = Math.max(0, selectedTreatments.reduce((sum, t) => sum + t.safety, 0) / selectedTreatments.length - safetyPenalty);
    const avgCompliance = selectedTreatments.reduce((sum, t) => sum + t.compliance, 0) / selectedTreatments.length;

    // Bonus for combination therapy when appropriate
    const hasMedication = selectedTreatments.some(t => t.type === 'medication');
    const hasLifestyle = selectedTreatments.some(t => t.type === 'lifestyle');
    const combinationBonus = (hasMedication && hasLifestyle) ? 10 : 0;

    const caseScore = Math.round(
      (avgEffectiveness * 0.5) + 
      (avgSafety * 0.3) + 
      (avgCompliance * 0.2) + 
      combinationBonus
    );

    setOutcomeData({
      effectiveness: Math.round(avgEffectiveness),
      safety: Math.round(avgSafety),
      compliance: Math.round(avgCompliance),
    });
    setShowOutcome(true);
    setTotalScore(totalScore + caseScore);

    setTimeout(() => {
      if (currentCaseIndex < CASES.length - 1) {
        setCurrentCaseIndex(currentCaseIndex + 1);
        setSelectedTreatments([]);
        setShowOutcome(false);
        setOutcomeData(null);
      } else {
        const finalScore = Math.round((totalScore + caseScore) / CASES.length);
        onComplete(finalScore);
      }
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Pill className="w-8 h-8 text-red-600" />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Treatment Planner
            </h3>
            <div className="text-sm text-gray-600">
              Case {currentCaseIndex + 1} of {CASES.length}
            </div>
          </div>
        </div>

        {/* Case Information */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-5xl">📋</div>
            <div className="flex-1">
              <div className="text-xl font-bold text-gray-900 mb-2">
                {currentCase.diagnosis.name}
              </div>
              <p className="text-gray-700 mb-3">{currentCase.diagnosis.description}</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">Age:</span>{' '}
                  <span className="text-gray-700">{currentCase.patientProfile.age} years</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Conditions:</span>{' '}
                  <span className="text-gray-700">
                    {currentCase.patientProfile.conditions.length > 0
                      ? currentCase.patientProfile.conditions.join(', ')
                      : 'None'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Current Meds:</span>{' '}
                  <span className="text-gray-700">
                    {currentCase.patientProfile.medications.length > 0
                      ? currentCase.patientProfile.medications.join(', ')
                      : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!showOutcome ? (
          <>
            {/* Treatment Options */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Available Treatments:</h4>
              <div className="grid grid-cols-2 gap-4">
                {availableTreatments.map(treatment => {
                  const isSelected = selectedTreatments.find(t => t.id === treatment.id);
                  const isDangerous = hasContraindication(treatment);

                  return (
                    <button
                      key={treatment.id}
                      onClick={() => handleSelectTreatment(treatment)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? isDangerous
                            ? 'border-red-500 bg-red-50'
                            : 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{treatment.icon}</span>
                          <div>
                            <div className="font-bold text-gray-900">{treatment.name}</div>
                            <div className="text-xs text-gray-600 capitalize">{treatment.type}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className={`w-5 h-5 ${isDangerous ? 'text-red-600' : 'text-green-600'}`} />
                        )}
                      </div>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Effectiveness:</span>
                          <span className="font-semibold text-gray-900">{treatment.effectiveness}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Safety:</span>
                          <span className="font-semibold text-gray-900">{treatment.safety}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Compliance:</span>
                          <span className="font-semibold text-gray-900">{treatment.compliance}%</span>
                        </div>
                      </div>

                      {isDangerous && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          Contraindicated!
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Treatment Plan */}
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Your Treatment Plan:</h4>
              {selectedTreatments.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Select treatments to build your plan</p>
              ) : (
                <div className="space-y-2">
                  {selectedTreatments.map((treatment, index) => (
                    <div key={treatment.id} className="bg-white rounded-lg p-3 flex items-center gap-3">
                      <span className="text-2xl">{treatment.icon}</span>
                      <span className="flex-1 font-semibold text-gray-900">{treatment.name}</span>
                      {hasContraindication(treatment) && (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitPlan}
              disabled={selectedTreatments.length === 0}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Treatment Plan
            </button>
          </>
        ) : (
          /* Patient Outcome */
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <h4 className="text-xl font-bold text-gray-900">Patient Outcome</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{outcomeData?.effectiveness}%</div>
                <div className="text-sm text-gray-600">Effectiveness</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{outcomeData?.safety}%</div>
                <div className="text-sm text-gray-600">Safety</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{outcomeData?.compliance}%</div>
                <div className="text-sm text-gray-600">Compliance</div>
              </div>
            </div>

            <p className="text-center text-gray-700">
              {outcomeData && outcomeData.safety < 70
                ? '⚠️ Warning: Contraindications detected. Patient safety compromised.'
                : outcomeData && outcomeData.effectiveness > 80
                ? '✅ Excellent treatment plan! Patient showing improvement.'
                : '👍 Good treatment plan. Patient responding adequately.'}
            </p>
          </div>
        )}

        {/* Progress */}
        <div className="flex gap-2 justify-center mt-6">
          {CASES.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < currentCaseIndex
                  ? 'bg-green-500'
                  : index === currentCaseIndex
                  ? 'bg-red-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

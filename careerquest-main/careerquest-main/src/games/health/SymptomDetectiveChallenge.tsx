import { useState } from 'react';
import { Stethoscope, Activity, Heart, Thermometer } from 'lucide-react';

interface Patient {
  id: string;
  complaint: string;
  age: number;
  gender: string;
}

interface ExamAction {
  id: string;
  name: string;
  icon: string;
  category: 'vitals' | 'physical' | 'history';
}

interface Clue {
  id: string;
  text: string;
  relevance: number;
}

interface Diagnosis {
  id: string;
  name: string;
  correctFor: string;
}

const PATIENTS: Patient[] = [
  { id: 'p1', complaint: 'Severe chest pain and shortness of breath', age: 58, gender: 'Male' },
  { id: 'p2', complaint: 'High fever and persistent cough for 3 days', age: 34, gender: 'Female' },
  { id: 'p3', complaint: 'Severe headache and sensitivity to light', age: 28, gender: 'Female' },
];

const EXAM_ACTIONS: ExamAction[] = [
  { id: 'vitals', name: 'Check Vitals', icon: '🩺', category: 'vitals' },
  { id: 'heart', name: 'Listen to Heart', icon: '❤️', category: 'physical' },
  { id: 'lungs', name: 'Listen to Lungs', icon: '🫁', category: 'physical' },
  { id: 'temperature', name: 'Check Temperature', icon: '🌡️', category: 'vitals' },
  { id: 'history', name: 'Medical History', icon: '📋', category: 'history' },
  { id: 'physical', name: 'Physical Exam', icon: '🔍', category: 'physical' },
];

const CLUES: Record<string, Record<string, Clue>> = {
  p1: {
    vitals: { id: 'c1', text: 'BP: 160/95 (elevated), Pulse: 110 (rapid)', relevance: 3 },
    heart: { id: 'c2', text: 'Irregular heartbeat detected', relevance: 3 },
    lungs: { id: 'c3', text: 'Clear breath sounds, no congestion', relevance: 1 },
    temperature: { id: 'c4', text: 'Temperature: 98.6°F (normal)', relevance: 1 },
    history: { id: 'c5', text: 'History of high blood pressure, smoker', relevance: 3 },
    physical: { id: 'c6', text: 'Sweating, pale skin, pain radiating to left arm', relevance: 3 },
  },
  p2: {
    vitals: { id: 'c7', text: 'BP: 120/80 (normal), Pulse: 95 (slightly elevated)', relevance: 2 },
    heart: { id: 'c8', text: 'Regular heartbeat, no abnormalities', relevance: 1 },
    lungs: { id: 'c9', text: 'Crackling sounds in lower lobes, congestion present', relevance: 3 },
    temperature: { id: 'c10', text: 'Temperature: 102.8°F (high fever)', relevance: 3 },
    history: { id: 'c11', text: 'No chronic conditions, recent travel abroad', relevance: 2 },
    physical: { id: 'c12', text: 'Productive cough with yellow-green mucus, fatigue', relevance: 3 },
  },
  p3: {
    vitals: { id: 'c13', text: 'BP: 115/75 (normal), Pulse: 88 (normal)', relevance: 1 },
    heart: { id: 'c14', text: 'Regular heartbeat', relevance: 1 },
    lungs: { id: 'c15', text: 'Clear breath sounds', relevance: 1 },
    temperature: { id: 'c16', text: 'Temperature: 99.1°F (slightly elevated)', relevance: 2 },
    history: { id: 'c17', text: 'History of migraines, recent stress', relevance: 2 },
    physical: { id: 'c18', text: 'Stiff neck, photophobia, nausea and vomiting', relevance: 3 },
  },
};

const DIAGNOSES: Diagnosis[] = [
  { id: 'd1', name: 'Acute Myocardial Infarction (Heart Attack)', correctFor: 'p1' },
  { id: 'd2', name: 'Bacterial Pneumonia', correctFor: 'p2' },
  { id: 'd3', name: 'Meningitis', correctFor: 'p3' },
  { id: 'd4', name: 'Common Cold', correctFor: 'none' },
  { id: 'd5', name: 'Anxiety Attack', correctFor: 'none' },
  { id: 'd6', name: 'Asthma Exacerbation', correctFor: 'none' },
];

interface SymptomDetectiveChallengeProps {
  onComplete: (score: number) => void;
}

export function SymptomDetectiveChallenge({ onComplete }: SymptomDetectiveChallengeProps) {
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);
  const [discoveredClues, setDiscoveredClues] = useState<Clue[]>([]);
  const [usedActions, setUsedActions] = useState<string[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [patientScores, setPatientScores] = useState<number[]>([]);

  const currentPatient = PATIENTS[currentPatientIndex];

  const handleExamAction = (action: ExamAction) => {
    if (usedActions.includes(action.id)) return;

    const clue = CLUES[currentPatient.id][action.id];
    if (clue) {
      setDiscoveredClues([...discoveredClues, clue]);
      setUsedActions([...usedActions, action.id]);
      setConfidence(Math.min(100, confidence + clue.relevance * 10));
    }
  };

  const handleDiagnosis = (diagnosis: Diagnosis) => {
    const isCorrect = diagnosis.correctFor === currentPatient.id;
    const efficiency = Math.max(0, 100 - (usedActions.length * 10)); // Fewer tests = better
    const speedBonus = Math.max(0, 20 - usedActions.length * 2);
    
    const patientScore = isCorrect 
      ? Math.min(100, 50 + (efficiency * 0.3) + speedBonus)
      : 20; // Partial credit for trying

    setPatientScores([...patientScores, Math.round(patientScore)]);
    setTotalScore(totalScore + Math.round(patientScore));

    // Move to next patient or complete
    if (currentPatientIndex < PATIENTS.length - 1) {
      setTimeout(() => {
        setCurrentPatientIndex(currentPatientIndex + 1);
        setDiscoveredClues([]);
        setUsedActions([]);
        setConfidence(0);
        setShowDiagnosis(false);
      }, 2000);
    } else {
      setTimeout(() => {
        const finalScore = Math.round((totalScore + Math.round(patientScore)) / PATIENTS.length);
        onComplete(finalScore);
      }, 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Symptom Detective
              </h3>
              <div className="text-sm text-gray-600">
                Patient {currentPatientIndex + 1} of {PATIENTS.length}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Confidence Level</div>
            <div className="text-2xl font-bold text-red-600">{confidence}%</div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-6xl">👤</div>
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <div className="font-bold text-gray-900">
                  {currentPatient.gender}, Age {currentPatient.age}
                </div>
              </div>
              <div className="text-lg text-gray-800 mb-3">
                <span className="font-semibold">Chief Complaint:</span> {currentPatient.complaint}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Examination Actions */}
          <div className="col-span-1">
            <h4 className="font-bold text-gray-900 mb-3">Examination Actions:</h4>
            <div className="space-y-2">
              {EXAM_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => handleExamAction(action)}
                  disabled={usedActions.includes(action.id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    usedActions.includes(action.id)
                      ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-red-200 bg-white hover:border-red-400 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{action.icon}</span>
                    <span className="font-semibold">{action.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Discovered Clues */}
          <div className="col-span-2">
            <h4 className="font-bold text-gray-900 mb-3">Clinical Findings:</h4>
            
            {discoveredClues.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select examination actions to gather clinical data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {discoveredClues.map((clue, index) => (
                  <div
                    key={index}
                    className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 animate-fade-in"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        clue.relevance === 3 ? 'bg-red-500' : clue.relevance === 2 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <p className="text-gray-800">{clue.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {discoveredClues.length >= 3 && !showDiagnosis && (
              <button
                onClick={() => setShowDiagnosis(true)}
                className="w-full mt-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all"
              >
                Make Diagnosis
              </button>
            )}

            {showDiagnosis && (
              <div className="mt-6">
                <h4 className="font-bold text-gray-900 mb-3">Select Diagnosis:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {DIAGNOSES.map(diagnosis => (
                    <button
                      key={diagnosis.id}
                      onClick={() => handleDiagnosis(diagnosis)}
                      className="p-4 border-2 border-gray-200 rounded-xl text-left hover:border-red-400 hover:bg-red-50 transition-all"
                    >
                      <div className="font-semibold text-gray-900">{diagnosis.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 justify-center">
          {PATIENTS.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < currentPatientIndex
                  ? 'bg-green-500'
                  : index === currentPatientIndex
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

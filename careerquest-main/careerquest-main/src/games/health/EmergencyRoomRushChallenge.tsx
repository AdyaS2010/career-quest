import { useState, useEffect } from 'react';
import { AlertCircle, Heart, Clock, Activity } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  symptoms: string;
  vitals: {
    bp: string;
    pulse: number;
    temperature: number;
    respiratoryRate: number;
  };
  severity: 'critical' | 'urgent' | 'standard';
  arrivalTime: number;
}

interface TriageSlot {
  level: 'critical' | 'urgent' | 'standard';
  label: string;
  color: string;
  patients: Patient[];
}

const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'John Smith',
    age: 58,
    symptoms: 'Crushing chest pain, shortness of breath, sweating',
    vitals: { bp: '180/110', pulse: 120, temperature: 98.6, respiratoryRate: 22 },
    severity: 'critical',
    arrivalTime: 0,
  },
  {
    id: 'p2',
    name: 'Maria Garcia',
    age: 34,
    symptoms: 'Broken arm from fall, severe pain',
    vitals: { bp: '125/80', pulse: 95, temperature: 98.2, respiratoryRate: 16 },
    severity: 'urgent',
    arrivalTime: 1,
  },
  {
    id: 'p3',
    name: 'David Lee',
    age: 8,
    symptoms: 'Mild fever, sore throat',
    vitals: { bp: '100/65', pulse: 88, temperature: 100.4, respiratoryRate: 18 },
    severity: 'standard',
    arrivalTime: 2,
  },
];

const WAVE_2_PATIENTS: Patient[] = [
  {
    id: 'p4',
    name: 'Sarah Johnson',
    age: 72,
    symptoms: 'Difficulty breathing, confusion, chest tightness',
    vitals: { bp: '90/60', pulse: 110, temperature: 102.1, respiratoryRate: 28 },
    severity: 'critical',
    arrivalTime: 8,
  },
  {
    id: 'p5',
    name: 'Tom Wilson',
    age: 45,
    symptoms: 'Deep cut on hand, bleeding controlled',
    vitals: { bp: '130/85', pulse: 90, temperature: 98.6, respiratoryRate: 16 },
    severity: 'urgent',
    arrivalTime: 10,
  },
];

interface EmergencyRoomRushChallengeProps {
  onComplete: (score: number) => void;
}

export function EmergencyRoomRushChallenge({ onComplete }: EmergencyRoomRushChallengeProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [waitingRoom, setWaitingRoom] = useState<Patient[]>([...INITIAL_PATIENTS]);
  const [triageSlots, setTriageSlots] = useState<TriageSlot[]>([
    { level: 'critical', label: 'Critical', color: 'red', patients: [] },
    { level: 'urgent', label: 'Urgent', color: 'yellow', patients: [] },
    { level: 'standard', label: 'Standard', color: 'green', patients: [] },
  ]);
  const [treatedPatients, setTreatedPatients] = useState<Patient[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [wave2Added, setWave2Added] = useState(false);

  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        
        // Add second wave of patients
        if (newTime === 8 && !wave2Added) {
          setWaitingRoom(current => [...current, ...WAVE_2_PATIENTS]);
          setWave2Added(true);
        }

        // Check if game should end (20 seconds or all patients triaged)
        if (newTime >= 25) {
          handleGameEnd();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, wave2Added]);

  const handleTriagePatient = (patient: Patient, targetLevel: 'critical' | 'urgent' | 'standard') => {
    // Remove from waiting room
    setWaitingRoom(current => current.filter(p => p.id !== patient.id));

    // Add to triage slot
    setTriageSlots(current =>
      current.map(slot =>
        slot.level === targetLevel
          ? { ...slot, patients: [...slot.patients, patient] }
          : slot
      )
    );

    // Calculate points
    const isCorrect = patient.severity === targetLevel;
    const points = isCorrect ? 15 : -5;
    setScore(current => Math.max(0, current + points));
  };

  const handleTreatPatient = (patient: Patient, slotLevel: 'critical' | 'urgent' | 'standard') => {
    // Remove from triage slot
    setTriageSlots(current =>
      current.map(slot =>
        slot.level === slotLevel
          ? { ...slot, patients: slot.patients.filter(p => p.id !== patient.id) }
          : slot
      )
    );

    // Add to treated list
    setTreatedPatients(current => [...current, patient]);

    // Award points based on priority and timeliness
    const isCritical = patient.severity === 'critical';
    const wasTriagedCorrectly = patient.severity === slotLevel;
    
    let points = 10;
    if (isCritical && wasTriagedCorrectly) points = 25;
    else if (wasTriagedCorrectly) points = 15;

    setScore(current => current + points);
  };

  const handleGameEnd = () => {
    setGameOver(true);
    
    // Calculate final score
    let finalScore = score;

    // Bonus for treating all critical patients correctly
    const criticalSlot = triageSlots.find(s => s.level === 'critical');
    const allCriticalTreated = criticalSlot?.patients.length === 0;
    if (allCriticalTreated) finalScore += 25;

    // Penalty for patients left in waiting
    finalScore -= waitingRoom.length * 5;

    finalScore = Math.max(0, Math.min(100, finalScore));
    
    setTimeout(() => onComplete(finalScore), 2000);
  };

  if (gameOver) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Shift Complete!</h3>
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-3xl font-bold text-green-600">{treatedPatients.length}</div>
                <div className="text-sm text-gray-600">Patients Treated</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{waitingRoom.length}</div>
                <div className="text-sm text-gray-600">Still Waiting</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{score}</div>
                <div className="text-sm text-gray-600">Final Score</div>
              </div>
            </div>
          </div>
          <p className="text-gray-700">
            {score >= 80 ? '🌟 Outstanding emergency response!' : score >= 60 ? '👍 Good triage decisions!' : 'Keep practicing to improve your ER skills!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Emergency Room Rush</h3>
              <div className="text-sm text-gray-600">Triage and treat patients by priority</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <Clock className="w-6 h-6 text-gray-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-gray-900">{timeElapsed}s</div>
            </div>
            <div className="text-center">
              <Activity className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-600">{score}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Waiting Room */}
          <div className="col-span-1">
            <div className="bg-gray-100 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>⏳</span> Waiting Room
              </h4>
              {waitingRoom.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No patients waiting</p>
              ) : (
                <div className="space-y-3">
                  {waitingRoom.map(patient => (
                    <div key={patient.id} className="bg-white rounded-lg p-3 border-2 border-gray-200">
                      <div className="font-semibold text-sm text-gray-900 mb-1">{patient.name}</div>
                      <div className="text-xs text-gray-600 mb-2">{patient.age}yo, {patient.symptoms}</div>
                      <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                        <div>BP: {patient.vitals.bp}</div>
                        <div>HR: {patient.vitals.pulse}</div>
                        <div>Temp: {patient.vitals.temperature}°F</div>
                        <div>RR: {patient.vitals.respiratoryRate}</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleTriagePatient(patient, 'critical')}
                          className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                        >
                          Critical
                        </button>
                        <button
                          onClick={() => handleTriagePatient(patient, 'urgent')}
                          className="flex-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded transition-colors"
                        >
                          Urgent
                        </button>
                        <button
                          onClick={() => handleTriagePatient(patient, 'standard')}
                          className="flex-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors"
                        >
                          Standard
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Triage Areas */}
          <div className="col-span-3 grid grid-cols-3 gap-4">
            {triageSlots.map(slot => (
              <div
                key={slot.level}
                className={`rounded-xl p-4 border-2 ${
                  slot.level === 'critical'
                    ? 'bg-red-50 border-red-300'
                    : slot.level === 'urgent'
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-green-50 border-green-300'
                }`}
              >
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  {slot.level === 'critical' && <span>🚨</span>}
                  {slot.level === 'urgent' && <span>⚠️</span>}
                  {slot.level === 'standard' && <span>✅</span>}
                  {slot.label}
                </h4>
                
                {slot.patients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No patients in {slot.label.toLowerCase()} triage
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slot.patients.map(patient => (
                      <div key={patient.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="font-semibold text-sm text-gray-900 mb-1">{patient.name}</div>
                        <div className="text-xs text-gray-600 mb-2">{patient.symptoms}</div>
                        <button
                          onClick={() => handleTreatPatient(patient, slot.level)}
                          className={`w-full px-3 py-2 text-white text-sm font-semibold rounded transition-colors ${
                            slot.level === 'critical'
                              ? 'bg-red-600 hover:bg-red-700'
                              : slot.level === 'urgent'
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          Treat Patient
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Treated Patients Counter */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
            <Heart className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900">
              {treatedPatients.length} patients treated successfully
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

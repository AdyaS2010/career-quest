import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Clock, Activity, User, HeartPulse, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface Patient {
  id: string;
  name: string;
  condition: string;
  severity: 'critical' | 'urgent' | 'stable';
  timeLeft: number; // Seconds before condition worsens
  avatar: string;
}

const INITIAL_PATIENTS: Patient[] = [
  { id: 'p1', name: 'John Doe', condition: 'Chest Pain', severity: 'critical', timeLeft: 15, avatar: '👴' },
  { id: 'p2', name: 'Jane Smith', condition: 'Deep Laceration', severity: 'urgent', timeLeft: 25, avatar: '👩' },
  { id: 'p3', name: 'Bob Wilson', condition: 'Mild Fever', severity: 'stable', timeLeft: 35, avatar: '👨' },
];

const NEW_PATIENT_POOL: Omit<Patient, 'id' | 'timeLeft'>[] = [
  { name: 'Alice Brown', condition: 'Severe Asthma', severity: 'critical', avatar: '👱' },
  { name: 'Carlos Ray', condition: 'Ankle Sprain', severity: 'stable', avatar: '🧔' },
  { name: 'Diana Prince', condition: 'Head Trauma', severity: 'critical', avatar: '👩' },
  { name: 'Evan Wright', condition: 'Allergic Reaction', severity: 'urgent', avatar: '🧑' },
  { name: 'Fiona Gallagher', condition: 'Stomach Pain', severity: 'urgent', avatar: '👩' },
  { name: 'George Costanza', condition: 'Panic Attack', severity: 'stable', avatar: '👴' },
  { name: 'Hannah Lee', condition: 'Dislocated Shoulder', severity: 'urgent', avatar: '👧' },
  { name: 'Ian Miller', condition: 'Food Poisoning', severity: 'stable', avatar: '👦' },
];

interface Bed {
  id: string;
  type: 'trauma' | 'exam' | 'triage';
  patient: Patient | null;
}

interface EmergencyRoomRushChallengeProps {
  onComplete: (score: number) => void;
}

export function EmergencyRoomRushChallenge({ onComplete }: EmergencyRoomRushChallengeProps) {
  const [waitingRoom, setWaitingRoom] = useState<Patient[]>(INITIAL_PATIENTS);
  const [beds, setBeds] = useState<Bed[]>([
    { id: 'b1', type: 'trauma', patient: null },
    { id: 'b2', type: 'exam', patient: null },
    { id: 'b3', type: 'triage', patient: null },
  ]);
  const [score, setScore] = useState(0);
  const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
  const [gameTime, setGameTime] = useState(60); // Reduced time to 60 seconds
  const [isGameOver, setIsGameOver] = useState(false);
  const [showMissionBrief, setShowMissionBrief] = useState(true);

  const [patientsSpawned, setPatientsSpawned] = useState(3);
  const [patientsHandled, setPatientsHandled] = useState(0);

  const { playSfx } = useAudio();

  const stateRef = useRef({ score, spawned: patientsSpawned });
  const onCompleteRef = useRef(onComplete);
  const playSfxRef = useRef(playSfx);
  const ticksRef = useRef(0);

  useEffect(() => {
    stateRef.current = { score, spawned: patientsSpawned };
    onCompleteRef.current = onComplete;
    playSfxRef.current = playSfx;
  }, [score, patientsSpawned, onComplete, playSfx]);

  // Handle Natural Win Condition
  useEffect(() => {
    if (patientsHandled >= 10 && !isGameOver) { // 3 initial + 7 spawned = 10 total
      setIsGameOver(true);
      setTimeout(() => {
        onComplete(Math.min(100, score + 30)); // Naturally maxes at 100 with a +30 handicap
      }, 500);
    }
  }, [patientsHandled, isGameOver, score, onComplete]);

  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      ticksRef.current += 1;

      setGameTime(prev => {
        if (prev <= 1) {
          setIsGameOver(true);
          onCompleteRef.current(Math.min(100, stateRef.current.score + 30));
          return 0;
        }
        return prev - 1;
      });

      // Update patient timers and possibly spawn new ones
      setWaitingRoom(currentWait => {
        // Decrement their time
        const updatedWait = currentWait.map(p => ({
          ...p,
          timeLeft: Math.max(0, p.timeLeft - 1)
        }));

        const expired = updatedWait.filter(p => p.timeLeft <= 0);
        if (expired.length > 0) {
          playSfxRef.current('error');
          setPatientsHandled(h => h + expired.length);
        }

        const activeWait = updatedWait.filter(p => p.timeLeft > 0);

        // Spawn exactly 1 patient every 4 seconds, up to 7 times (10 total spawned)
        if (stateRef.current.spawned < 10 && ticksRef.current % 4 === 0) {
          const spawnIndex = stateRef.current.spawned - 3;
          const template = NEW_PATIENT_POOL[Math.min(spawnIndex, NEW_PATIENT_POOL.length - 1)];
          const timeLimit = template.severity === 'critical' ? 15 : template.severity === 'urgent' ? 20 : 25;
          const newPatient: Patient = {
            id: `p${Date.now()}`,
            ...template,
            timeLeft: timeLimit,
          };
          playSfxRef.current('notification');
          setPatientsSpawned(s => s + 1);
          return [...activeWait, newPatient];
        }

        return activeWait;
      });

    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver]);

  const handleDragStart = (patient: Patient) => {
    setDraggedPatient(patient);
  };

  const handleDrop = (bedId: string) => {
    if (!draggedPatient) return;

    const bed = beds.find(b => b.id === bedId);
    if (bed && !bed.patient) {
      // Validate placement
      let points = 0;
      if (draggedPatient.severity === 'critical' && bed.type === 'trauma') points = 10;
      else if (draggedPatient.severity === 'urgent' && bed.type === 'exam') points = 10;
      else if (draggedPatient.severity === 'stable' && bed.type === 'triage') points = 10;
      else points = 0; // Suboptimal placement

      setScore(prev => prev + points);
      playSfx(points > 10 ? 'success' : 'click');

      // Move patient to bed
      setBeds(prev => prev.map(b => b.id === bedId ? { ...b, patient: draggedPatient } : b));
      setWaitingRoom(prev => prev.filter(p => p.id !== draggedPatient.id));

      // Auto-discharge after treatment time so beds open
      setTimeout(() => {
        setBeds(prev => prev.map(b => b.id === bedId ? { ...b, patient: null } : b));
        setPatientsHandled(h => h + 1);
      }, 2000);
    }
    setDraggedPatient(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <h3 className="text-2xl font-bold text-gray-900">ER Rush</h3>
          </div>
          <div className="flex gap-6 text-xl font-bold">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-6 h-6" /> {gameTime}s
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Activity className="w-6 h-6" /> {Math.min(100, score)} / 100 pts
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
              <strong>Mission: Emergency Triage</strong><br />
              Drag patients from the waiting room to the appropriate beds before their time runs out!
              <ul className="mt-2 text-xs space-y-1">
                <li>• 🔴 <strong>Critical</strong> patients must go to the <strong>TRAUMA UNIT</strong>.</li>
                <li>• 🟡 <strong>Urgent</strong> patients should go to the <strong>EXAM UNIT</strong>.</li>
                <li>• 🟢 <strong>Stable</strong> patients can go to the <strong>TRIAGE UNIT</strong>.</li>
                <li className="mt-2 text-blue-800 font-semibold">• Note: After the first 3 patients, color-coding is removed! Read their severity manually.</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-12 gap-6 h-[600px]">
          {/* Waiting Room */}
          <div className="col-span-4 bg-gray-100 rounded-xl p-4 overflow-y-auto border-2 border-gray-300">
            <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Waiting Room ({waitingRoom.length})
            </h4>
            <div className="space-y-3">
              <AnimatePresence>
                {waitingRoom.map(patient => (
                  <motion.div
                    key={patient.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    draggable
                    onDragStart={() => handleDragStart(patient)}
                    className={`p-4 rounded-lg shadow-sm cursor-grab active:cursor-grabbing border-l-4 ${['p1', 'p2', 'p3'].includes(patient.id) ? (
                      patient.severity === 'critical' ? 'bg-red-50 border-red-500' :
                        patient.severity === 'urgent' ? 'bg-yellow-50 border-yellow-500' :
                          'bg-green-50 border-green-500'
                    ) : 'bg-gray-50 border-gray-400'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xl">{patient.avatar}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${patient.timeLeft < 10
                        ? (['p1', 'p2', 'p3'].includes(patient.id) ? 'bg-red-200 text-red-800 animate-pulse' : 'bg-gray-300 text-gray-800 animate-pulse')
                        : 'bg-gray-200 text-gray-700'
                        }`}>
                        {patient.timeLeft}s left
                      </span>
                    </div>
                    <div className="font-bold text-gray-900">{patient.name}</div>
                    <div className="text-sm text-gray-600">{patient.condition}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ER Beds */}
          <div className="col-span-8 grid grid-rows-3 gap-4">
            {beds.map(bed => (
              <div
                key={bed.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(bed.id)}
                className={`relative rounded-xl border-2 border-dashed transition-all p-4 flex items-center justify-center ${bed.patient
                  ? 'bg-white border-solid border-blue-500 shadow-md'
                  : 'bg-gray-50 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
              >
                <div className="absolute top-2 left-4 font-bold text-gray-400 uppercase tracking-wider text-sm">
                  {bed.type.toUpperCase()} UNIT
                </div>

                {bed.patient ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="text-4xl mb-2">{bed.patient.avatar}</div>
                    <div className="font-bold text-gray-900">{bed.patient.name}</div>
                    <div className="text-green-600 text-sm font-semibold flex items-center gap-1 justify-center mt-1">
                      <HeartPulse className="w-4 h-4 animate-pulse" /> Treating...
                    </div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-2 mx-auto overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2 }}
                        className="h-full bg-green-500"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2 opacity-20">🛏️</div>
                    <div>Drop Patient Here</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

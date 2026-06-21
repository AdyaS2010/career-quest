import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DndContext, useDraggable, useDroppable, DragEndEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAudio } from '../../contexts/AudioContext';

interface Student {
    id: string;
    name: string;
    age: number;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic';
    trait: string;
    traitIcon: string;
    description: string;
}

interface Activity {
    id: string;
    name: string;
    icon: string;
    bestFor: 'visual' | 'auditory' | 'kinesthetic';
    explanation: string;
}

const ALL_STUDENTS: Student[] = [
    { id: 's1', name: 'Maya', age: 4, learningStyle: 'visual', trait: 'Loves colors & pictures', traitIcon: '🎨', description: 'Maya lights up when she sees colorful illustrations and loves drawing.' },
    { id: 's2', name: 'Liam', age: 5, learningStyle: 'auditory', trait: 'Loves songs & stories', traitIcon: '🎵', description: 'Liam hums melodies all day and remembers every story read aloud.' },
    { id: 's3', name: 'Sofia', age: 4, learningStyle: 'kinesthetic', trait: 'Can\'t sit still!', traitIcon: '🏃', description: 'Sofia learns best when she can move, touch, and build things.' },
    { id: 's4', name: 'Aiden', age: 5, learningStyle: 'visual', trait: 'Pattern spotter', traitIcon: '🔍', description: 'Aiden notices patterns everywhere and loves charts and diagrams.' },
    { id: 's5', name: 'Zara', age: 4, learningStyle: 'auditory', trait: 'Chatterbox', traitIcon: '💬', description: 'Zara loves group discussions and learns by talking things through.' },
    { id: 's6', name: 'Noah', age: 5, learningStyle: 'kinesthetic', trait: 'Little builder', traitIcon: '🧱', description: 'Noah is happiest when constructing things with his hands.' },
    { id: 's7', name: 'Priya', age: 4, learningStyle: 'visual', trait: 'Bookworm', traitIcon: '📚', description: 'Priya gravitates toward picture books and visual puzzles.' },
    { id: 's8', name: 'Ethan', age: 5, learningStyle: 'auditory', trait: 'Rhythm keeper', traitIcon: '🥁', description: 'Ethan taps rhythms on everything and loves rhyming games.' },
    { id: 's9', name: 'Lily', age: 4, learningStyle: 'kinesthetic', trait: 'Explorer', traitIcon: '🌿', description: 'Lily loves outdoor activities and learns through physical exploration.' },
];

const ALL_ACTIVITIES: Activity[] = [
    { id: 'a1', name: 'Art Station', icon: '🖍️', bestFor: 'visual', explanation: 'Art activities engage visual learners by letting them express ideas through colors, shapes, and images.' },
    { id: 'a2', name: 'Picture Books', icon: '📖', bestFor: 'visual', explanation: 'Visual learners absorb information best through illustrated materials and graphic storytelling.' },
    { id: 'a3', name: 'Color Sorting', icon: '🌈', bestFor: 'visual', explanation: 'Sorting by color and pattern engages the visual-spatial skills these learners rely on.' },
    { id: 'a4', name: 'Storytime Circle', icon: '📢', bestFor: 'auditory', explanation: 'Auditory learners thrive when information is delivered through spoken stories and discussion.' },
    { id: 'a5', name: 'Music & Rhymes', icon: '🎶', bestFor: 'auditory', explanation: 'Songs and rhyming games help auditory learners retain information through sound patterns.' },
    { id: 'a6', name: 'Show & Tell', icon: '🗣️', bestFor: 'auditory', explanation: 'Speaking and listening activities play to auditory learners\' strength of processing through verbal communication.' },
    { id: 'a7', name: 'Building Blocks', icon: '🧩', bestFor: 'kinesthetic', explanation: 'Hands-on construction lets kinesthetic learners understand concepts through touch and movement.' },
    { id: 'a8', name: 'Outdoor Play', icon: '🌳', bestFor: 'kinesthetic', explanation: 'Physical activities and nature exploration engage kinesthetic learners who need movement to process information.' },
    { id: 'a9', name: 'Dance & Movement', icon: '💃', bestFor: 'kinesthetic', explanation: 'Movement-based learning helps kinesthetic learners connect physical actions with concepts.' },
];

const PERIODS = [
    { id: 'p1', name: 'Morning Literacy Block', time: '9:00 AM' },
    { id: 'p2', name: 'Midday STEM Centers', time: '11:00 AM' },
    { id: 'p3', name: 'Afternoon Specials', time: '1:30 PM' }
];

interface ClassroomConductorChallengeProps {
    onComplete: (score: number) => void;
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function DraggableStudent({ student, isAssigned }: { student: Student; isAssigned: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: student.id,
        data: student
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : 1,
    } : {};

    if (isAssigned && !isDragging) return null; // Don't show in the unassigned pool if assigned

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing bg-white border-2 border-indigo-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow hover:border-indigo-400 ${isDragging ? 'opacity-80 scale-105 shadow-xl ring-2 ring-indigo-500' : ''}`}
        >
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl mb-2">
                    {student.traitIcon}
                </div>
                <div className="font-bold text-gray-900 text-sm">{student.name}</div>
                <div className="text-xs text-indigo-600 font-medium text-center">{student.trait}</div>
            </div>
            {/* Tooltip on hover */}
            <div className="group relative w-full h-full">
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs rounded-lg p-2 w-48 -top-20 left-1/2 -translate-x-1/2 pointer-events-none z-50">
                    {student.description}
                </div>
            </div>
        </div>
    );
}

function DroppableActivity({ activity, assignedStudents, isEvaluating, results }: { activity: Activity, assignedStudents: Student[], isEvaluating: boolean, results: Record<string, boolean> }) {
    const { setNodeRef, isOver } = useDroppable({
        id: activity.id,
        data: activity
    });

    return (
        <div
            ref={setNodeRef}
            className={`border-2 rounded-2xl p-4 min-h-[160px] transition-colors ${isOver ? 'bg-indigo-50 border-indigo-400 border-dashed' : 'bg-white border-gray-200'
                }`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{activity.icon}</div>
                <div>
                    <h3 className="font-bold text-gray-900">{activity.name}</h3>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {assignedStudents.map((student) => {
                    const isCorrect = results[student.id];
                    return (
                        <div key={student.id} className="relative group">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl shadow-sm border border-indigo-200">
                                {student.traitIcon}
                            </div>

                            {isEvaluating && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}
                                >
                                    {isCorrect ? '✅' : '❌'}
                                </motion.div>
                            )}

                            {/* Evaluation Tooltip */}
                            {isEvaluating && (
                                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg p-2 w-48 -top-full left-1/2 -translate-x-1/2 pointer-events-none z-50 shadow-xl border border-gray-700">
                                    <span className="font-bold block mb-1">{student.name} ({student.learningStyle})</span>
                                    {isCorrect
                                        ? "Perfect match!"
                                        : `Needs ${student.learningStyle} activity. This is for ${activity.bestFor}.`}
                                </div>
                            )}
                        </div>
                    );
                })}
                {assignedStudents.length === 0 && !isOver && (
                    <div className="text-sm text-gray-400 w-full text-center py-4 border-2 border-dashed border-transparent">
                        Drop students here
                    </div>
                )}
            </div>
        </div>
    );
}

export function ClassroomConductorChallenge({ onComplete }: ClassroomConductorChallengeProps) {
    const { playSfx } = useAudio();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0);
    const [assignments, setAssignments] = useState<Record<string, string>>({}); // studentId -> activityId
    const [phase, setPhase] = useState<'assigning' | 'evaluating' | 'results'>('assigning');
    const [results, setResults] = useState<Record<string, boolean>>({});
    const [totalCorrectAcrossPeriods, setTotalCorrectAcrossPeriods] = useState(0);

    const periodData = useMemo(() => {
        return PERIODS.map(() => {
            const shuffledStudents = shuffleArray(ALL_STUDENTS).slice(0, 6); // 6 students per round
            const neededStyles = new Set(shuffledStudents.map(s => s.learningStyle));

            const selected: Activity[] = [];
            neededStyles.forEach(style => {
                const matching = ALL_ACTIVITIES.filter(a => a.bestFor === style && !selected.includes(a));
                if (matching.length > 0) {
                    selected.push(matching[Math.floor(Math.random() * matching.length)]);
                }
            });

            const remaining = shuffleArray(ALL_ACTIVITIES.filter(a => !selected.includes(a)));
            while (selected.length < 6 && remaining.length > 0) {
                selected.push(remaining.pop()!);
            }

            return { students: shuffledStudents, activities: shuffleArray(selected) };
        });
    }, []);

    const { students, activities } = periodData[currentPeriodIndex];
    const unassignedStudents = students.filter(s => !assignments[s.id]);
    const isReadyToEvaluate = Object.keys(assignments).length === students.length && phase === 'assigning';

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.data.current) {
            playSfx('click');
            setAssignments(prev => ({
                ...prev,
                [active.id]: over.id as string
            }));
        } else {
            playSfx('error');
            setAssignments(prev => {
                const next = { ...prev };
                delete next[active.id as string];
                return next;
            });
        }
    };

    const handleEvaluate = () => {
        playSfx('success');
        const newResults: Record<string, boolean> = {};
        let correctCount = 0;

        students.forEach(student => {
            const assignedActivityId = assignments[student.id];
            const activity = activities.find(a => a.id === assignedActivityId)!;
            const isCorrect = activity.bestFor === student.learningStyle;
            newResults[student.id] = isCorrect;
            if (isCorrect) correctCount++;
        });

        setResults(newResults);
        setTotalCorrectAcrossPeriods(prev => prev + correctCount);
        setPhase('evaluating');
    };

    const handleNextPeriod = () => {
        playSfx('click');
        if (currentPeriodIndex < PERIODS.length - 1) {
            setCurrentPeriodIndex(prev => prev + 1);
            setAssignments({});
            setResults({});
            setPhase('assigning');
        } else {
            setPhase('results');
        }
    };

    const finalize = () => {
        const totalStudents = PERIODS.length * 6;
        const totalScore = Math.round((totalCorrectAcrossPeriods / totalStudents) * 100);
        onComplete(totalScore);
    };

    if (phase === 'results') {
        const totalStudents = PERIODS.length * 6;
        const totalScore = Math.round((totalCorrectAcrossPeriods / totalStudents) * 100);

        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">School Day Complete!</h2>
                <div className="text-6xl font-black text-indigo-600 mb-6">{totalScore} PTS</div>
                <p className="text-xl text-gray-700 mb-8">You successfully accommodated students {totalCorrectAcrossPeriods} times out of {totalStudents} total placements.</p>

                <button
                    onClick={() => { playSfx('click'); finalize(); }}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-lg hover:shadow-indigo-500/30 font-xl cursor-pointer"
                >
                    Continue to Next Challenge →
                </button>
            </div>
        );
    }

    const currentPeriod = PERIODS[currentPeriodIndex];

    return (
        <div className="max-w-6xl mx-auto p-6 select-none">
            <div className="mb-6 flex items-center justify-between bg-white rounded-3xl p-5 shadow-sm border border-indigo-100">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-700 text-sm font-bold mb-2">
                        Period {currentPeriodIndex + 1} of {PERIODS.length} • {currentPeriod.time}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentPeriod.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">Assign each student to the station that best fits their learning style.</p>
                </div>
                {isReadyToEvaluate && (
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 cursor-pointer"
                        onClick={handleEvaluate}
                    >
                        Evaluate Layout →
                    </motion.button>
                )}
                {phase === 'evaluating' && (
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 cursor-pointer"
                        onClick={handleNextPeriod}
                    >
                        {currentPeriodIndex < PERIODS.length - 1 ? 'Start Next Period →' : 'Finish Day →'}
                    </motion.button>
                )}
            </div>

            <DndContext
                onDragEnd={phase === 'assigning' ? handleDragEnd : undefined}
                collisionDetection={closestCenter}
                sensors={sensors}
            >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Activity Stations */}
                    <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-200">
                        {activities.map(activity => (
                            <DroppableActivity
                                key={`${currentPeriodIndex}-${activity.id}`}
                                activity={activity}
                                assignedStudents={students.filter(s => assignments[s.id] === activity.id)}
                                isEvaluating={phase === 'evaluating'}
                                results={results}
                            />
                        ))}
                    </div>

                    {/* Student Roster / Waiting Area */}
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex flex-col h-full min-h-[400px]">
                        <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
                            <span>👥 Hallway</span>
                            <span className="ml-auto bg-indigo-200 text-indigo-800 text-xs py-1 px-2 rounded-full font-bold">
                                {unassignedStudents.length} left
                            </span>
                        </h3>

                        <div className="flex-1 space-y-3">
                            {students.map(student => (
                                <DraggableStudent
                                    key={`${currentPeriodIndex}-${student.id}`}
                                    student={student}
                                    isAssigned={!!assignments[student.id]}
                                />
                            ))}
                            {unassignedStudents.length === 0 && (
                                <div className="h-48 flex items-center justify-center border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-400 font-medium">
                                    All students assigned!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DndContext>
        </div>
    );
}

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAudio } from '../../contexts/AudioContext';

interface LessonOption {
    id: string;
    text: string;
    correct: boolean;
    category: 'objectives' | 'strategies' | 'assessments' | 'resources';
}

interface LessonRound {
    subject: string;
    gradeLevel: string;
    topic: string;
    icon: string;
    context: string;
    objectives: LessonOption[];
    strategies: LessonOption[];
    assessments: LessonOption[];
    resources: LessonOption[];
    explanation: string;
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const ROUNDS: LessonRound[] = [
    {
        subject: 'Science', gradeLevel: '5th Grade', topic: 'Ecosystems & Food Chains', icon: '🔬',
        context: 'Your 5th graders just returned from a nature walk where they observed squirrels, hawks, and insects. Now you need to build on that excitement with a lesson about how energy flows through ecosystems.',
        objectives: [
            { id: 'o1', category: 'objectives', text: 'Students will diagram a local food chain showing energy transfer between at least four organisms', correct: true },
            { id: 'o2', category: 'objectives', text: 'Students will memorize the scientific names and classifications of twenty common animals', correct: false },
            { id: 'o3', category: 'objectives', text: 'Students will write a creative fiction story from the perspective of a forest animal', correct: false },
        ],
        strategies: [
            { id: 's2', category: 'strategies', text: 'Have students read the textbook chapter aloud taking turns, then answer review questions individually', correct: false },
            { id: 's1', category: 'strategies', text: 'Hands-on terrarium lab where student teams build mini-ecosystems and predict organism interactions', correct: true },
            { id: 's3', category: 'strategies', text: 'Show a nature documentary and have students take notes on every animal species that appears', correct: false },
        ],
        assessments: [
            { id: 'a3', category: 'assessments', text: 'Assign a comprehensive five-page research essay on a biome of the student\'s choosing', correct: false },
            { id: 'a1', category: 'assessments', text: 'Student teams create and present labeled food web posters using species from the schoolyard', correct: true },
            { id: 'a2', category: 'assessments', text: 'Administer a multiple-choice quiz testing recall of animal names and their habitats', correct: false },
        ],
        resources: [
            { id: 'r2', category: 'resources', text: 'College-level biology reference textbook and printed diagrams of cellular respiration', correct: false },
            { id: 'r3', category: 'resources', text: 'Pre-made coloring worksheets showing generic animals in cartoon-style habitats', correct: false },
            { id: 'r1', category: 'resources', text: 'Terrarium kits, magnifying glasses, an ecosystem field guide, and observation journals', correct: true },
        ],
        explanation: 'A well-aligned lesson connects a measurable objective (diagramming food chains) with an active strategy (building terrariums), an authentic assessment (creating food web posters), and age-appropriate resources. Hands-on discovery keeps students engaged while building genuine scientific thinking skills.',
    },
    {
        subject: 'Mathematics', gradeLevel: '3rd Grade', topic: 'Fractions & Fair Sharing', icon: '🔢',
        context: 'Your 3rd graders have been arguing about how to split snacks equally during group time. Perfect teachable moment! Time to channel that real-world frustration into a lesson on fractions.',
        objectives: [
            { id: 'o5', category: 'objectives', text: 'Students will solve multi-step algebraic equations involving fraction operations and variables', correct: false },
            { id: 'o4', category: 'objectives', text: 'Students will partition shapes and sets into equal parts to identify and compare unit fractions', correct: true },
            { id: 'o6', category: 'objectives', text: 'Students will skip count by twos, fives, and tens up to one hundred without errors', correct: false },
        ],
        strategies: [
            { id: 's4', category: 'strategies', text: 'Fraction pizza party: students cut paper pizzas into equal slices, then trade and compare portions', correct: true },
            { id: 's5', category: 'strategies', text: 'Deliver a structured lecture on fraction theory using PowerPoint slides and abstract number lines', correct: false },
            { id: 's6', category: 'strategies', text: 'Distribute a packet of twenty computation worksheets for silent independent practice all period', correct: false },
        ],
        assessments: [
            { id: 'a5', category: 'assessments', text: 'Administer a timed fifty-question computation test with fraction addition and subtraction problems', correct: false },
            { id: 'a6', category: 'assessments', text: 'Have each student deliver a five-minute oral presentation on the historical origins of fractions', correct: false },
            { id: 'a4', category: 'assessments', text: 'Fraction gallery walk: student pairs solve real-world sharing problems using fraction manipulatives', correct: true },
        ],
        resources: [
            { id: 'r4', category: 'resources', text: 'Fraction circles, pattern blocks, paper plates for cutting, and "fair sharing" scenario cards', correct: true },
            { id: 'r5', category: 'resources', text: 'Scientific calculators and a pre-algebra workbook designed for middle school students', correct: false },
            { id: 'r6', category: 'resources', text: 'A high school geometry textbook and printed coordinate plane worksheets with decimals', correct: false },
        ],
        explanation: 'For young learners, fractions must be concrete and tactile. Paper pizza cutting makes abstract concepts visible, partner gallery walks build collaborative skills, and manipulatives let students physically explore equal parts. This is far more effective than lectures or worksheets — children understand fractions when they can touch and see them.',
    },
    {
        subject: 'English Language Arts', gradeLevel: '7th Grade', topic: 'Persuasive Writing', icon: '✍️',
        context: 'The school board just proposed eliminating recess for middle schoolers to add more test prep time. Your students are fired up. Channel that energy into a persuasive writing unit that teaches argument structure!',
        objectives: [
            { id: 'o8', category: 'objectives', text: 'Students will practice precise handwriting by copying model paragraphs from the board into notebooks', correct: false },
            { id: 'o7', category: 'objectives', text: 'Students will construct a persuasive paragraph with a clear claim, cited evidence, and logical reasoning', correct: true },
            { id: 'o9', category: 'objectives', text: 'Students will silently read an assigned novel for the full class period and write a brief journal entry', correct: false },
        ],
        strategies: [
            { id: 's8', category: 'strategies', text: 'Teacher dictates model essay paragraphs word-for-word as students transcribe and highlight key phrases', correct: false },
            { id: 's7', category: 'strategies', text: 'Mini-debate on the recess issue followed by a structured writing workshop with peer brainstorming', correct: true },
            { id: 's9', category: 'strategies', text: 'Distribute grammar worksheets focused on comma splice rules and sentence fragment correction drills', correct: false },
        ],
        assessments: [
            { id: 'a8', category: 'assessments', text: 'Give a standardized spelling and vocabulary test covering the twenty most difficult words from the unit', correct: false },
            { id: 'a7', category: 'assessments', text: 'Peer review using a detailed rubric, revision based on feedback, and final persuasive letter submission', correct: true },
            { id: 'a9', category: 'assessments', text: 'Assign a fill-in-the-blank grammar quiz testing identification of parts of speech in sample sentences', correct: false },
        ],
        resources: [
            { id: 'r8', category: 'resources', text: 'A classroom set of dictionaries and thesauruses for individual vocabulary reference during writing', correct: false },
            { id: 'r7', category: 'resources', text: 'Argument graphic organizers, sample persuasive essays from real publications, and peer review rubrics', correct: true },
            { id: 'r9', category: 'resources', text: 'A pack of first-grade level sight word flashcards and basic sentence-building manipulative strips', correct: false },
        ],
        explanation: 'Persuasive writing develops critical thinking and civic engagement. Starting with a real debate activates prior knowledge and passion, structured writing workshops provide scaffolding, peer review builds revision skills, and graphic organizers help students structure arguments logically. The recess topic gives students authentic investment in their writing.',
    },
    {
        subject: 'Social Studies', gradeLevel: '8th Grade', topic: 'Civil Rights Movement', icon: '🗽',
        context: 'Students read a news article about a modern protest last week and started comparing it to historical movements. Build on their curiosity with a deep dive into the Civil Rights era using authentic primary sources.',
        objectives: [
            { id: 'o11', category: 'objectives', text: 'Students will correctly memorize and recite the exact dates of thirty key civil rights events in order', correct: false },
            { id: 'o10', category: 'objectives', text: 'Students will analyze primary sources to explain the causes, strategies, and lasting impacts of key civil rights events', correct: true },
            { id: 'o12', category: 'objectives', text: 'Students will neatly color and label a political map of the United States showing all fifty state capitals', correct: false },
        ],
        strategies: [
            { id: 's10', category: 'strategies', text: 'Structured academic controversy: small groups analyze speeches, photographs, and letters from the era, then debate significance', correct: true },
            { id: 's11', category: 'strategies', text: 'Students independently read the assigned textbook chapter and answer the ten end-of-chapter comprehension questions', correct: false },
            { id: 's12', category: 'strategies', text: 'Screen a two-hour Hollywood drama film set in the 1960s and assign a brief reaction paragraph for homework', correct: false },
        ],
        assessments: [
            { id: 'a11', category: 'assessments', text: 'Administer a fifty-question true-or-false quiz testing recall of specific dates and names from the unit', correct: false },
            { id: 'a10', category: 'assessments', text: 'Students create a multimedia timeline connecting events with their causes, key figures, strategies, and lasting impacts', correct: true },
            { id: 'a12', category: 'assessments', text: 'Distribute a crossword puzzle and word search worksheet using civil rights vocabulary terms from the glossary', correct: false },
        ],
        resources: [
            { id: 'r11', category: 'resources', text: 'A single outdated textbook from 1998 that covers the entire 20th century in one brief summary chapter', correct: false },
            { id: 'r10', category: 'resources', text: 'Digitized primary source documents, historical photographs, audio recordings of speeches, and timeline templates', correct: true },
            { id: 'r12', category: 'resources', text: 'A folder of random internet printouts without source citations or author attribution for student reading', correct: false },
        ],
        explanation: 'Teaching the Civil Rights Movement demands authentic primary sources over textbooks. Structured academic controversy develops analytical skills and empathy, multimedia timelines require synthesis thinking, and authentic documents bring history alive. Connecting to modern events makes the content relevant and shows students that history shapes today\'s world.',
    },
];

const CATEGORIES = ['objectives', 'strategies', 'assessments', 'resources'] as const;
const CATEGORY_LABELS: Record<string, { label: string; icon: string; description: string }> = {
    objectives: { label: 'Learning Objective', icon: '🎯', description: 'What should students be able to do?' },
    strategies: { label: 'Teaching Strategy', icon: '📋', description: 'How will you deliver the content?' },
    assessments: { label: 'Assessment Method', icon: '📝', description: 'How will you measure learning?' },
    resources: { label: 'Resources & Materials', icon: '🧰', description: 'What tools are needed?' },
};

interface LessonPlanLabChallengeProps {
    onComplete: (score: number) => void;
}

function DraggableOption({ option, onRemove }: { option: LessonOption, onRemove?: () => void }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: option.id,
        data: option
    });

    const style = {
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`cursor-grab active:cursor-grabbing relative p-3 text-sm bg-white rounded-xl shadow-sm border-2 transition-colors group ${isDragging ? 'border-indigo-400' : 'border-gray-200 hover:border-indigo-300'
                }`}
        >
            <div className="flex gap-2">
                <span className="text-xl flex-shrink-0">{CATEGORY_LABELS[option.category].icon}</span>
                <span className="text-gray-800">{option.text}</span>
            </div>
            {onRemove && !isDragging && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

function DroppableSlot({ category, assignedOption, isEvaluating }: { category: 'objectives' | 'strategies' | 'assessments' | 'resources', assignedOption: LessonOption | null, isEvaluating: boolean }) {
    const { setNodeRef, isOver } = useDroppable({
        id: category, // Drop zone ID matches the category
        data: { category }
    });

    const info = CATEGORY_LABELS[category];

    return (
        <div
            ref={setNodeRef}
            className={`border-2 rounded-2xl p-4 transition-all min-h-[140px] flex flex-col ${isOver ? 'bg-indigo-50 border-indigo-400 border-dashed scale-[1.02]' : 'bg-gray-50 border-gray-200'
                }`}
        >
            <div className="font-bold text-gray-700 flex items-center gap-2 mb-2">
                <span className="text-xl">{info.icon}</span>
                {info.label}
                {isEvaluating && assignedOption && (
                    <span className="ml-auto text-xl">
                        {assignedOption.correct ? '✅' : '❌'}
                    </span>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {assignedOption ? (
                    <div className="text-sm font-medium text-gray-900 border-l-4 border-indigo-500 pl-3 py-1 bg-white p-2 rounded shadow-sm">
                        {assignedOption.text}
                    </div>
                ) : (
                    <div className="text-sm text-gray-400 text-center border-2 border-dashed border-gray-300 rounded-xl py-6">
                        Drop {info.label} block here
                    </div>
                )}
            </div>
        </div>
    );
}

export function LessonPlanLabChallenge({ onComplete }: LessonPlanLabChallengeProps) {
    const { playSfx } = useAudio();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const shuffledRounds = useMemo(() => {
        return shuffleArray(ROUNDS.map(round => ({
            ...round,
            allOptions: shuffleArray([
                ...round.objectives,
                ...round.strategies,
                ...round.assessments,
                ...round.resources
            ])
        })));
    }, []);

    const [currentRound, setCurrentRound] = useState(0);
    const [assignments, setAssignments] = useState<Record<string, LessonOption>>({});
    const [phase, setPhase] = useState<'building' | 'evaluating' | 'final'>('building');
    const [roundScores, setRoundScores] = useState<number[]>([]);
    const [activeDragItem, setActiveDragItem] = useState<LessonOption | null>(null);

    const round = shuffledRounds[currentRound];

    // Remaining unassigned blocks
    const availableBlocks = useMemo(() => {
        const assignedIds = Object.values(assignments).map(a => a.id);
        return round.allOptions.filter(opt => !assignedIds.includes(opt.id));
    }, [round, assignments]);

    const isComplete = CATEGORIES.every(cat => !!assignments[cat]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragItem(active.data.current as LessonOption);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = event;
        if (!over) return;

        const draggedOption = active.data.current as LessonOption;
        const targetCategory = over.id as 'objectives' | 'strategies' | 'assessments' | 'resources';

        // Enforce that you can only drop into matching category slot!
        if (draggedOption.category !== targetCategory) {
            playSfx('error');
            return;
        }

        playSfx('click');
        setAssignments(prev => ({
            ...prev,
            [targetCategory]: draggedOption // Overwrites if one was already there
        }));
    };

    const handleEvaluate = () => {
        playSfx('success');
        let correctCount = 0;

        CATEGORIES.forEach(cat => {
            const assigned = assignments[cat];
            if (assigned && assigned.correct) correctCount++;
        });

        setPhase('evaluating');
        setRoundScores(prev => [...prev, correctCount]);
    };

    const handleNextRound = () => {
        playSfx('click');
        if (currentRound < shuffledRounds.length - 1) {
            setCurrentRound(prev => prev + 1);
            setAssignments({});
            setPhase('building');
        } else {
            setPhase('final');
        }
    };

    if (phase === 'final') {
        const totalCorrect = roundScores.reduce((sum, s) => sum + s, 0);
        const totalPossible = shuffledRounds.length * CATEGORIES.length;
        const finalScore = Math.round((totalCorrect / totalPossible) * 100);

        return (
            <div className="max-w-4xl mx-auto p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Lesson Plan Lab Report</h2>
                    <p className="text-lg text-gray-600">{totalCorrect} of {totalPossible} components aligned correctly</p>
                    <div className="text-5xl font-bold text-indigo-600 mt-4">{finalScore}%</div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-4">
                    {shuffledRounds.map((r, i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">{r.icon} {r.topic}</h3>
                            <p className="text-sm text-gray-600 mb-3">{r.explanation}</p>
                            <div className="font-bold text-indigo-600">Score: {roundScores[i]}/4</div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => { playSfx('click'); onComplete(finalScore); }}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-lg hover:shadow-indigo-500/30 font-xl cursor-pointer"
                    >
                        Finish Challenge →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 select-none h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 mb-6 bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 flex gap-6 items-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl">
                    {round.icon}
                </div>
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-full text-indigo-700 text-xs font-bold mb-2">
                        Lesson {currentRound + 1} of {shuffledRounds.length}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-none mb-1">{round.gradeLevel} {round.subject}</h2>
                    <p className="text-gray-500">{round.topic}</p>
                </div>
                <div className="ml-auto w-1/3 bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-sm text-indigo-900">
                    <span className="font-bold">Scenario:</span> {round.context}
                </div>
            </div>

            {/* DND Workspace */}
            <DndContext
                onDragStart={handleDragStart}
                onDragEnd={phase === 'building' ? handleDragEnd : undefined}
                collisionDetection={closestCenter}
                sensors={sensors}
            >
                <div className="flex-1 flex gap-6 min-h-0">

                    {/* Left Panel: Scrambled Inventory */}
                    <div className="w-1/3 bg-gray-50 rounded-3xl border border-gray-200 p-5 flex flex-col overflow-hidden">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center justify-between">
                            <span>🧩 Component Blocks</span>
                            <span className="bg-white px-2 py-1 rounded text-xs border">Drag to Blueprint</span>
                        </h3>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {phase === 'building' && availableBlocks.map(opt => (
                                <DraggableOption key={opt.id} option={opt} />
                            ))}
                            {phase === 'building' && availableBlocks.length === 0 && (
                                <div className="text-center text-gray-400 py-10">All options used! Evaluate plan.</div>
                            )}
                            {phase === 'evaluating' && (
                                <div className="bg-white p-5 rounded-2xl border-2 border-indigo-100 text-sm h-full">
                                    <h4 className="font-bold text-indigo-900 mb-2">💡 Why This Matters:</h4>
                                    <p className="text-gray-700">{round.explanation}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Blueprint Timeline */}
                    <div className="flex-1 bg-white rounded-3xl border border-indigo-100 p-6 flex flex-col shadow-sm relative">
                        <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center">
                            📐 Lesson Plan Blueprint
                            {isComplete && phase === 'building' && (
                                <motion.button
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={handleEvaluate}
                                    className="ml-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md text-sm cursor-pointer"
                                >
                                    Evaluate Lesson Plan →
                                </motion.button>
                            )}
                            {phase === 'evaluating' && (
                                <motion.button
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={handleNextRound}
                                    className="ml-auto px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md text-sm cursor-pointer"
                                >
                                    Proceed to Next Lesson →
                                </motion.button>
                            )}
                        </h3>

                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <DroppableSlot category="objectives" assignedOption={assignments['objectives'] || null} isEvaluating={phase === 'evaluating'} />
                            <DroppableSlot category="strategies" assignedOption={assignments['strategies'] || null} isEvaluating={phase === 'evaluating'} />
                            <DroppableSlot category="assessments" assignedOption={assignments['assessments'] || null} isEvaluating={phase === 'evaluating'} />
                            <DroppableSlot category="resources" assignedOption={assignments['resources'] || null} isEvaluating={phase === 'evaluating'} />
                        </div>
                    </div>

                </div>

                <DragOverlay dropAnimation={null}>
                    {activeDragItem ? (
                        <div className="cursor-grabbing relative p-3 text-sm bg-white rounded-xl opacity-90 scale-105 shadow-xl ring-2 ring-indigo-500 border-2 border-indigo-400 flex gap-2">
                            <span className="text-xl flex-shrink-0">{CATEGORY_LABELS[activeDragItem.category].icon}</span>
                            <span className="text-gray-800">{activeDragItem.text}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

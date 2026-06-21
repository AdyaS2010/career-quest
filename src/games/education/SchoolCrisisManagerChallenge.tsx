import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '../../contexts/AudioContext';

interface CrisisResponse {
    id: string;
    text: string;
    score: number;
    outcome: string;
    principle: string;
}

interface Crisis {
    id: string;
    title: string;
    icon: string;
    urgency: 'critical' | 'high' | 'medium';
    from: string;
    timestamp: string;
    description: string;
    context: string;
    responses: CrisisResponse[];
    posX: number;
    posY: number;
}

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const CRISES: Crisis[] = [
    {
        id: 'c1', posX: 25, posY: 75,
        title: '⚠️ Safety Concern: Wet Floor in Hallway',
        icon: '🚨',
        urgency: 'critical',
        from: 'Mr. Rodriguez, Custodian',
        timestamp: '7:42 AM',
        context: 'A custodian discovered the issue during his morning rounds. Classes start at 8:00 AM.',
        description: 'A pipe burst overnight in the B-wing hallway. The floor is soaked and slippery — you can see standing water near the lockers. Students start arriving in 18 minutes. The custodian has started mopping but says it will take at least an hour to fully dry.',
        responses: [
            {
                id: 'r1b', text: 'Post "Wet Floor" caution signs at both ends of the hallway and send an email reminding students to walk carefully in that area',
                score: 10, outcome: 'One student slips and bruises their knee despite the signs. A parent calls demanding to know why the area wasn\'t physically blocked off. You spend the morning handling an incident report instead of your other priorities.',
                principle: 'Caution signs alone are insufficient for major hazards. Young students often ignore warnings when rushing to class, making physical barriers necessary for serious safety risks.'
            },
            {
                id: 'r1a', text: 'Block off B-wing entirely with physical barriers, redirect all students to alternate entrances, and send a mass notification to teachers about adjusted routes',
                score: 30, outcome: 'Students are safely rerouted without incident. Teachers appreciate the proactive communication and adjust their morning routines smoothly. The custodial team finishes repairs uninterrupted by foot traffic.',
                principle: 'Student safety is always the #1 priority in school administration. Immediately isolating hazards and proactively communicating changes prevents injuries, liability, and disruption.'
            },
            {
                id: 'r1c', text: 'Ask the custodian to speed up the cleanup and trust that he\'ll have it handled before most students arrive at the building',
                score: 0, outcome: 'The custodian does his best but can\'t finish in time. Multiple students walk through the flooded hallway, tracking water into classrooms. A teacher reports the unsafe condition to the principal, who questions why you didn\'t intervene.',
                principle: 'Administrators must take direct ownership of safety issues rather than delegating without oversight. "Hope it works out" is never an acceptable safety strategy.'
            }
        ]
    },
    {
        id: 'c2', posX: 70, posY: 85,
        title: '📞 Angry Parent Call: Bullying Complaint',
        icon: '📱',
        urgency: 'high',
        from: 'Mrs. Chen (Parent of Mei, 6th grade)',
        timestamp: '8:15 AM',
        context: 'Mrs. Chen has called the front office twice before about social issues involving her daughter.',
        description: 'Mrs. Chen calls, visibly upset, explaining that her daughter Mei has been systematically excluded from group activities by the same three classmates for over three weeks. She says the classroom teacher acknowledged the issue but hasn\'t taken concrete action. Mrs. Chen is considering filing a formal complaint with the school board if nothing changes today.',
        responses: [
            {
                id: 'r2a', text: 'Listen actively to her full account, validate that her concern is serious, and schedule a same-day meeting with the teacher, school counselor, and the families involved',
                score: 30, outcome: 'Mrs. Chen feels genuinely heard and agrees to the collaborative meeting. The counselor identifies an underlying social dynamics issue and implements a structured inclusion plan. The teacher adjusts group formation strategies going forward.',
                principle: 'Active listening plus a clear, immediate action plan de-escalates parent concerns effectively. Involving counselors addresses root causes — not just surface symptoms — and builds lasting trust with families.'
            },
            {
                id: 'r2c', text: 'Reassure Mrs. Chen that some social conflict is a normal part of middle school development and that Mei will likely work through it on her own with time',
                score: 0, outcome: 'Mrs. Chen is furious at being dismissed and files a formal complaint with the district that evening. The situation escalates to a superintendent-level investigation into how your school handles bullying reports.',
                principle: 'Dismissing or normalizing repeated social exclusion is never appropriate. Systematic exclusion can constitute bullying under most school policies and requires documented adult intervention, not minimization.'
            },
            {
                id: 'r2b', text: 'Apologize sincerely for the frustration and promise to speak with the classroom teacher about the situation at some point this week when schedules align',
                score: 10, outcome: 'Mrs. Chen feels dismissed by the vague timeline and lack of concrete steps. She emails the school board that evening detailing the school\'s inaction. The principal asks why you didn\'t respond with more urgency to a repeat complaint.',
                principle: 'Vague promises without specific timelines or concrete action plans signal to parents that their concerns aren\'t being taken seriously. Repeat complaints especially require documented, immediate follow-through.'
            }
        ]
    },
    {
        id: 'c3', posX: 65, posY: 75,
        title: '🏫 Teacher Absence: No Sub Available',
        icon: '👩‍🏫',
        urgency: 'high',
        from: 'Ms. Williams, School Secretary',
        timestamp: '7:55 AM',
        context: 'This is already the third sub shortage this month. Teacher morale around coverage has been declining.',
        description: 'Ms. Jackson, the 4th grade teacher, called in sick with no advance notice. The substitute teacher pool is completely empty — there are no certified subs available anywhere in the district today. Her class of 28 students arrives in 35 minutes. Mr. Kim, the other 4th grade teacher, has offered to help but already has 26 students of his own.',
        responses: [
            {
                id: 'r3c', text: 'Set up Ms. Jackson\'s class in the auditorium with educational videos related to their current unit and assign a paraprofessional to supervise for the day',
                score: 5, outcome: 'Students are supervised but learning is minimal. Parents discover the "movie day" approach and several complain about lost instructional time. The principal reminds you that emergency coverage plans should still prioritize meaningful learning activities.',
                principle: 'Even during staffing emergencies, students deserve meaningful learning time. Videos should be a carefully considered last resort, not the default first response to coverage shortages.'
            },
            {
                id: 'r3a', text: 'Distribute Ms. Jackson\'s students evenly across three grade-level classrooms, provide each teacher with emergency lesson plans, and personally cover one class period yourself',
                score: 30, outcome: 'Each teacher absorbs 9-10 additional students, keeping class sizes manageable and learning on track. Your presence during one period boosts teacher morale and demonstrates leadership. Students experience a productive day despite the disruption.',
                principle: 'Distributing students across multiple classrooms minimizes individual burden. Administrators stepping into the classroom during crises shows servant leadership and keeps instructional operations running smoothly.'
            },
            {
                id: 'r3b', text: 'Combine Ms. Jackson\'s 28 students with Mr. Kim\'s 26 students into one large classroom for the day since Mr. Kim already volunteered to help cover',
                score: 10, outcome: 'Mr. Kim struggles to manage 54 students in a room designed for 30. Meaningful instruction is impossible, behavior issues multiply, and Mr. Kim is visibly exhausted and frustrated by dismissal time. He\'s less likely to volunteer for coverage again.',
                principle: 'Classes exceeding 40 students are nearly unmanageable for a single teacher. Splitting the coverage load across several classrooms is always preferable to overwhelming one willing volunteer.'
            }
        ]
    },
    {
        id: 'c4', posX: 80, posY: 80,
        title: '💰 Budget Alert: Field Trip Funding Gap',
        icon: '📊',
        urgency: 'medium',
        from: 'Mrs. Patel, PTA President',
        timestamp: '8:30 AM',
        context: 'This trip connects directly to the 6th grade science standards and has been planned for two months.',
        description: 'The 6th grade science field trip to the regional nature center is scheduled for next Friday, but $800 in funding is still missing. The PTA can contribute $300. The remaining gap exists because 12 students from low-income families cannot afford the $25 per-student fee. Mrs. Patel needs a final decision today to confirm or cancel the reservation.',
        responses: [
            {
                id: 'r4b', text: 'Send a letter home to the 12 families explaining the cost and asking them to fundraise individually, since the other families already paid their children\'s share',
                score: 5, outcome: 'Three families can\'t come up with the money despite trying. Their children have to sit in another classroom during the trip and feel visibly excluded. A parent files an equity complaint with the superintendent\'s office.',
                principle: 'Asking low-income families to individually fundraise deepens existing inequity and stigmatizes students. Schools should never exclude children from educational opportunities based solely on family financial circumstances.'
            },
            {
                id: 'r4c', text: 'Cancel the field trip entirely for all students to avoid any fairness concerns — if some kids can\'t go, nobody should go so that no one feels singled out',
                score: 10, outcome: 'All students miss an enriching hands-on science experience. The teacher is disappointed after spending weeks integrating the trip into curriculum plans. Families who already paid request refunds, creating more administrative work.',
                principle: 'Canceling an educational experience punishes everyone to "solve" a solvable problem. Creative funding approaches can preserve both equity and the learning opportunity without requiring any student to miss out.'
            },
            {
                id: 'r4a', text: 'Use discretionary funds to cover the remaining gap and create an anonymous "sponsored seat" program so donors can support students without anyone knowing who needed help',
                score: 30, outcome: 'All 12 students are fully covered without any embarrassment or stigma. The anonymous sponsorship model proves so effective that it\'s adopted school-wide for all future field trips and activities.',
                principle: 'Equity in education means proactively removing financial barriers from learning experiences. Anonymous sponsorship programs preserve student dignity while ensuring every child gets equal access to enrichment opportunities.'
            }
        ]
    },
    {
        id: 'c5', posX: 25, posY: 30,
        title: '⚡ Student Conflict: Cafeteria Confrontation',
        icon: '🤝',
        urgency: 'critical',
        from: 'Coach Davis, Lunch Supervisor',
        timestamp: '8:05 AM (incident occurred yesterday)',
        context: 'Both students have clean disciplinary records. Other students filmed the incident on their phones.',
        description: 'Two 7th graders, Marcus and Devon, got into a shoving match in the cafeteria yesterday during lunch over a basketball dispute. Coach Davis separated them quickly — neither was injured. However, several students filmed the incident and the videos are now circulating on social media with inflammatory captions. Both boys are in school today and their friend groups are taking sides.',
        responses: [
            {
                id: 'r5b', text: 'Issue both students an immediate three-day out-of-school suspension as required by the school\'s zero-tolerance policy on physical altercations between students',
                score: 10, outcome: 'Both students fall behind on three days of classwork and feel the punishment was disproportionate to a brief shoving match. The root conflict over the basketball game is never addressed, so tension persists when they return. The social media situation continues to escalate unchecked.',
                principle: 'Zero-tolerance suspensions remove students from learning without resolving underlying conflicts. Research consistently shows that exclusionary discipline worsens behavior problems and doesn\'t teach conflict resolution skills.'
            },
            {
                id: 'r5c', text: 'Since nobody was seriously hurt and Coach Davis already handled the physical separation, monitor the situation informally and step in only if another incident occurs between them',
                score: 0, outcome: 'Without adult intervention, the social media drama intensifies and friend groups polarize. Two days later, a much larger confrontation erupts involving six students. Parents demand to know why administration didn\'t address the situation after the first warning signs appeared.',
                principle: 'All physical conflicts require prompt, documented intervention regardless of severity. "Minor" incidents frequently escalate when left unaddressed, and social media can rapidly amplify school conflicts beyond the building walls.'
            },
            {
                id: 'r5a', text: 'Meet individually with each student to hear their perspective, contact both families, facilitate a restorative justice conference, and hold a grade-level assembly on digital citizenship',
                score: 30, outcome: 'Both boys share their sides and participate in a guided restorative conversation. The underlying basketball dispute is resolved through mediation. The assembly opens an important school-wide conversation about the real-world impact of filming and sharing peer conflicts online.',
                principle: 'Restorative justice helps students repair harm and learn accountability rather than just receiving punishment. Addressing the social media dimension teaches critical digital citizenship skills that students need in today\'s connected world.'
            }
        ]
    },
    {
        id: 'c6', posX: 70, posY: 20,
        title: '📸 PR Crisis: Unapproved Photo Shoot',
        icon: '📷',
        urgency: 'high',
        from: 'Ms. Baker, Yearbook Advisor',
        timestamp: '1:10 PM',
        context: 'A local business is trying to use the school for an ad without permission.',
        description: 'A local car dealership sent a mascot and a photographer onto the football field during P.E. class. They are taking promotional photos with students in the background for a social media contest. They did not sign in at the front office or clear this with administration.',
        responses: [
            {
                id: 'r6b', text: 'Let them finish quickly since local businesses sponsor the school, but remind them to sign in next time',
                score: 0, outcome: 'Photos of students are posted online without parental consent. Parents are outraged by the security breach and unauthorized photography. The district issues a formal reprimand.',
                principle: 'Student privacy and campus security are non-negotiable. Unauthorized adults cannot interact with or photograph students on campus, regardless of their community standing.'
            },
            {
                id: 'r6a', text: 'Immediately dispatch security to escort them to the front office, demand they delete photos containing students, and review camera footage to see how they bypassed the front gate',
                score: 30, outcome: 'The photographer is intercepted. Photos are deleted, protecting student privacy. The security audit reveals a propped-open side gate, which is promptly secured. The business formally apologizes.',
                principle: 'Immediate containment of campus security breaches is vital. Protecting student likenesses and conducting follow-up security audits prevents future unauthorized access.'
            },
            {
                id: 'r6c', text: 'Call the dealership owner and ask them to please blur the students\' faces before posting the photos online',
                score: 10, outcome: 'The owner agrees, but the photographer still successfully bypassed all school security protocols without being challenged. Staff feel the administration isn\'t taking trespassing seriously.',
                principle: 'Addressing the symptom (photos) without addressing the root cause (a security breach) leaves the campus vulnerable. Trespassing requires immediate physical intervention, not just a phone call.'
            }
        ]
    },
    {
        id: 'c7', posX: 85, posY: 45,
        title: '🤧 Health Emergency: Allergic Reaction',
        icon: '🩺',
        urgency: 'critical',
        from: 'Mr. Thompson, Science Teacher',
        timestamp: '10:45 AM',
        context: 'A student with known allergies is having a reaction, and the nurse is off-campus for an emergency.',
        description: 'During a lab, a 10th-grade student begins exhibiting signs of a severe allergic reaction (hives, wheezing). The school nurse had to step out to handle a district medical supply issue 10 minutes ago. The student\'s medical file indicates they have an EpiPen stored in the clinic.',
        responses: [
            {
                id: 'r7c', text: 'Tell the teacher to have another student walk the breathless student down to the front office to wait for an ambulance',
                score: 0, outcome: 'The student collapses in the hallway. Valuable time is lost. Emergency responders arrive to a critical situation that could have been mitigated. The school faces immense legal liability.',
                principle: 'Never move a student experiencing a severe medical emergency if it can be avoided, and never send them with a peer. Treatment must be brought to the student immediately.'
            },
            {
                id: 'r7b', text: 'Call 911 immediately and tell the teacher to keep the student calm while waiting for paramedics to arrive',
                score: 10, outcome: 'Paramedics arrive in 8 minutes, but the student\'s condition worsens significantly while waiting. The parents argue that the school should have administered the prescribed emergency medication on-site.',
                principle: 'While calling 911 is correct, schools must also act directly when emergency protocols (like an EpiPen) are in place. Waiting for 911 without using available life-saving measures is negligent.'
            },
            {
                id: 'r7a', text: 'Call 911, grab the student\'s EpiPen from the clinic, and sprint to the classroom to administer it yourself or assist a trained teacher in doing so',
                score: 30, outcome: 'The EpiPen is administered promptly, stabilizing the student until paramedics arrive. The student recovers fully. The crisis highlights the need for backup medical coverage when the nurse is out.',
                principle: 'Medical emergencies require immediate, decisive action utilizing available emergency medical protocols. Administrators must be trained and willing to act in life-saving situations.'
            }
        ]
    },
    {
        id: 'c8', posX: 70, posY: 50,
        title: '🔥 Facility Alert: Chemistry Fire Alarm',
        icon: '🧯',
        urgency: 'critical',
        from: 'Automated Fire System',
        timestamp: '11:30 AM',
        context: 'The main alarm panel is flashing red for the Science Wing.',
        description: 'The fire alarm has suddenly triggered. There was no scheduled drill. A teacher in the Science wing just called the front office saying it was an accident involving a Bunsen burner, the fire is already put out with an extinguisher, and there is no danger.',
        responses: [
            {
                id: 'r8a', text: 'Proceed with a full school evacuation immediately as per protocol, then let the fire department officially clear the building before allowing anyone back inside',
                score: 30, outcome: 'The school evacuates calmly. The fire department verifies the fire is completely extinguished and the air is clear of chemical fumes before sounding the all-clear. Staff appreciate the adherence to safety protocols.',
                principle: 'Never override a fire alarm based on a single verbal report. Evacuation protocols exist precisely because situations can be more dangerous than initially perceived (e.g., hidden embers, toxic fumes).'
            },
            {
                id: 'r8b', text: 'Use the PA system to tell students to stay in their classrooms since it was a false alarm, and manually silence the alarm panel to stop the noise',
                score: 0, outcome: 'The fire department arrives to find students still inside. The fire chief issues a massive citation to the school. A local news station runs a story about the administration overriding fire safety protocols.',
                principle: 'Silencing alarms or halting evacuations during an active trigger is illegal in most jurisdictions and highly dangerous. Trusting a single informal report over a systemic alarm is a catastrophic failure of safety leadership.'
            },
            {
                id: 'r8c', text: 'Evacuate only the Science wing, leaving the rest of the school in their classrooms to avoid disrupting the entire day\'s schedule',
                score: 5, outcome: 'Confusion ensues as some staff evacuate and others don\'t. The fire department is furious that the building wasn\'t fully cleared. You spend weeks rebuilding trust with parents regarding emergency competency.',
                principle: 'Partial evacuations during a full-building alarm create chaos and compromise safety. When the alarm sounds, the protocol must apply universally to ensure 100% accountability.'
            }
        ]
    }
];

interface SchoolCrisisManagerChallengeProps {
    onComplete: (score: number) => void;
}

export function SchoolCrisisManagerChallenge({ onComplete }: SchoolCrisisManagerChallengeProps) {
    const { playSfx } = useAudio();

    // Shuffle options once
    const shuffledCrises = useMemo(() => {
        return shuffleArray(CRISES.map(crisis => ({
            ...crisis,
            responses: shuffleArray(crisis.responses),
        })));
    }, []);

    const [gameClock, setGameClock] = useState(0);
    const [spawnCount, setSpawnCount] = useState(0);
    const [activeCrises, setActiveCrises] = useState<(Crisis & { timeRemaining: number })[]>([]);
    const [handledCrises, setHandledCrises] = useState<{ crisis: Crisis; response: CrisisResponse | null; score: number }[]>([]);

    const [phase, setPhase] = useState<'playing' | 'reading' | 'feedback' | 'final'>('playing');
    const [selectedCrisis, setSelectedCrisis] = useState<Crisis | null>(null);
    const [feedback, setFeedback] = useState<{ response: CrisisResponse | null; principle: string; outcome: string } | null>(null);

    const [streak, setStreak] = useState(0);

    // Main Clock & Expiration Loop
    useEffect(() => {
        if (phase !== 'playing') return;

        const interval = setInterval(() => {
            setGameClock(prev => prev + 1);

            setActiveCrises(prevActive => {
                let nextActive = prevActive.map(c => ({ ...c, timeRemaining: c.timeRemaining - 1 }));

                const expired = nextActive.filter(c => c.timeRemaining <= 0);
                if (expired.length > 0) {
                    playSfx('error');
                    setHandledCrises(h => [...h, ...expired.map(c => ({
                        crisis: c,
                        response: null,
                        score: 0
                    }))]);
                    setStreak(0); // Reset streak on expiry
                }
                return nextActive.filter(c => c.timeRemaining > 0);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [phase, playSfx]);

    // Spawning Loop
    useEffect(() => {
        if (phase !== 'playing') return;

        if (spawnCount < CRISES.length) {
            const targetTime = spawnCount * 5 + 1;
            if (gameClock >= targetTime) {
                // Play a distinct "new email" style notification
                setTimeout(() => playSfx('click'), 100);

                setActiveCrises(a => [...a, { ...shuffledCrises[spawnCount], timeRemaining: 15 }]);
                setSpawnCount(s => s + 1);
            }
        } else if (handledCrises.length === CRISES.length) {
            setPhase('final');
        }
    }, [gameClock, phase, spawnCount, shuffledCrises, handledCrises.length, playSfx]);

    const handleSelectCrisis = (crisis: Crisis) => {
        playSfx('click');
        setSelectedCrisis(crisis);
        setActiveCrises(prev => prev.filter(c => c.id !== crisis.id));
        setPhase('reading');
    };

    const handleRespond = (response: CrisisResponse) => {
        const isExcellent = response.score >= 25;
        playSfx(isExcellent ? 'success' : 'error');

        if (isExcellent) {
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }

        // Apply bonus points if on a high streak
        const streakBonus = isExcellent && streak >= 2 ? 10 : 0;
        const finalScore = response.score + streakBonus;

        setFeedback({ response, principle: response.principle, outcome: response.outcome });
        setPhase('feedback');
        setHandledCrises(prev => [...prev, { crisis: selectedCrisis!, response, score: finalScore }]);
    };

    const handleResume = () => {
        playSfx('click');
        setSelectedCrisis(null);
        setFeedback(null);
        if (handledCrises.length === CRISES.length) {
            setPhase('final');
        } else {
            setPhase('playing');
        }
    };

    const totalScore = handledCrises.reduce((sum, h) => sum + h.score, 0);
    const maxScore = CRISES.length * 30;
    const finalScorePercentage = Math.min(100, Math.round((totalScore / maxScore) * 100)) || 0;

    if (phase === 'final') {
        const expiredCount = handledCrises.filter(h => h.response === null).length;

        return (
            <div className="max-w-4xl mx-auto p-6 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-10 shadow-xl border border-indigo-100">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Shift Complete</h2>
                    <div className="text-7xl font-black text-indigo-600 mb-6">{finalScorePercentage}%</div>

                    <div className="flex justify-center gap-8 mb-8 text-lg font-medium">
                        <div className="bg-gray-50 px-6 py-3 rounded-2xl">
                            <span className="text-gray-500 block text-sm">Crises Handled</span>
                            <span className="text-2xl text-gray-900">{handledCrises.length - expiredCount}/{CRISES.length}</span>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 rounded-2xl">
                            <span className="text-gray-500 block text-sm">Missed/Expired</span>
                            <span className="text-2xl text-red-600">{expiredCount}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { playSfx('click'); onComplete(finalScorePercentage); }}
                        className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl rounded-2xl transition-colors shadow-lg hover:shadow-indigo-500/30 cursor-pointer"
                    >
                        Review Results & Continue →
                    </button>
                </motion.div>
            </div>
        );
    }

    if (phase === 'feedback' && feedback && selectedCrisis) {
        const isGood = feedback.response && feedback.response.score >= 25;

        return (
            <div className="max-w-3xl mx-auto p-6 text-center">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-3xl p-8 border-4 bg-white shadow-2xl ${isGood ? 'border-green-400' : 'border-amber-400'}`}>
                    <div className="text-6xl mb-4">{isGood ? '✅' : '⚠️'}</div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">{isGood ? 'Excellent Call' : 'Room for Improvement'}</h2>

                    <div className="bg-gray-50 rounded-2xl p-6 text-left mb-6 border border-gray-100">
                        <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">Outcome</h4>
                        <p className="text-gray-700 text-lg leading-relaxed">{feedback.outcome}</p>
                    </div>

                    <div className="bg-indigo-50 rounded-2xl p-6 text-left mb-8 border border-indigo-100">
                        <h4 className="font-bold text-indigo-900 text-sm uppercase tracking-wider mb-2">Leadership Principle</h4>
                        <p className="text-indigo-800 text-lg leading-relaxed font-medium">{feedback.principle}</p>
                    </div>

                    <button
                        onClick={handleResume}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl transition-all cursor-pointer shadow-md active:scale-95"
                    >
                        Resume Shift
                    </button>
                </motion.div>
            </div>
        );
    }

    if (phase === 'reading' && selectedCrisis) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-xl text-center font-bold text-sm mb-4 border border-yellow-200 shadow-sm inline-flex mx-auto items-center justify-center w-full">
                        ⏸️ Shift Paused — Read carefully
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl">{selectedCrisis.icon}</span>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedCrisis.title}</h2>
                                <div className="text-sm text-gray-500 font-medium">From: {selectedCrisis.from} • {selectedCrisis.timestamp}</div>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic mb-6 border-l-4 border-indigo-400">
                            Context: {selectedCrisis.context}
                        </div>

                        <p className="text-lg text-gray-800 leading-relaxed font-medium whitespace-pre-line">
                            {selectedCrisis.description}
                        </p>
                    </div>

                    <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wider mb-4 ml-2">Choose your response:</h3>

                    <div className="space-y-3">
                        {selectedCrisis.responses.map(resp => (
                            <button
                                key={resp.id}
                                onClick={() => handleRespond(resp)}
                                className="w-full p-5 text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md transition-all cursor-pointer font-medium text-gray-800"
                            >
                                {resp.text}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    const stressLevel = Math.min(100, activeCrises.length * 25);
    const isExtremeStress = activeCrises.some(c => c.timeRemaining <= 4);

    // Inbox Phase Component
    return (
        <motion.div
            animate={isExtremeStress ? { x: [-2, 2, -2, 2, 0], y: [-1, 1, -1, 1, 0] } : {}}
            transition={{ repeat: isExtremeStress ? Infinity : 0, duration: 0.4 }}
            className={`max-w-4xl mx-auto p-6 select-none transition-colors duration-500 ${isExtremeStress ? 'bg-red-50/50 rounded-3xl -m-2 p-8' : ''}`}
        >
            {/* STRESS METER */}
            <div className="mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-gray-700 uppercase tracking-widest text-xs">Campus Stress Level</span>
                    <span className={`font-black text-xl ${stressLevel >= 75 ? 'text-red-500' : 'text-gray-900'}`}>{stressLevel}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                        animate={{ width: `${stressLevel}%` }}
                        className={`h-full rounded-full ${stressLevel >= 75 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            stressLevel >= 50 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                                'bg-gradient-to-r from-green-400 to-emerald-500'
                            }`}
                    />
                </div>
            </div>

            <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl mb-6 flex items-center justify-between border-b-4 border-indigo-500 relative overflow-hidden">
                {/* Background visual element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/3"></div>

                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <span>Principal's Dashboard</span>
                        {streak >= 2 && (
                            <motion.span
                                initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                                className="bg-amber-400 text-amber-900 text-xs px-2 py-1 rounded-full font-black uppercase tracking-wider ml-2 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                            >
                                🔥 {streak}x Streak
                            </motion.span>
                        )}
                    </h2>
                    <p className="text-indigo-200 text-sm">Intercept critical issues before they escalate.</p>
                </div>
                <div className="text-right flex items-center gap-6 relative z-10">
                    <div className="text-right">
                        <div className="text-xs text-indigo-300 font-bold tracking-widest uppercase mb-1">Elapsed Time</div>
                        <div className="text-4xl font-mono text-white font-light tracking-tighter">
                            {Math.floor(gameClock / 60)}<span className="text-indigo-400">:</span>{(gameClock % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative w-full h-[500px] bg-slate-800 rounded-3xl border-4 border-slate-700 overflow-hidden shadow-2xl mb-6">
                {/* Blueprint lines */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#475569 2px, transparent 2px), linear-gradient(90deg, #475569 2px, transparent 2px)', backgroundSize: '40px 40px' }} />

                {/* School Regions */}
                <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] border-4 border-slate-600 rounded-xl bg-slate-700/50 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xl opacity-50">Cafeteria / Gym</span>
                </div>
                <div className="absolute top-[10%] right-[5%] w-[45%] h-[55%] border-4 border-slate-600 rounded-xl bg-slate-700/50 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xl opacity-50">Science & Field</span>
                </div>
                <div className="absolute bottom-[5%] left-[5%] w-[40%] h-[35%] border-4 border-slate-600 rounded-xl bg-slate-700/50 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xl opacity-50">B-Wing</span>
                </div>
                <div className="absolute bottom-[5%] right-[5%] w-[45%] h-[25%] border-4 border-slate-600 rounded-xl bg-slate-700/50 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xl opacity-50">Front Office</span>
                </div>

                <AnimatePresence>
                    {activeCrises.map(crisis => {
                        const isCritical = crisis.timeRemaining <= 5;
                        return (
                            <motion.button
                                key={crisis.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                onClick={() => handleSelectCrisis(crisis)}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
                                style={{ top: `${crisis.posY}%`, left: `${crisis.posX}%` }}
                            >
                                {/* Ping ripple for critical */}
                                {isCritical && (
                                    <span className="absolute w-20 h-20 bg-red-500 rounded-full animate-ping opacity-30 mt-[-20px]" />
                                )}

                                <motion.div
                                    animate={isCritical ? { y: [-5, 5, -5] } : { y: [-2, 2, -2] }}
                                    transition={{ repeat: Infinity, duration: isCritical ? 0.3 : 2 }}
                                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl border-4 transition-transform group-hover:scale-110 ${isCritical ? 'bg-red-100 border-red-500' : 'bg-white border-indigo-500'}`}
                                >
                                    {crisis.icon}
                                    <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white border-2 border-white shadow-sm ${isCritical ? 'bg-red-600 animate-pulse' : 'bg-indigo-600'}`}>
                                        {crisis.timeRemaining}
                                    </div>
                                </motion.div>

                                {/* Tooltip on hover */}
                                <div className="mt-2 px-3 py-1.5 bg-gray-900 border-2 border-gray-700 text-white text-sm font-bold rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none whitespace-nowrap z-20">
                                    {crisis.title}
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>

                {activeCrises.length === 0 && spawnCount < CRISES.length && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm z-0">
                        <div className="text-5xl mb-4 animate-bounce inline-block opacity-80">☕</div>
                        <h3 className="text-2xl font-bold text-white mb-1 shadow-sm">All Clear on Campus</h3>
                        <p className="text-slate-300 font-medium tracking-wide">Awaiting next incident report...</p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}


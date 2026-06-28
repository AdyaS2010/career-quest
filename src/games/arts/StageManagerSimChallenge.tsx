import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

interface CueResponse {
    id: string;
    text: string;
    score: number;
    outcome: string;
    principle: string;
}

interface StageCue {
    id: string;
    title: string;
    icon: string;
    urgency: 'immediate' | 'high' | 'standard';
    department: string;
    timing: string;
    description: string;
    context: string;
    responses: CueResponse[];
}

const STAGE_CUES: StageCue[] = [
    {
        id: 'sc1',
        title: '💡 Spotlight Failure During Monologue',
        icon: '🔦',
        urgency: 'immediate',
        department: 'Lighting',
        timing: 'Act I, Scene 3  -  Lead actor mid-monologue',
        context: 'The house is sold out (450 seats). The director is watching from the fifth row. This is the emotional climax of the first act.',
        description: 'The follow spot just died during the lead actor\'s most important monologue. The actor is still performing but is now lit only by dim ambient stage wash. The lighting board operator is frantically trying to reset the fixture. The audience is starting to notice the change.',
        responses: shuffleArray([
            {
                id: 'sc1a', text: 'Radio the board operator to bring up area lights on the actor\'s position while the follow spot is reset  -  improvise a motivated lighting look to cover the gap smoothly',
                score: 30, outcome: 'The area lights come up seamlessly, creating an intimate, dramatic look that actually enhances the monologue. The audience barely notices the transition, and the actor feeds off the new energy. The follow spot is reset by the next scene.',
                principle: 'Great stage managers think in solutions, not problems. Having backup lighting zones pre-programmed for emergencies is standard protocol, and knowing how to call improvised cues calmly is what separates professionals from amateurs.'
            },
            {
                id: 'sc1b', text: 'Call for a full blackout and pause the show while the technical crew troubleshoots the follow spot until it\'s fully operational again',
                score: 5, outcome: 'The sudden blackout startles the audience and completely breaks the actor\'s emotional momentum. The five-minute pause kills the scene\'s energy. When the show resumes, the magic of the monologue is lost and the flow of the act never recovers.',
                principle: 'Stopping a show should be an absolute last resort reserved for safety emergencies. Equipment failures during performance should be handled with improvised solutions that keep the story moving forward.'
            },
            {
                id: 'sc1c', text: 'Don\'t intervene  -  the actor is still performing and the ambient stage wash provides enough visibility for the audience to see the action',
                score: 10, outcome: 'The actor finishes the monologue in unflattering, flat lighting. Several audience members complain afterward that they couldn\'t see facial expressions during the most important scene. The director is disappointed the moment wasn\'t properly lit.',
                principle: 'Lighting isn\'t decoration  -  it\'s storytelling. A stage manager must actively manage technical elements to serve the performance. Accepting substandard conditions when you have the tools to improve them is a missed opportunity.'
            },
        ]),
    },
    {
        id: 'sc2',
        title: '👗 Costume Quick-Change Emergency',
        icon: '🧵',
        urgency: 'immediate',
        department: 'Wardrobe',
        timing: 'Act I / Act II transition  -  90-second quick change',
        context: 'The lead actress needs to transform from a peasant dress into a ball gown in under 90 seconds. Two dressers are assigned to help.',
        description: 'The zipper on the ball gown just broke during the quick change. The lead actress is standing in the wing with the dress half on, 60 seconds until her entrance. One dresser is trying to force the zipper while the other holds the dress fabric. The actress is starting to panic and says she can\'t go on like this.',
        responses: shuffleArray([
            {
                id: 'sc2b', text: 'Tell the actress to go on in the peasant dress and hope the audience doesn\'t notice she was supposed to have changed costumes for the ball scene',
                score: 5, outcome: 'The audience is confused when the character arrives at a royal ball still dressed as a peasant. The costume transformation is a key plot point, and skipping it undermines the entire story. The director speaks to you sternly at intermission.',
                principle: 'Costumes communicate character and plot  -  they\'re not optional decoration. When a costume change is story-critical, you need creative solutions that preserve the narrative, even under extreme time pressure.'
            },
            {
                id: 'sc2a', text: 'Grab safety pins and gaffer tape from the emergency kit to secure the dress from behind, radio the conductor to vamp 30 extra seconds, and calm the actress',
                score: 30, outcome: 'The quick pins hold perfectly from the back where the audience can\'t see. The orchestra covers the extra 30 seconds with an elegant extension of the transition music. The actress enters composed and radiant, and the transformation moment lands beautifully.',
                principle: 'Emergency kits (safety pins, tape, velcro, needle/thread) are essential backstage tools. A great stage manager stays calm, communicates clearly with all departments, and finds creative solutions that preserve the audience\'s experience.'
            },
            {
                id: 'sc2c', text: 'Call for an extended intermission right now and send the wardrobe team to fully repair the zipper properly before the next act begins',
                score: 10, outcome: 'An unplanned 15-minute delay frustrates the audience. The zipper is fixed properly, but the momentum of the show is disrupted and the pacing feels off for the rest of the evening. The actors lose their rhythm in the transition.',
                principle: 'Time is the most precious resource during a live show. A temporary fix that gets the actor onstage on time is almost always better than a perfect repair that costs you your pacing and audience engagement.'
            },
        ]),
    },
    {
        id: 'sc3',
        title: '🎵 Orchestra Pit Sound Bleed',
        icon: '🎻',
        urgency: 'high',
        department: 'Sound',
        timing: 'Act II, Scene 1  -  Quiet dialogue scene',
        context: 'The musical has a live orchestra in the pit. Sound design relies on careful balance between pit and stage microphones.',
        description: 'During an intimate two-person dialogue scene, the orchestra pit microphones are picking up the musicians warming up for the next number. The audience can hear faint trumpet scales underneath the actors\' emotional conversation. The sound engineer says the pit mics can\'t be fully cut without losing the underscoring.',
        responses: shuffleArray([
            {
                id: 'sc3a', text: 'Radio the music director to hold the orchestra quiet during dialogue, and ask the sound engineer to lower pit mic faders while boosting actor body mics to compensate',
                score: 30, outcome: 'The music director signals the orchestra to hold. The sound mix shifts cleanly to prioritize the actors\' voices. The intimate scene plays beautifully without distraction, and the full orchestra comes back strong for the following number.',
                principle: 'Sound balance in musical theater requires constant communication between stage management, the music director, and the sound board. A stage manager coordinates all three departments simultaneously to serve the storytelling.'
            },
            {
                id: 'sc3c', text: 'Accept the bleed as a natural part of live theater  -  the audience expects some imperfection and it adds authenticity to the production',
                score: 5, outcome: 'Multiple audience members mention in post-show surveys that the trumpet scales were distracting during the emotional scene. A theater critic specifically notes the "unprofessional sound coordination" in their review of the opening night.',
                principle: 'While live theater inherently has imperfections, preventable audio issues aren\'t "authenticity"  -  they\'re negligence. Professional stage management means actively managing every element the audience perceives.'
            },
            {
                id: 'sc3b', text: 'Ask the sound engineer to completely mute all pit microphones until it\'s time for the next musical number to start in the score',
                score: 15, outcome: 'The warm-up bleed stops, but so does the gentle underscoring music that was supposed to support the emotional scene. The dialogue now plays against dead silence, which feels awkward and exposes every tiny sound in the house.',
                principle: 'Underscoring serves the drama  -  cutting it entirely removes emotional support from the scene. The solution needed precision (lower warm-up bleed while keeping underscoring), not a blunt instrument (muting everything).'
            },
        ]),
    },
    {
        id: 'sc4',
        title: '🎭 Actor Forgets Lines Onstage',
        icon: '😰',
        urgency: 'immediate',
        department: 'Stage Management',
        timing: 'Act II, Scene 4  -  Critical plot exposition',
        context: 'This scene contains key information the audience needs to understand the climax. The actor is a community theater veteran but has been struggling with this particular passage in rehearsals.',
        description: 'The actor has frozen mid-sentence during a crucial expository speech. It\'s been about 8 seconds of silence  -  the audience is getting uncomfortable. The scene partner is trying to subtly prompt with body language but the actor looks genuinely lost. You\'re on headset with the script in front of you.',
        responses: shuffleArray([
            {
                id: 'sc4a', text: 'Feed the next line quietly through the backstage monitor to the prompt corner, where the assistant SM can whisper it to the actor through the wing entrance',
                score: 30, outcome: 'The assistant stage manager smoothly delivers the line prompt from just offstage. The actor picks up immediately, recovers their confidence, and delivers the rest of the scene strongly. The audience thinks it was just a dramatic pause.',
                principle: 'Line prompting is a fundamental stage management skill. Having a system in place (prompt corner, clearly marked script, headset protocol) before it\'s needed is what makes the difference between a smooth recovery and a visible failure.'
            },
            {
                id: 'sc4c', text: 'Wait it out  -  the actor is experienced and will likely remember their line soon, and jumping in too quickly might make things worse or break their concentration',
                score: 5, outcome: 'After 20 more agonizing seconds, the actor improvises a transition but skips the entire expository passage. The audience misses critical plot information and is confused during the climax. The actor is embarrassed and their confidence is shaken for the rest of the show.',
                principle: 'After 5-8 seconds of silence, intervention is necessary. Waiting too long turns a recoverable moment into visible distress. Professional stage management means having a prompt ready and knowing when to deploy it  -  typically after about 5 seconds.'
            },
            {
                id: 'sc4b', text: 'Radio the actor\'s scene partner through their earpiece to improvise a question that covers the exposition content and gets the scene back on track naturally',
                score: 15, outcome: 'The scene partner does their best but the improvised question sounds slightly unnatural. They recover most of the relevant exposition through dialogue. The audience notices something was off but the story continues coherently.',
                principle: 'Having scene partners cover for each other is a valid backup, but it puts pressure on another actor to improvise. A direct line prompt is more reliable because it gives the frozen actor their actual scripted words rather than expecting someone else to reconstruct the content.'
            },
        ]),
    },
    {
        id: 'sc5',
        title: '🔧 Set Piece Stuck During Scene Change',
        icon: '🪚',
        urgency: 'high',
        department: 'Crew / Scenery',
        timing: 'Scene transition  -  blackout, 45-second change',
        context: 'The set change involves a large rotating platform that brings a new set piece into position. This mechanism has been reliable in rehearsals.',
        description: 'During the blackout scene change, the turntable mechanism has jammed halfway through its rotation. The living room set is stuck at a 45-degree angle and the bedroom set behind it is only partially visible. The stage crew is trying to manually force it but it won\'t budge. You have about 25 seconds before lights need to come up for the next scene.',
        responses: shuffleArray([
            {
                id: 'sc5a', text: 'Call the crew to manually position essential furniture pieces in the visible area to create the bedroom, skip the turntable, and bring up lights on the adjusted set',
                score: 30, outcome: 'The crew rapidly places a bed, nightstand, and lamp in the playable area. Lights come up on time revealing an unconventional but functional bedroom set. The actors adapt to the adjusted blocking, and the audience doesn\'t realize anything went wrong.',
                principle: 'Focus on what the audience NEEDS to see, not what was planned. If the turntable is stuck, the priority shifts to creating a playable space with available elements. Speed and adaptability matter more than perfection during a live performance.'
            },
            {
                id: 'sc5b', text: 'Extend the blackout and play transition music while the full crew works on unjamming the turntable mechanism to get it into the correct position',
                score: 10, outcome: 'Three minutes pass with the audience sitting in darkness listening to looping music. Some audience members start murmuring. When the turntable finally moves, the scene continues but the energy in the house has cooled significantly and feels sluggish.',
                principle: 'Extended blackouts with no visible activity lose the audience. After about 45 seconds in darkness, attention and patience begin to erode rapidly. A stage manager must make "good enough right now" decisions rather than pursuing "perfect eventually."'
            },
            {
                id: 'sc5c', text: 'Bring lights up on the angled, stuck turntable and let the actors perform the bedroom scene using whatever portion of the set is accessible from their current position',
                score: 15, outcome: 'The actors gamely perform around the angled set, but awkward sightlines mean half the audience can barely see the action. The scenic elements at the wrong angle are distracting and the scene feels amateurish despite strong performances.',
                principle: 'Bringing up lights on a half-completed set change signals to the audience that something went wrong. Small investments of time (moving a few furniture pieces) to create a functional space are almost always worth the 15-20 seconds they cost.'
            },
        ]),
    },
    {
        id: 'sc6',
        title: '🔥 Fire Alarm During Performance',
        icon: '🚨',
        urgency: 'immediate',
        department: 'House Management',
        timing: 'Act II, Scene 2  -  Climax of the show',
        context: 'The theater seats 450 people. All exits are clearly marked. You have a house manager, two ushers, and the full stage crew available. There is a pyrotechnics effect in Act III that uses a licensed operator.',
        description: 'The fire alarm has just gone off  -  loud klaxons and flashing strobes throughout the theater. There is NO visible smoke or fire anywhere. It could be a false alarm triggered by the fog machine used earlier in Act I. The audience is startled and looking around nervously. Cast members are frozen onstage, looking to the wings for direction.',
        responses: shuffleArray([
            {
                id: 'sc6a', text: 'Immediately stop the show, bring up house lights, and direct the house manager to begin calm, orderly evacuation through all marked exits while you contact the fire department',
                score: 30, outcome: 'The evacuation proceeds calmly and efficiently. It turns out the fog machine residue triggered a smoke detector. The fire department clears the building in 12 minutes. The audience re-enters and the show resumes from the last cue with a brief audience address.',
                principle: 'Fire alarms are NEVER ignored in a theater, even if you suspect a false alarm. With hundreds of people in a darkened room, evacuation protocol is non-negotiable. Safety always overrides the show  -  no exceptions, no judgment calls.'
            },
            {
                id: 'sc6b', text: 'Radio the house manager to quietly check for actual smoke or fire before making a decision  -  it\'s probably just the fog machine and stopping the show for a false alarm would be embarrassing',
                score: 0, outcome: 'While waiting for the house manager to investigate, the audience grows increasingly anxious. Several people start self-evacuating, creating disorganized movement in the darkened theater. A patron trips in the aisle. Legal counsel later notes that ignoring an active fire alarm violates building code.',
                principle: 'Fire alarms require immediate response regardless of probable cause. "Probably false" still means "possibly real." Building codes and theater safety protocols require evacuation when an alarm sounds  -  a stage manager who delays puts hundreds of lives at risk.'
            },
            {
                id: 'sc6c', text: 'Continue the show and have an usher silently disable the alarm system so it stops disrupting the performance  -  the fog machine has caused this issue before',
                score: 0, outcome: 'Disabling an active fire alarm system violates fire code and your theater\'s insurance policy. An audience member who is a fire marshal reports the incident, resulting in a formal investigation, heavy fines, and potential closure of the theater for code violations.',
                principle: 'Disabling fire safety systems during an event is illegal in virtually every jurisdiction. Even if the cause is known, the alarm must run its course through proper channels. No show is worth risking lives or your theater\'s operating license.'
            },
        ]),
    },
];

interface StageManagerSimChallengeProps {
    onComplete: (score: number) => void;
}

export function StageManagerSimChallenge({ onComplete }: StageManagerSimChallengeProps) {
    const shuffledCues = useMemo(() => {
        return shuffleArray(STAGE_CUES.map(cue => ({
            ...cue,
            responses: shuffleArray(cue.responses),
        })));
    }, []);

    const [callSheet, setCallSheet] = useState<StageCue[]>(shuffledCues);
    const [selectedCue, setSelectedCue] = useState<StageCue | null>(null);
    const [handledCues, setHandledCues] = useState<{ cue: StageCue; response: CueResponse; urgencyBonus: number }[]>([]);
    const [phase, setPhase] = useState<'callsheet' | 'responding' | 'outcome' | 'final'>('callsheet');
    const [currentOutcome, setCurrentOutcome] = useState<{ cue: StageCue; response: CueResponse; urgencyBonus: number } | null>(null);
    const [completeCalled, setCompleteCalled] = useState(false);

    const totalMaxScore = STAGE_CUES.length * 30 + 10; // max score + possible urgency bonuses
    const earnedScore = handledCues.reduce((sum, h) => sum + h.response.score + h.urgencyBonus, 0);
    const finalScore = phase === 'final' ? Math.min(100, Math.round((earnedScore / totalMaxScore) * 100)) : 0;

    useEffect(() => {
        if (phase !== 'final' || completeCalled) return;
        setCompleteCalled(true);
        const timer = setTimeout(() => onComplete(finalScore), 5000);
        return () => clearTimeout(timer);
    }, [phase, completeCalled]);

    const handleSelectCue = (cue: StageCue) => {
        setSelectedCue(cue);
        setPhase('responding');
    };

    const handleRespond = (responseId: string) => {
        if (!selectedCue) return;
        const response = selectedCue.responses.find(r => r.id === responseId)!;

        let urgencyBonus = 0;
        if (handledCues.length === 0 && selectedCue.urgency === 'immediate') urgencyBonus = 3;
        else if (handledCues.length <= 1 && selectedCue.urgency === 'immediate') urgencyBonus = 2;

        setCurrentOutcome({ cue: selectedCue, response, urgencyBonus });
        setPhase('outcome');
    };

    const handleContinue = () => {
        if (!currentOutcome || !selectedCue) return;

        setHandledCues(prev => [...prev, currentOutcome]);
        setCallSheet(prev => prev.filter(c => c.id !== selectedCue.id));
        setSelectedCue(null);
        setCurrentOutcome(null);

        if (callSheet.length <= 1) {
            setPhase('final');
        } else {
            setPhase('callsheet');
        }
    };

    if (phase === 'final') {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">🎭 Post-Show Report</h2>
                    <p className="text-lg text-gray-600">You managed {handledCues.length} backstage crises</p>
                    <div className="text-5xl font-bold text-purple-600 mt-4">{finalScore}%</div>
                    <p className="text-gray-500 mt-2">
                        {finalScore >= 90 ? 'Standing ovation! Broadway-ready stage management!' :
                            finalScore >= 70 ? 'Great show! The cast trusts you completely.' :
                                finalScore >= 50 ? 'The show went on! But there\'s room to tighten your calls.' :
                                    'Every stage manager has rough shows  -  learn from this one!'}
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {handledCues.map((handled, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.2 }}
                            className={`p-5 rounded-2xl border-2 ${handled.response.score >= 25 ? 'bg-green-50 border-green-200' :
                                    handled.response.score >= 10 ? 'bg-amber-50 border-amber-200' :
                                        'bg-red-50 border-red-200'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl">{handled.cue.icon}</span>
                                <span className="font-bold text-gray-900 flex-1">{handled.cue.title.replace(/^[^\s]+\s/, '')}</span>
                                <span className="font-bold text-lg">+{handled.response.score + handled.urgencyBonus}pts</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{handled.response.outcome}</p>
                            <div className="bg-white/60 rounded-xl p-3">
                                <p className="text-sm text-purple-800 font-medium">🎭 {handled.response.principle}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    if (phase === 'outcome' && currentOutcome) {
        const isGood = currentOutcome.response.score >= 25;

        return (
            <div className="max-w-3xl mx-auto p-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className={`rounded-3xl p-8 border-2 ${isGood ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
                        <div className="text-center mb-6">
                            <span className="text-5xl">{isGood ? '🌟' : '🎬'}</span>
                            <h3 className="text-2xl font-bold text-gray-900 mt-3">
                                {isGood ? 'The Show Goes On!' : 'The Audience Noticed...'}
                            </h3>
                            {currentOutcome.urgencyBonus > 0 && (
                                <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                    ⭐ +{currentOutcome.urgencyBonus} Quick Response Bonus
                                </div>
                            )}
                        </div>

                        <div className="bg-white/70 rounded-2xl p-5 mb-4">
                            <h4 className="font-bold text-gray-800 mb-2">What Happened:</h4>
                            <p className="text-gray-700">{currentOutcome.response.outcome}</p>
                        </div>

                        <div className="bg-purple-50 rounded-2xl p-5 mb-6">
                            <h4 className="font-bold text-purple-800 mb-2">🎭 Stage Management Principle:</h4>
                            <p className="text-purple-700">{currentOutcome.response.principle}</p>
                        </div>

                        <button
                            onClick={handleContinue}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors"
                        >
                            {callSheet.length > 1 ? `Back to Call Sheet (${callSheet.length - 1} cues remaining)` : 'See Post-Show Report'}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (phase === 'responding' && selectedCue) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <button
                    onClick={() => { setSelectedCue(null); setPhase('callsheet'); }}
                    className="mb-4 text-purple-600 hover:text-purple-800 font-medium text-sm"
                >
                    ← Back to Call Sheet
                </button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-white rounded-3xl shadow-lg border border-purple-100 p-6 mb-6">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${selectedCue.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                                    selectedCue.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'
                                }`}>
                                {selectedCue.urgency.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{selectedCue.department}</span>
                            <span className="text-xs text-gray-400">{selectedCue.timing}</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedCue.title}</h2>
                        <div className="text-xs text-gray-400 mb-3 italic">{selectedCue.context}</div>
                        <p className="text-gray-700">{selectedCue.description}</p>
                    </div>

                    <h3 className="text-lg font-bold text-gray-700 mb-4">📋 Your call, stage manager:</h3>
                    <div className="space-y-3">
                        {selectedCue.responses.map(response => (
                            <motion.button
                                key={response.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleRespond(response.id)}
                                className="w-full p-5 text-left rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all bg-white"
                            >
                                <span className="text-gray-800">{response.text}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    // Call Sheet view (inbox equivalent)
    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📋 Your Call Sheet</h2>
                <p className="text-gray-500">Opening Night  -  {callSheet.length} backstage situations need your attention</p>
                <p className="text-sm text-purple-600 mt-1">💡 Handle the most urgent cues first for bonus points!</p>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {callSheet.map((cue, i) => (
                        <motion.button
                            key={cue.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => handleSelectCue(cue)}
                            className="w-full p-5 text-left rounded-2xl border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all bg-white"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{cue.icon}</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cue.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                                                cue.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-100 text-blue-700'
                                            }`}>
                                            {cue.urgency.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{cue.department}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900">{cue.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{cue.timing}</p>
                                </div>
                                <span className="text-gray-300 text-xl">→</span>
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            {handledCues.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                    ✅ {handledCues.length} resolved · {callSheet.length} remaining
                </div>
            )}
        </div>
    );
}

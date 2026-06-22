export interface GuideTip {
    text: string;
    emotion: 'happy' | 'thinking' | 'excited' | 'waving';
}

const GENERAL_TIPS: GuideTip[] = [
    { text: "Greetings, traveler! I am Mayor Questopher, your career counselor. How may I help you today?", emotion: 'happy' },
    { text: "Venture to your Profile to view your progress and badges of honor! A true explorer tracks their growth.", emotion: 'excited' },
    { text: "The Leaderboard displays the top career explorers in all the city! Strive for the top!", emotion: 'waving' },
    { text: "Every career domain holds unique trials. I suggest trying a domain you are curious about, rather than one you already know.", emotion: 'thinking' },
    { text: "Do not fear failure in these simulations. An explorer learns more from a setback than an easy victory!", emotion: 'excited' }
];

const ROUTE_TIPS: Record<string, GuideTip[]> = {
    '/': [
        { text: "Welcome to the Career Map! Click on any floating domain to begin your quest.", emotion: 'waving' },
        { text: "You can drag the map to explore, or zoom to inspect the areas closely. Each island is a new career choice.", emotion: 'happy' },
        { text: "I see many unchartered territories! The path to Mastery requires you to earn above 80% on challenges.", emotion: 'thinking' },
    ],
    '/profile': [
        { text: "Behold your achievements! An impressive collection. Let's see your total XP!", emotion: 'excited' },
        { text: "Here you can track your total score and level of mastery. Let your accomplishments motivate you!", emotion: 'happy' },
    ],
    '/leaderboard': [
        { text: "These are the top explorers of the city! Can you reach the pinnacle and place your name here?", emotion: 'excited' },
        { text: "Compete against fellow interns! Mastery of multiple domains is the key to holding a high rank.", emotion: 'thinking' },
    ],
    '/career': [
        { text: "A wonderful choice! This career domain awaits your exploration. Choose a challenge and see what you can do!", emotion: 'excited' },
        { text: "Each challenge you complete grants you precious XP! This helps you master the profession.", emotion: 'happy' },
        { text: "Read the instructions carefully for each simulation. True mastery requires both speed and accuracy.", emotion: 'thinking' }
    ],
};

const CAREER_DESCRIPTIONS: Record<string, GuideTip[]> = {
    'culinary-arts': [
        { text: "The Culinary Arts require more than just recipes! It's about heat management, timing, flavor profiling, and an artist's eye for presentation.", emotion: 'excited' },
        { text: "Chefs, bakers, and sous-chefs train for years to refine their palate. In the real world, working in a kitchen teaches ultimate teamwork and grace under pressure.", emotion: 'thinking' },
        { text: "Real-world advice: Start by mastering the basics—knife skills and heat control. Even the greatest Michelin star chefs started by chopping onions perfectly!", emotion: 'happy' }
    ],
    'information-technology': [
        { text: "Information Technology forms the vital infrastructure of our modern world! Programming, networking, and cybersecurity protect our digital spaces.", emotion: 'happy' },
        { text: "An IT specialist uses logic algorithms rather than physical tools. In the real world, IT professionals are the ultimate problem solvers, building everything from apps to AI.", emotion: 'thinking' },
        { text: "Real-world advice: Learn to read documentation and break big problems into small, testable chunks. Debugging is 90% of the job!", emotion: 'excited' }
    ],
    'law-government': [
        { text: "Law & Government dictate the rules of civil society. Lawyers, judges, and policy-makers construct the social contract that binds us.", emotion: 'thinking' },
        { text: "Argumentation and precedent are the weapons of choice here! In the real world, this career is about protecting rights, drafting policies, and ensuring justice.", emotion: 'excited' },
        { text: "Real-world advice: Read voraciously and practice public speaking. A clear, logical argument can move mountains!", emotion: 'happy' }
    ],
    'media-communication': [
        { text: "Media & Communication is the art of shaping perception! Journalists, PR specialists, and broadcasters hold the power of information.", emotion: 'happy' },
        { text: "In this field, the pen is an incredibly powerful tool. Real-world professionals in this field shape how the public understands global events.", emotion: 'thinking' },
        { text: "Real-world advice: Learn to write clearly and concisely. In an age of endless content, the ability to tell a compelling, truthful story is invaluable.", emotion: 'excited' }
    ],
    'health-sciences': [
        { text: "Health Sciences are the highest calling—the preservation of life! Doctors, nurses, and researchers unravel the mysteries of the human body.", emotion: 'excited' },
        { text: "Empathy combined with rigorous scientific knowledge is required here. In the real world, healthcare workers are the frontline heroes of society.", emotion: 'thinking' },
        { text: "Real-world advice: Cultivate immense patience and compassion. Science provides the cure, but humanity provides the healing.", emotion: 'happy' }
    ],
    'education': [
        { text: "Education is the passing of the torch! Teachers, principals, and counselors shape the leaders of tomorrow.", emotion: 'waving' },
        { text: "Patience and adaptability are key. In the real world, educators don't just teach facts; they inspire curiosity and build confidence.", emotion: 'thinking' },
        { text: "Real-world advice: To be a great teacher, you must remain a lifelong student. Every learner is different, so adaptability is your greatest tool.", emotion: 'excited' }
    ],
    'arts-entertainment': [
        { text: "Arts, Entertainment & Design bring beauty to the world! Graphic designers, actors, and artists evoke emotion and challenge the status quo.", emotion: 'excited' },
        { text: "There is no single 'right' answer in art, but there is harmony, composition, and emotional resonance. Real-world artists craft the culture we live in.", emotion: 'happy' },
        { text: "Real-world advice: Accept feedback gracefully but trust your unique voice. Technical skill can be taught, but perspective is entirely your own.", emotion: 'thinking' }
    ],
    'financial-services': [
        { text: "Financial Services keep the city's resources flowing! Accountants, analysts, and planners manage wealth and mitigate risk.", emotion: 'thinking' },
        { text: "Mathematics and forecasting are your tools here. In the real world, finance professionals help families save for the future and businesses grow safely.", emotion: 'thinking' },
        { text: "Real-world advice: Learn to love spreadsheets and data analysis. Understanding how money moves is a superpower in modern society.", emotion: 'excited' }
    ]
};

const CHALLENGE_TIPS: Record<string, Record<string, GuideTip[]>> = {
    'culinary-arts': {
        'plating': [
            { text: "In plating, contrast is key! Try to place brightly colored elements against darker backgrounds to make them pop.", emotion: 'excited' },
            { text: "The rule of thirds applies to food as well as painting. Avoid placing the main element perfectly in dead center if there are garnishes.", emotion: 'thinking' },
            { text: "Garnishes should always make sense with the flavor profile. Don't add a sprig of mint to a savory steak just for the green color!", emotion: 'thinking' }
        ],
        'kitchen-safety': [
            { text: "Never throw water on a grease fire! Smother it with a lid or use baking soda.", emotion: 'excited' },
            { text: "A falling knife has no handle! If a blade drops, step back and let it fall rather than attempting to catch it.", emotion: 'thinking' }
        ]
    },
    'information-technology': {
        'debugging': [
            { text: "Look closely at the error messages! They are not ancient curses; they tell thee the exact line number where the magic failed.", emotion: 'happy' },
            { text: "When debugging, change only ONE variable at a time. If thou changest many things at once, thou wilt not know what fixed it!", emotion: 'thinking' },
            { text: "Syntax errors are the most common! Check for missing semicolons, unmatched brackets, or misspelled variable names.", emotion: 'thinking' }
        ],
        'architecture': [
            { text: "A scalable system is like a well-built castle. Divide concerns into separate microservices so one failure doesn't fell the whole keep!", emotion: 'thinking' }
        ]
    },
    'law-government': {
        'cross-examination': [
            { text: "Never ask a witness a question to which thou dost not already know the answer!", emotion: 'thinking' },
            { text: "Listen for contradictions. If a witness says they were at the tavern, but later says they were sleeping at home, strike there!", emotion: 'excited' },
            { text: "Keep thy questions brief and leading. Control the flow of testimony!", emotion: 'thinking' }
        ],
        'policy': [
            { text: "When drafting policy, think of the unintended consequences! A tax on windows might simply cause peasants to brick up their natural light.", emotion: 'thinking' }
        ]
    },
    'health-sciences': {
        'treatment-planner': [
            { text: "Always read the patient's existing chart! Prescribing a blood thinner to a patient already on one could cause disaster.", emotion: 'thinking' },
            { text: "When diagnosing, follow Ockham's Razor. The simplest explanation that accounts for all symptoms is usually the correct one.", emotion: 'happy' },
            { text: "Monitor vital signs constantly. A sudden drop in blood pressure is a blaring horn of danger!", emotion: 'excited' }
        ]
    },
    'education': {
        'classroom-conductor': [
            { text: "If the classroom grows chaotic, sometimes lowering thy voice is more effective than shouting!", emotion: 'thinking' },
            { text: "Disruptive students often seek attention. Redirect their energy into leadership roles within the classroom!", emotion: 'excited' },
            { text: "Praise publicly, correct privately. A knight's honor is fragile at a young age.", emotion: 'happy' }
        ]
    },
    'financial-services': {
        'investment-allocation': [
            { text: "Diversification is thy shield! Do not place all thy gold in one merchant's ship; spread it across bonds, stocks, and commodities.", emotion: 'thinking' },
            { text: "A younger investor can afford a riskier portfolio (more stocks), as they have time to recover from market dragons.", emotion: 'excited' }
        ]
    }
};

const CAREER_ALIASES: Record<string, string[]> = {
    'culinary-arts': ['culinary', 'cook', 'food', 'chef', 'bake', 'baking', 'restaurant', 'kitchen', 'plate', 'plating'],
    'information-technology': ['it', 'tech', 'technology', 'computer', 'software', 'coding', 'code', 'programming', 'programmer', 'debug', 'web', 'cyber', 'network', 'information technology', 'information systems'],
    'law-government': ['law', 'government', 'legal', 'lawyer', 'judge', 'policy', 'politics', 'court', 'witness', 'examining', 'cross-examine', 'cross-examination'],
    'media-communication': ['media', 'communication', 'journalism', 'news', 'writing', 'broadcast', 'tv', 'radio', 'pr', 'public relations'],
    'health-sciences': ['health', 'medical', 'doctor', 'nurse', 'medicine', 'hospital', 'science', 'treat', 'patient', 'diagnosis', 'clinic'],
    'education': ['education', 'teaching', 'teacher', 'school', 'classroom', 'student', 'learn', 'academic', 'educator'],
    'arts-entertainment': ['art', 'design', 'entertainment', 'artist', 'acting', 'theater', 'draw', 'paint', 'graphic'],
    'financial-services': ['finance', 'financial', 'money', 'accounting', 'investing', 'invest', 'bank', 'economy', 'wealth']
};

// Explicit mapping of actionable words to specific challenge types
const CHALLENGE_KEYWORDS: Record<string, { career: string, challenge: string, words: string[] }> = {
    'plate_food': { career: 'culinary-arts', challenge: 'plating', words: ['plate', 'plating', 'presentation'] },
    'safety': { career: 'culinary-arts', challenge: 'kitchen-safety', words: ['fire', 'knife', 'safety', 'danger', 'burn'] },
    'debug': { career: 'information-technology', challenge: 'debugging', words: ['debug', 'error', 'bug', 'fix code'] },
    'arch': { career: 'information-technology', challenge: 'architecture', words: ['architecture', 'scalable', 'microservices', 'system'] },
    'cross_exam': { career: 'law-government', challenge: 'cross-examination', words: ['cross-examine', 'cross-examination', 'witness', 'testimony', 'questioning'] },
    'policy': { career: 'law-government', challenge: 'policy', words: ['policy', 'drafting', 'tax', 'law'] },
    'treatment': { career: 'health-sciences', challenge: 'treatment-planner', words: ['treat', 'treatment', 'diagnose', 'diagnosis', 'symptoms', 'chart'] },
    'classroom': { career: 'education', challenge: 'classroom-conductor', words: ['teach', 'student', 'shout', 'disruptive', 'praise', 'classroom'] },
    'invest': { career: 'financial-services', challenge: 'investment-allocation', words: ['invest', 'investment', 'portfolio', 'stocks', 'bonds', 'diversify'] }
};

export function getContextAwareTip(pathname: string): GuideTip {
    if (pathname.startsWith('/career/')) {
        const careerSlug = pathname.split('/')[2];
        const descriptions = CAREER_DESCRIPTIONS[careerSlug];
        if (descriptions && descriptions.length > 0) {
            return descriptions[Math.floor(Math.random() * descriptions.length)];
        }
    }

    const pathTips = ROUTE_TIPS[pathname];
    if (pathTips && pathTips.length > 0) {
        return pathTips[Math.floor(Math.random() * pathTips.length)];
    }

    return GENERAL_TIPS[Math.floor(Math.random() * GENERAL_TIPS.length)];
}

export function generateResponse(query: string, pathname: string): GuideTip {
    // 1. Sanitize query: lowercased, only letters/numbers/spaces
    // Use an aggressive replace to strip punctuation that breaks \b boundary logic
    const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    // 2. Helper for deeply robust fuzzy word matching using RegExp word boundaries
    const hasWord = (words: string[]) => {
        return words.some(w => {
            const safeW = w.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
            if (!safeW) return false;
            const regex = new RegExp(`\\b${safeW}\\b`, 'i');
            return regex.test(q);
        });
    };

    // 3. Greetings & Thanks
    if (hasWord(['hello', 'hi', 'hey', 'greetings', 'hail', 'sup', 'howdy'])) {
        return { text: "Hail and well met, adventurer! I am Sir Questopher. How can I aid thy career journey today?", emotion: 'waving' };
    }
    if (hasWord(['thanks', 'thank you', 'bye', 'farewell', 'goodbye', 'ok', 'okay', 'great', 'awesome'])) {
        return { text: "'Tis my duty and honor! Stand tall, and may fortune favor thy quests!", emotion: 'happy' };
    }

    // 4. Points & Scoring
    if (hasWord(['point', 'points', 'score', 'level', 'rank', 'leaderboard', 'xp', 'win', 'winning'])) {
        return { text: "Thou earnest XP by passing challenges! Scoring high adds to thy cumulative Kingdom Score, which lifts thy Rank on the Leaderboard!", emotion: 'excited' };
    }

    // 5. Look for Specific Challenge Actions FIRST
    for (const data of Object.values(CHALLENGE_KEYWORDS)) {
        if (hasWord(data.words)) {
            const tips = CHALLENGE_TIPS[data.career]?.[data.challenge];
            if (tips && tips.length > 0) {
                return tips[Math.floor(Math.random() * tips.length)];
            }
        }
    }

    // 6. Look for Broad Career Mentions
    let targetCareer: string | null = null;
    for (const [slug, aliases] of Object.entries(CAREER_ALIASES)) {
        if (hasWord(aliases)) {
            targetCareer = slug;
            break;
        }
    }

    // 7. General Intents
    const wantsHelp = hasWord(['help', 'hint', 'stuck', 'tip', 'advice', 'explain', 'what is', 'what do', 'tell me', 'know', 'how do i', 'how to', 'what are', 'about', 'what']);
    const wantsToPlay = hasWord(['play', 'start', 'begin', 'game', 'simulation', 'task', 'challenge', 'do']);

    // 8. Handle Broad Career Mentions
    if (targetCareer) {
        const descs = CAREER_DESCRIPTIONS[targetCareer];
        if (descs && descs.length > 0) {
            return descs[Math.floor(Math.random() * descs.length)];
        }
    }

    // 9. Handle General Play or Help
    if (wantsToPlay && !wantsHelp) {
        return { text: "To play, wander to the Map! Click on any floating island to enter that Career Realm. Then, select a simulated challenge to test thy skills and earn XP!", emotion: 'excited' };
    }

    if (wantsHelp || hasWord(['help'])) {
        return { text: "I can offer thee wisdom about any career path! Ask me 'What is IT?' or 'How do I plate food?' or 'Tell me about Law'. What realm interests thee?", emotion: 'happy' };
    }

    // 10. Context Awareness if inside a career page
    if (pathname.startsWith('/career/')) {
        const careerSlug = pathname.split('/')[2];
        const careerName = careerSlug?.replace(/-/g, ' ') || 'this career';
        return {
            text: `We currently stand in the realm of ${careerName}. Art thou stuck on a challenge here? Ask me for a hint, or click a trial to begin!`,
            emotion: 'thinking'
        };
    }

    // 11. Very short fallback (e.g. user just types "food" which wasn't picked up, or "ok")
    if (q.split(/\s+/).length === 1 && q.length > 0) {
        return { text: "Speak plainly, my friend! I am but a humble knight. Ask me full questions like 'What is the Education domain?' or 'How do I debug code?'", emotion: 'thinking' };
    }

    // 12. Ultimate Fallback
    const conversationalFallbacks: GuideTip[] = [
        { text: "My scrolls do not contain the answer to that riddle! However, thou canst ask me for 'hints', 'how to play', or about specific careers like IT or Health Sciences.", emotion: 'thinking' },
        { text: "A perplexing query! I am best equipped to aid thee with Career simulations or explaining the different career paths in our realm.", emotion: 'thinking' },
        { text: "By my sword, I know not the answer! Ask me about debugging, baking, cross-examining witnesses, or other noble skills!", emotion: 'waving' },
    ];

    return conversationalFallbacks[Math.floor(Math.random() * conversationalFallbacks.length)];
}

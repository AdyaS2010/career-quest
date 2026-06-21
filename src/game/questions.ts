// Career question banks + bosses for the turn-based battles. Answering a
// question correctly casts a spell at the boss; wrong answers let it strike back.
export interface Question { q: string; options: string[]; answer: number }
export interface BattleDef { boss: string; bossEmoji: string; spell: string; questions: Question[] }

export const BATTLES: Record<string, BattleDef> = {
  'culinary-arts': {
    boss: 'The Dinner Rush', bossEmoji: '🔥', spell: 'Flambé Blast',
    questions: [
      { q: 'Safe internal temperature for cooked chicken?', options: ['165°F (74°C)', '120°F (49°C)', '140°F (60°C)', '90°F (32°C)'], answer: 0 },
      { q: '"Mise en place" means…', options: ['Everything in its place', 'A creamy sauce', 'A knife cut', 'A dessert'], answer: 0 },
      { q: 'Which is a classic "mother sauce"?', options: ['Béchamel', 'Ketchup', 'Salsa', 'Mayonnaise'], answer: 0 },
      { q: 'Searing meat mainly does what?', options: ['Browns it & builds flavor', 'Cooks it all the way through', 'Removes all the fat', 'Adds salt'], answer: 0 },
      { q: 'Best way to avoid cross-contamination?', options: ['Separate boards for raw meat & veg', 'Use one board for speed', 'Rinse meat in the sink', 'Cook everything together'], answer: 0 },
      { q: 'A "simmer" compared to a boil is…', options: ['Gentler, just below boiling', 'Much hotter than boiling', 'Exactly the same', 'Only for desserts'], answer: 0 },
      { q: 'What makes bread dough rise?', options: ['Yeast', 'Salt', 'Sugar alone', 'Cold water'], answer: 0 },
    ],
  },
  'information-technology': {
    boss: 'The Mega Bug', bossEmoji: '🐛', spell: 'Debug Strike',
    questions: [
      { q: 'HTML stands for…', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Hyperlink Machine Logic', 'Home Tool Markup Language'], answer: 0 },
      { q: 'In code, a "bug" is…', options: ['An error or flaw', 'A new feature', 'A type of computer', 'A fast network'], answer: 0 },
      { q: 'Binary code uses which digits?', options: ['0 and 1', '0 through 9', 'A through F', '1 through 10'], answer: 0 },
      { q: 'Which is a programming language?', options: ['Python', 'HTTP', 'HTML', 'USB'], answer: 0 },
      { q: 'A loop is used to…', options: ['Repeat a set of instructions', 'Delete files', 'Stop the program', 'Encrypt data'], answer: 0 },
      { q: 'RAM is best described as…', options: ['Fast short-term memory', 'Permanent storage', 'The processor', 'A monitor'], answer: 0 },
      { q: 'Debugging means…', options: ['Finding and fixing errors', 'Writing documentation', 'Designing the UI', 'Deleting code'], answer: 0 },
    ],
  },
  'health-sciences': {
    boss: 'Code Blue', bossEmoji: '🦠', spell: 'Vital Surge',
    questions: [
      { q: 'Normal adult resting heart rate?', options: ['60–100 bpm', '20–40 bpm', '120–160 bpm', '180–200 bpm'], answer: 0 },
      { q: 'CPR stands for…', options: ['Cardiopulmonary Resuscitation', 'Cardiac Pressure Relief', 'Central Pulse Recovery', 'Critical Patient Rescue'], answer: 0 },
      { q: 'In triage, you treat…', options: ['The most urgent cases first', 'In order of arrival', 'Youngest first always', 'Alphabetically'], answer: 0 },
      { q: 'The universal blood donor type is…', options: ['O negative', 'AB positive', 'A positive', 'B negative'], answer: 0 },
      { q: 'Hand-washing primarily prevents…', options: ['Spread of infection', 'Dry skin', 'High blood pressure', 'Broken bones'], answer: 0 },
      { q: 'Approximate normal body temperature?', options: ['98.6°F (37°C)', '90°F (32°C)', '104°F (40°C)', '86°F (30°C)'], answer: 0 },
      { q: 'The organ that pumps blood is the…', options: ['Heart', 'Liver', 'Lung', 'Kidney'], answer: 0 },
    ],
  },
  'law-government': {
    boss: 'The Objection Ogre', bossEmoji: '⚖️', spell: 'Verdict Bolt',
    questions: [
      { q: 'Which branch makes laws?', options: ['Legislative', 'Executive', 'Judicial', 'Military'], answer: 0 },
      { q: 'In court you are presumed…', options: ['Innocent until proven guilty', 'Guilty until proven innocent', 'Always guilty', 'Neutral'], answer: 0 },
      { q: 'How many U.S. Supreme Court justices?', options: ['9', '12', '7', '5'], answer: 0 },
      { q: 'A subpoena is…', options: ['An order to appear or produce evidence', 'A guilty verdict', 'A type of lawyer', 'A jury vote'], answer: 0 },
      { q: 'The Bill of Rights is the first __ amendments.', options: ['10', '5', '15', '27'], answer: 0 },
      { q: 'Who argues on behalf of the accused?', options: ['Defense attorney', 'Prosecutor', 'Judge', 'Bailiff'], answer: 0 },
      { q: 'The right to remain silent comes from the…', options: ['5th Amendment', '1st Amendment', '2nd Amendment', '10th Amendment'], answer: 0 },
    ],
  },
  'media-communication': {
    boss: 'The Deadline Demon', bossEmoji: '📰', spell: 'Headline Flash',
    questions: [
      { q: 'Which is NOT one of the "5 Ws"?', options: ['How', 'Who', 'What', 'Why'], answer: 0 },
      { q: 'The "lead" of an article is…', options: ['The opening with the key info', 'The author name', 'The final line', 'The photo'], answer: 0 },
      { q: 'A primary source is…', options: ['A firsthand account', 'A summary of others', 'An opinion column', 'A rumor'], answer: 0 },
      { q: 'A "byline" shows…', options: ["The author's name", 'The deadline', 'The word count', 'The section'], answer: 0 },
      { q: 'Fact-checking is done to…', options: ['Verify accuracy', 'Add opinions', 'Make it longer', 'Sell ads'], answer: 0 },
      { q: '"Off the record" means…', options: ['Not for publication', 'On the front page', 'Breaking news', 'An editorial'], answer: 0 },
      { q: 'Bias in reporting means…', options: ['A one-sided slant', 'Perfect accuracy', 'A photo caption', 'A correction'], answer: 0 },
    ],
  },
  'financial-services': {
    boss: 'The Market Crash', bossEmoji: '📉', spell: 'Compound Cannon',
    questions: [
      { q: 'Interest on your savings is…', options: ['Money the bank pays you', 'A fee you pay', 'A type of tax', 'A loan'], answer: 0 },
      { q: 'Diversifying investments mainly…', options: ['Reduces risk', 'Guarantees profit', 'Avoids all taxes', 'Raises fees'], answer: 0 },
      { q: 'A stock represents…', options: ['Ownership in a company', 'A loan to a bank', 'A government bond', 'A savings account'], answer: 0 },
      { q: 'Compound interest is…', options: ['Interest earned on interest', 'A one-time bonus', 'A penalty', 'A flat fee'], answer: 0 },
      { q: 'A budget helps you…', options: ['Plan income & spending', 'Avoid all bills', 'Increase your salary', 'Pick stocks'], answer: 0 },
      { q: 'A credit score measures…', options: ['Your creditworthiness', 'Your salary', 'Your age', 'Your savings only'], answer: 0 },
      { q: 'Inflation means…', options: ['Prices rising over time', 'Prices falling', 'More jobs', 'Lower taxes'], answer: 0 },
    ],
  },
  'education': {
    boss: 'The Pop-Quiz Goblin', bossEmoji: '📝', spell: 'Insight Beam',
    questions: [
      { q: 'A lesson plan is…', options: ['A guide for teaching a lesson', 'A final exam', 'A report card', 'A field trip'], answer: 0 },
      { q: 'Formative assessment is…', options: ['Ongoing feedback while learning', 'Only the final grade', 'A diploma', 'A detention'], answer: 0 },
      { q: 'Differentiation means…', options: ['Tailoring teaching to each learner', 'Giving everyone the same test', 'Skipping topics', 'Grading on a curve'], answer: 0 },
      { q: 'Scaffolding is…', options: ['Support that is gradually removed', 'A type of desk', 'A final project', 'A punishment'], answer: 0 },
      { q: 'A strong learning objective is…', options: ['Specific and measurable', 'Vague and broad', 'Secret from students', 'Optional'], answer: 0 },
      { q: 'Positive reinforcement…', options: ['Rewards desired behavior', 'Punishes mistakes', 'Ignores students', 'Lowers grades'], answer: 0 },
      { q: '"Engagement" in class means…', options: ['Active participation', 'Sitting quietly only', 'Memorizing facts', 'Finishing early'], answer: 0 },
    ],
  },
  'arts-entertainment': {
    boss: 'Stage Fright', bossEmoji: '🎭', spell: 'Spotlight Strike',
    questions: [
      { q: 'The primary colors are…', options: ['Red, blue, yellow', 'Green, orange, purple', 'Black, white, gray', 'Pink, teal, gold'], answer: 0 },
      { q: '"Tempo" in music refers to…', options: ['Speed of the music', 'How loud it is', 'The key', 'The lyrics'], answer: 0 },
      { q: 'The "rule of thirds" is used in…', options: ['Composition & framing', 'Cooking', 'Accounting', 'Coding'], answer: 0 },
      { q: '"Blocking" in theater is…', options: ["Actors' movement & positions", 'Stopping a show', 'Building a set', 'Writing lines'], answer: 0 },
      { q: 'Complementary colors are…', options: ['Opposite on the color wheel', 'Right next to each other', 'All shades of blue', 'Only black & white'], answer: 0 },
      { q: 'A film "score" is…', options: ['The musical soundtrack', 'The final rating', 'The script', 'The budget'], answer: 0 },
      { q: '"Improv" means…', options: ['Unscripted performance', 'Reading from a script', 'Stage lighting', 'Set design'], answer: 0 },
    ],
  },
};

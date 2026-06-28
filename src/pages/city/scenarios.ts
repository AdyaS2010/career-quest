// "Cold open" entry scenarios  -  a polished, character-driven decision moment that
// greets you when you step into each career world, in the spirit of NGPF Arcade
// (Shady Sam / Slick Wheels): a real on-the-job dilemma, consequential choices,
// immediate feedback from your mentor, and a graded payoff  -  *before* the sims.

export interface ScenarioChoice {
  label: string;          // the action you can take
  outcome: string;        // your mentor's reaction / what happens
  delta: number;          // points toward the meter (best=3, ok=1, poor=0)
  tag: 'best' | 'ok' | 'bad';
}
export interface ScenarioBeat {
  prompt: string;         // the situation you must read
  detail?: string;        // optional extra context
  choices: ScenarioChoice[];
}
export interface WorldScenario {
  title: string;          // the episode title, e.g. "The Friday Night Rush"
  meterLabel: string;     // what's at stake, e.g. "Service"
  meterIcon: string;      // emoji for the meter
  hook: string;           // the cinematic opening line
  beats: ScenarioBeat[];
  ace: string;            // mentor line on a great run
  ok: string;             // mentor line on a decent run
  low: string;            // mentor line on a rough run
}

export const SCENARIOS: Record<string, WorldScenario> = {
  'culinary-arts': {
    title: 'The Friday Night Rush',
    meterLabel: 'Service', meterIcon: '🔥',
    hook: "7:58 PM. The dining room is packed, two cooks just called out, and a twelve-top walks through the door. Tie your apron, chef  -  service doesn't wait.",
    beats: [
      {
        prompt: 'A party of twelve arrives ten minutes before the kitchen closes. The line is already slammed. Call it, chef.',
        choices: [
          { label: "Take them  -  fire a tight 'kitchen's choice' tasting", outcome: "Smart. Limit the menu, keep the line moving, nobody waits an hour. That's how pros handle a rush.", delta: 3, tag: 'best' },
          { label: 'Seat them with the full menu, all hands on deck', outcome: 'Generous  -  but an open menu buries the line, and the regulars’ tickets slow to a crawl.', delta: 1, tag: 'ok' },
          { label: "Turn them away  -  we're closing", outcome: "We don't turn away hungry guests if we can help it. You left money and goodwill on the table.", delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'A steak comes back to the pass  -  the guest says it’s overcooked. The ticket clearly read medium-rare.',
        choices: [
          { label: 'Re-fire it now, send a comp dessert, apologize', outcome: "Exactly. They'll remember how you fixed it, not the mistake. That's a five-star recovery.", delta: 3, tag: 'best' },
          { label: 'Re-fire it, but no comp', outcome: 'Fine  -  but the small gesture is what turns a bad night into a great review.', delta: 1, tag: 'ok' },
          { label: 'Send it back out  -  it was cooked right', outcome: 'Never argue with the dining room. You just lost a regular over one steak.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'Your signature dish is up under the pass light. One last move before it goes out.',
        choices: [
          { label: 'Wipe the rim, sauce underneath, micro-herbs on top', outcome: 'Beautiful. People eat with their eyes first  -  that plate sells the whole kitchen.', delta: 3, tag: 'best' },
          { label: 'Standard plating, just get it out hot', outcome: 'Hot food matters  -  but on the signature, presentation is the entire point.', delta: 1, tag: 'ok' },
          { label: 'Pile it high and rush it', outcome: 'Speed isn’t everything. A sloppy plate undoes an hour of cooking.', delta: 0, tag: 'bad' },
        ],
      },
    ],
    ace: "Outstanding service, chef. You kept your head when the night fell apart  -  that's what separates a cook from a chef.",
    ok: "Solid shift. A few rough edges, but the guests left happy. Sharpen those instincts on the line.",
    low: "Tough night. Service is a skill like any other  -  let's run the stations and build it up.",
  },

  'information-technology': {
    title: 'The 2 AM Outage',
    meterLabel: 'Uptime', meterIcon: '🛰️',
    hook: 'Your phone buzzes at 2 AM. The checkout service is down and customers can’t pay. You’re on call tonight. Time to debug.',
    beats: [
      {
        prompt: 'Checkout is throwing 500 errors site-wide and revenue is bleeding. First move?',
        choices: [
          { label: 'Check the dashboards and recent deploys', outcome: 'Always. The newest change is the usual suspect  -  and sure enough, a deploy went out an hour ago.', delta: 3, tag: 'best' },
          { label: 'Restart every server and hope', outcome: 'Sometimes that works... but you learned nothing, and it’ll just come back.', delta: 1, tag: 'ok' },
          { label: 'Start rewriting the payment code live', outcome: 'Whoa  -  never patch blind in production at 2 AM. Diagnose before you touch anything.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'The bad deploy is confirmed as the cause. Customers are still stuck right now.',
        choices: [
          { label: 'Roll back to the last good version, then investigate', outcome: 'Yes. Stop the bleeding first, root-cause second. Customers can pay again in 90 seconds.', delta: 3, tag: 'best' },
          { label: 'Write a quick hotfix on the spot', outcome: 'Risky at 2 AM  -  an untested fix can make it worse. A rollback is the safe call.', delta: 1, tag: 'ok' },
          { label: 'Wait for the morning team to handle it', outcome: 'Hours of lost sales while you sleep. On call means you own it now.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'It’s fixed and the site is healthy. Before you crash, what do you leave behind?',
        choices: [
          { label: 'Write an incident report + add an alert to catch it sooner', outcome: "That's senior-engineer thinking. The best fix is making sure it never surprises you again.", delta: 3, tag: 'best' },
          { label: 'Drop a quick note in the team channel', outcome: 'Better than nothing  -  but undocumented incidents tend to repeat.', delta: 1, tag: 'ok' },
          { label: 'Nothing  -  go to sleep', outcome: 'Fair, you’re exhausted. But tomorrow nobody remembers what broke or why.', delta: 0, tag: 'bad' },
        ],
      },
    ],
    ace: 'Clean incident response. Calm, methodical, and you left the system stronger than you found it. Welcome to the on-call crew.',
    ok: 'Good recovery. You got it back up  -  now let’s build the habits that make outages boring.',
    low: 'Rough night, but everyone’s first page is. Let’s drill the fundamentals at the workstation.',
  },

  'health-sciences': {
    title: 'Incoming Trauma',
    meterLabel: 'Patient Care', meterIcon: '🩺',
    hook: 'The ER doors slide open  -  two patients arrive at once and a nurse is calling your name. Breathe. Triage is what saves lives.',
    beats: [
      {
        prompt: 'Two patients in at once: one with a sprained ankle, one clutching their chest and short of breath. Who do you see first?',
        choices: [
          { label: 'The chest pain  -  assess airway, breathing, circulation', outcome: 'Right. The sickest patient first, ABCs before anything. Chest pain could be cardiac  -  minutes matter.', delta: 3, tag: 'best' },
          { label: 'The ankle  -  it’s faster to clear', outcome: 'Speed isn’t the rule in triage  -  severity is. Never let the minor injury jump the line.', delta: 0, tag: 'bad' },
          { label: 'Ask them both to fill out forms first', outcome: 'Paperwork never comes before a patient who can’t breathe.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'The chest-pain patient is frightened and asking what’s happening to them.',
        choices: [
          { label: 'Explain calmly, step by step, and stay with them', outcome: 'Communication is medicine too. A calm voice lowers their heart rate  -  literally.', delta: 3, tag: 'best' },
          { label: "Say 'you'll be fine' and move on", outcome: 'Reassurance helps, but empty promises break trust if you turn out to be wrong.', delta: 1, tag: 'ok' },
          { label: 'Stay silent and watch the monitor', outcome: 'The machine matters  -  but so does the scared human attached to it.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'The pharmacy hands you a medication order. The dose looks higher than usual.',
        choices: [
          { label: 'Double-check the order before giving anything', outcome: "Always. 'Check twice, give once.' You just caught a decimal error  -  that's a life saved.", delta: 3, tag: 'best' },
          { label: 'Give it  -  the doctor ordered it', outcome: 'Orders can have typos. You are the last line of defense before it reaches the patient.', delta: 0, tag: 'bad' },
          { label: 'Quietly cut the dose in half yourself', outcome: 'Never freelance a dose  -  flag it and confirm. Guessing is dangerous in both directions.', delta: 0, tag: 'bad' },
        ],
      },
    ],
    ace: 'Steady hands, clear head, kind words. You triaged like a veteran tonight. The team is lucky to have you.',
    ok: 'Good work under pressure. Tighten up the safety checks and you’ll be running the floor.',
    low: 'The ER is overwhelming at first  -  that’s normal. Let’s practice the protocols until they’re instinct.',
  },

  'law-government': {
    title: 'The Big Case',
    meterLabel: 'The Case', meterIcon: '⚖️',
    hook: 'Court is in session. Your client is counting on you, opposing counsel is sharp, and the judge is watching every move. Make your case.',
    beats: [
      {
        prompt: 'A key witness contradicts your client’s story on the stand. The jury notices. Your move?',
        choices: [
          { label: 'Calmly cross-examine to expose the inconsistency', outcome: "That's lawyering. You don't panic  -  you turn their weak point into your argument.", delta: 3, tag: 'best' },
          { label: 'Object loudly and demand it be struck', outcome: 'An objection may not even apply here. Theatrics aren’t a strategy.', delta: 1, tag: 'ok' },
          { label: 'Ignore it and move on', outcome: 'Left unaddressed, that contradiction becomes the jury’s lasting impression.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'Opposing counsel offers a settlement  -  less than you hoped for, but guaranteed.',
        choices: [
          { label: 'Lay out the real odds and let your client decide', outcome: 'Exactly. Your job is their informed choice, not your ego. A sure win can beat a risky trial.', delta: 3, tag: 'best' },
          { label: 'Reject it  -  you want the courtroom victory', outcome: 'Pride is expensive. A trial is a gamble; sometimes the deal is the win.', delta: 1, tag: 'ok' },
          { label: 'Accept it without explaining the trade-offs', outcome: 'Never. The decision belongs to your client, and it must be fully informed.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'Closing argument. The jury is tired. How do you land it?',
        choices: [
          { label: 'A clear, plain-language story tying the evidence together', outcome: 'Perfect. Juries decide on the story that makes sense  -  not on the biggest words.', delta: 3, tag: 'best' },
          { label: 'A dense recap of every relevant statute', outcome: 'You’ll lose them. Precision matters, but clarity wins verdicts.', delta: 1, tag: 'ok' },
          { label: 'An emotional plea with no evidence', outcome: 'Feeling without facts is easy to dismiss. Anchor it to the proof.', delta: 0, tag: 'bad' },
        ],
      },
    ],
    ace: 'Masterful. You read the room, respected your client, and made the complex simple. The court took notice, counselor.',
    ok: 'A respectable showing. Sharpen your cross-examination and your closings will be unbeatable.',
    low: 'The courtroom is intimidating at first. Let’s build your argument skills case by case.',
  },

  'media-communication': {
    title: 'Breaking News',
    meterLabel: 'The Story', meterIcon: '📰',
    hook: 'Deadline in forty minutes. A tip just landed that could be the lead story  -  or a trap. Get it right, and get it fast.',
    beats: [
      {
        prompt: 'A source sends you an explosive claim about a local official. It’s huge  -  if it’s true.',
        choices: [
          { label: 'Verify with a second independent source first', outcome: 'Always. One source is a rumor. The fastest way to lose your readers is to be wrong.', delta: 3, tag: 'best' },
          { label: "Run it as 'sources say' to hedge", outcome: 'Weasel words don’t protect you. Verify it properly or hold the story.', delta: 1, tag: 'ok' },
          { label: 'Run it now  -  being first is everything', outcome: 'Being first and wrong ends careers. Accuracy comes before speed, always.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'The story checks out, but it’s complicated. How do you write the headline?',
        choices: [
          { label: 'Accurate and clear, even if it’s less flashy', outcome: 'That’s the craft. A headline that oversells is a promise the story can’t keep.', delta: 3, tag: 'best' },
          { label: 'Vague, so you can’t be wrong', outcome: 'A headline should inform, not dodge. Say what you actually know.', delta: 1, tag: 'ok' },
          { label: 'Sensational, to chase the clicks', outcome: 'Clickbait wins the minute and loses the reader. Trust is the entire business.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'You’re live on camera in ten seconds  -  and one fact is still unconfirmed.',
        choices: [
          { label: 'Report what’s confirmed, clearly flag what isn’t', outcome: "Exactly right. 'Here's what we know, here's what we don't' is how pros keep trust on live TV.", delta: 3, tag: 'best' },
          { label: 'Freeze and skip the story entirely', outcome: 'Composure matters on air  -  acknowledge the gap, don’t go silent.', delta: 1, tag: 'ok' },
          { label: 'State it as fact and correct it later if needed', outcome: 'A correction never catches up to the first claim. Don’t say what you can’t stand behind.', delta: 0, tag: 'bad' },
        ],
      },
    ],
    ace: 'That’s journalism. Fast, fair, and accurate under pressure  -  you earned the front page and the readers’ trust.',
    ok: 'Good instincts. Keep verifying before you publish and you’ll be a newsroom anchor.',
    low: 'The deadline got the better of you this time. Let’s practice chasing stories the right way.',
  },

  'financial-services': {
    title: 'The Nervous Client',
    meterLabel: 'Trust', meterIcon: '🤝',
    hook: 'A first-time investor sits across your desk with their life savings and a lot of fear. What you say next matters more than any number.',
    beats: [
      {
        prompt: 'The client wants to put everything into one “hot” stock a friend recommended.',
        choices: [
          { label: 'Explain diversification  -  don’t bet it all on one name', outcome: 'That’s the advice that protects people. One stock can soar  -  or take their savings with it.', delta: 3, tag: 'best' },
          { label: 'Suggest they sleep on it and read more first', outcome: 'Caution is good, but they came to you for guidance  -  name the risk clearly.', delta: 1, tag: 'ok' },
          { label: 'Steer them into your firm’s product instead', outcome: 'Never put your commission ahead of their interest. That’s how trust dies.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'They ask about a “guaranteed 30% return” offer they saw online.',
        choices: [
          { label: 'Warn them: guaranteed high returns are a classic scam sign', outcome: 'Exactly. If it sounds too good to be true, it is. You may have just saved their savings.', delta: 3, tag: 'best' },
          { label: 'Tell them to research it more carefully', outcome: 'Too soft  -  “guaranteed” returns are a red flag you should name out loud.', delta: 1, tag: 'ok' },
          { label: 'Say you can match that return', outcome: 'Now you’re the scam. Never promise what the market can’t guarantee.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'Markets drop 10% and the client calls in a panic, wanting to sell everything.',
        choices: [
          { label: 'Walk them through their long-term plan; don’t panic-sell', outcome: 'That’s the value of an advisor. Selling at the bottom locks in the loss  -  you kept them steady.', delta: 3, tag: 'best' },
          { label: 'Sell a small portion to ease their nerves', outcome: 'A compromise  -  but the plan existed for exactly this moment. Reassurance beats reaction.', delta: 1, tag: 'ok' },
          { label: 'Let it go to voicemail', outcome: 'When clients are scared is exactly when they need you. Avoidance breaks trust.', delta: 0, tag: 'bad' },
        ],
      },
    ],
    ace: 'That’s an advisor people stay with for life. Honest, calm, and always on their side. Well done.',
    ok: 'Solid. You put the client first  -  now sharpen the way you explain risk and you’ll be unstoppable.',
    low: 'Trust is built one honest answer at a time. Let’s practice the conversations at the desk.',
  },

  'education': {
    title: 'First Day Teaching',
    meterLabel: 'The Class', meterIcon: '🍎',
    hook: 'Twenty-eight pairs of eyes are on you. The lesson plan is ready  -  but the room? That part is up to you. Class is in session.',
    beats: [
      {
        prompt: 'Five minutes in, two students are talking and the back row is losing focus.',
        choices: [
          { label: 'Pull them in with a question and move closer', outcome: 'Proximity and engagement, not punishment. You redirected the energy instead of fighting it.', delta: 3, tag: 'best' },
          { label: 'Keep going and hope they settle', outcome: 'The distraction will spread. A good teacher manages the room, not just the material.', delta: 1, tag: 'ok' },
          { label: 'Call them out in front of everyone', outcome: 'Public embarrassment makes an enemy, not a learner. Redirect quietly instead.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'A student gives a wrong answer and looks embarrassed in front of the class.',
        choices: [
          { label: 'Find what’s right in their thinking, then guide them', outcome: 'Beautiful. You keep them safe to take risks  -  that’s how real learning happens.', delta: 3, tag: 'best' },
          { label: 'Give them the answer and move on', outcome: 'Faster, but you skipped the learning. The productive struggle is the point.', delta: 1, tag: 'ok' },
          { label: "Say 'no, that's wrong' and call on someone else", outcome: 'That student may never raise their hand again. Mistakes are part of learning.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'Half the class clearly gets it; half is lost. The bell rings in ten minutes.',
        choices: [
          { label: 'Pair the ones who get it with the ones who don’t', outcome: 'Peer teaching  -  students learn twice when they explain it. You just reached the whole room.', delta: 3, tag: 'best' },
          { label: 'Slow down and re-teach it to everyone', outcome: 'Kind  -  but you’ll lose the half who already got it. Differentiate instead.', delta: 1, tag: 'ok' },
          { label: 'Push ahead to finish the lesson plan', outcome: 'Covering material isn’t the same as students learning it. Don’t leave half behind.', delta: 0, tag: 'bad' },
        ],
      },
    ],
    ace: 'You didn’t just teach a lesson  -  you reached every student in the room. That’s a gift. They’re lucky to have you.',
    ok: 'A strong first day. Keep building those classroom instincts and you’ll inspire whole generations.',
    low: 'Every great teacher has a rocky first day. Let’s practice managing the room at the chalkboard.',
  },

  'arts-entertainment': {
    title: 'Opening Night',
    meterLabel: 'The Show', meterIcon: '🎭',
    hook: 'Curtain in one hour. The set is half-painted, your lead has stage fright, and a lighting cue keeps glitching. Make magic happen.',
    beats: [
      {
        prompt: 'Your lead actor freezes backstage, terrified, minutes before places.',
        choices: [
          { label: 'Ground them  -  breathe together, remind them why they love this', outcome: 'That’s directing people, not just scenes. A calm lead carries the entire show.', delta: 3, tag: 'best' },
          { label: 'Tell them to just push through it', outcome: 'Tough love rarely cures stage fright. They need a steady hand, not pressure.', delta: 1, tag: 'ok' },
          { label: 'Threaten to recast them on the spot', outcome: 'Fear on top of fear? You just guaranteed a worse performance.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'The set’s signature backdrop isn’t finished and time is nearly up.',
        choices: [
          { label: 'Paint where the audience looks; suggest the rest with light', outcome: 'Smart artistry. You can’t do everything  -  you do what reads from the back row.', delta: 3, tag: 'best' },
          { label: 'Try to finish every last detail', outcome: 'Admirable, but you’ll run out of time and finish nothing well. Prioritize the focal point.', delta: 1, tag: 'ok' },
          { label: 'Leave it blank  -  no one will notice', outcome: 'They will. An empty focal point pulls the eye right out of the story.', delta: 0, tag: 'bad' },
        ],
      },
      {
        prompt: 'The big number is live and a lighting cue misfires mid-song.',
        choices: [
          { label: 'Improvise  -  adjust the next cues and keep the energy up', outcome: 'Yes! The show goes on. The audience follows your confidence, not the glitch.', delta: 3, tag: 'best' },
          { label: 'Freeze and wait for someone to fix it', outcome: 'Hesitation reads from the back row. Lead through the mistake.', delta: 1, tag: 'ok' },
          { label: 'Stop the number and reset from the top', outcome: 'Never break the spell for a fixable hiccup. Roll with it.', delta: 0, tag: 'bad' },
        ],
      },
    ],
    ace: 'Bravo! You held the whole production together with calm and creativity. That standing ovation? You earned it.',
    ok: 'A show worth applauding. Trust your instincts a little more and the stage is yours.',
    low: 'Opening night is chaos for everyone. Let’s practice running the show piece by piece.',
  },
};

export function scenarioFor(slug: string): WorldScenario | null {
  return SCENARIOS[slug] ?? null;
}

// max attainable meter for a scenario (all "best" choices)
export function scenarioMax(s: WorldScenario): number {
  return s.beats.reduce((sum, b) => sum + Math.max(...b.choices.map(c => c.delta)), 0);
}

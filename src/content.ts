import type { FocusContent, MoodContent, MoodKey, RitualAction, SupportFocus } from './types';

export const BREATHING_STEPS = [
    { label: 'Inhale', seconds: 4, scale: '1.16' },
    { label: 'Hold', seconds: 4, scale: '1.16' },
    { label: 'Exhale', seconds: 6, scale: '0.92' },
    { label: 'Settle', seconds: 2, scale: '0.96' }
] as const;

export const moodContent: Record<MoodKey, MoodContent> = {
    overwhelmed: {
        label: 'Overwhelmed',
        hint: 'Too many inputs at once',
        reflection: 'There is a lot landing at once. Naming the pile instead of carrying it silently is already a stabilizing move.',
        brightSpot: 'Even under pressure, you paused long enough to look for traction instead of pure reaction.',
        steps: [
            'Shrink the problem to the next 15 minutes instead of the whole week.',
            'Move one demand out of your head and onto paper so your brain stops juggling it.',
            'Lower one expectation for tonight. Relief often starts with removing one thing, not adding three more.'
        ],
        reset: 'Try a 4-4-6 breath cycle and unclench your jaw on each exhale.'
    },
    anxious: {
        label: 'Anxious',
        hint: 'The body feels activated',
        reflection: 'Your system sounds activated, not broken. The goal is not to win an argument with the feeling, but to lower the volume a little.',
        brightSpot: 'You are paying attention early, which gives you a better chance to interrupt the spiral before it grows.',
        steps: [
            'Look around and name five visible objects to remind your body where you actually are.',
            'Write the main worry in one sentence, then write what is known right now in a second sentence.',
            'Choose one grounding action with movement: a walk, stretch, or shower counts.'
        ],
        reset: 'Use the breath cycle, then plant both feet on the floor before making your next decision.'
    },
    down: {
        label: 'Down',
        hint: 'Heavy or low-energy',
        reflection: 'This reads like a heavy moment. You do not need to feel bright to deserve care, rest, or support.',
        brightSpot: 'You still reached for reflection instead of shutting the door completely, and that matters.',
        steps: [
            'Pick one task that gives visible proof of care: fresh water, a snack, clean clothes, or a short walk.',
            'Send a low-pressure message to one safe person, even if it is only "rough day, saying hi."',
            'Set a tiny bar for today. A smaller promise is easier to keep than a perfect plan.'
        ],
        reset: 'Breathe slower on the exhale than the inhale and let your shoulders drop each round.'
    },
    lonely: {
        label: 'Lonely',
        hint: 'The moment feels disconnected',
        reflection: 'Feeling disconnected can make everything sound harsher. Reaching outward, even here, is still a form of connection.',
        brightSpot: 'You are noticing the need beneath the feeling, which is a stronger starting point than pretending it is not there.',
        steps: [
            'Send one specific invitation or check-in instead of waiting for the perfect moment to reconnect.',
            'Choose one place where people already gather around something you enjoy and spend ten minutes there.',
            'Offer yourself the same tone you would use with a friend who admitted they felt alone.'
        ],
        reset: 'Breathe in for four, out for six, and picture your chest softening instead of collapsing inward.'
    },
    grateful: {
        label: 'Grateful',
        hint: 'A calm or appreciative note',
        reflection: 'There is steadiness in this moment. Capturing it now makes it easier to find again when the day gets noisy.',
        brightSpot: 'You are not rushing past what feels good. That kind of attention builds resilience over time.',
        steps: [
            'Write one detail that made this moment good so it becomes easier to remember later.',
            'Share the appreciation with the person, place, or habit that helped create it.',
            'Bank the feeling by pairing it with one small ritual you can repeat tomorrow.'
        ],
        reset: 'Use the breathing cycle as a way to savor the moment, not only to recover from stress.'
    },
    hopeful: {
        label: 'Hopeful',
        hint: 'Forward motion is returning',
        reflection: 'There is movement here. Even cautious optimism deserves structure so it can turn into momentum.',
        brightSpot: 'You already have some forward energy, which means the next right step can be small and still be real progress.',
        steps: [
            'Name the first visible action connected to this hope and put it on today instead of "someday."',
            'Protect your momentum by deciding what you will ignore until that first action is done.',
            'Notice what sparked the shift so you can return to it when motivation dips.'
        ],
        reset: 'Breathe once through the full cycle, then use the calm to start the first small action.'
    },
    steady: {
        label: 'Steady',
        hint: 'Not great, not falling apart',
        reflection: 'You checked in before the moment got away from you. That kind of honest maintenance is a strength.',
        brightSpot: 'Awareness itself is useful. Not every check-in needs to start from crisis to be worth doing.',
        steps: [
            'Name the main thing you want more of from the rest of the day: rest, focus, connection, or space.',
            'Choose one habit that supports that need and make it the next thing you do.',
            'Leave yourself one sentence for later so your future self remembers what helped.'
        ],
        reset: 'Use the breathing cycle to stay regulated, not only to recover once you are already stressed.'
    }
};

export const focusContent: Record<SupportFocus, FocusContent> = {
    calm: {
        label: 'Calm',
        description: 'Slow the body first',
        laneText: 'This plan is optimizing for nervous-system steadiness before problem solving. We want less internal noise, not more pressure.',
        steps: [
            'Lengthen your exhale by two beats for the next minute before doing anything demanding.',
            'Reduce stimulation for ten minutes: fewer tabs, lower volume, softer light, or one quieter room.'
        ],
        resetCue: 'On each exhale, imagine the room getting slightly less sharp around you.'
    },
    clarity: {
        label: 'Clarity',
        description: 'Make the next move visible',
        laneText: 'This plan is narrowing the scope until the next honest step becomes obvious. Clarity often comes from subtraction.',
        steps: [
            'Write the next step as a short sentence that starts with a verb so it is harder to overthink.',
            'Name one thing that can wait until tomorrow so today has an actual boundary.'
        ],
        resetCue: 'On the final exhale, say the next step out loud in one sentence.'
    },
    connection: {
        label: 'Connection',
        description: 'Borrow steadiness from another human',
        laneText: 'This plan treats connection as regulation, not as a bonus. You do not have to metabolize every hard moment alone.',
        steps: [
            'Send one low-pressure message that tells the truth about your energy or asks for a small touchpoint.',
            'Choose one place, person, or group that feels slightly warmer than staying isolated with the spiral.'
        ],
        resetCue: 'Picture one safe person or space each time you exhale.'
    },
    rest: {
        label: 'Rest',
        description: 'Lower the demand level',
        laneText: 'This plan is making recovery possible by reducing pressure. Rest here means removing enough strain for your next step to become honest again.',
        steps: [
            'Trade one should for one supportive action: water, food, clean clothes, medication, or a short lie-down.',
            'Set the bar for tonight at recovery instead of maximum output.'
        ],
        resetCue: 'Let your shoulders drop farther on each exhale and stop bracing for a minute.'
    }
};

export const defaultFocusByMood: Record<MoodKey, SupportFocus> = {
    overwhelmed: 'clarity',
    anxious: 'calm',
    down: 'rest',
    lonely: 'connection',
    grateful: 'clarity',
    hopeful: 'clarity',
    steady: 'calm'
};

export const ritualActions: RitualAction[] = [
    {
        title: 'Exhale first',
        description: 'Use the first minute to settle your body before you problem-solve.',
        noteSeed: 'I want to slow this moment down before I decide what to do next.',
        focus: 'calm'
    },
    {
        title: 'Find the next step',
        description: 'Shrink the problem until one doable action becomes visible.',
        noteSeed: 'The smallest useful next step I can name right now is...',
        focus: 'clarity'
    },
    {
        title: 'Reach for a person',
        description: 'Borrow steadiness from connection instead of carrying this alone.',
        noteSeed: 'One person I could message or be near right now is...',
        focus: 'connection'
    },
    {
        title: 'Lower tonight’s bar',
        description: 'Swap pressure for enough care to get through this evening.',
        noteSeed: 'One thing I can let be unfinished tonight so I can recover is...',
        focus: 'rest'
    }
];

export const moodKeywords: Record<MoodKey, string[]> = {
    overwhelmed: ['overwhelmed', 'too much', 'buried', 'swamped', 'exhausted', 'drained', 'burned out'],
    anxious: ['anxious', 'anxiety', 'worried', 'panic', 'panicked', 'nervous', 'stress', 'stressed', 'fear'],
    down: ['sad', 'down', 'empty', 'hopeless', 'cry', 'crying', 'depressed', 'low'],
    lonely: ['lonely', 'alone', 'isolated', 'left out', 'disconnected', 'nobody'],
    grateful: ['grateful', 'thankful', 'appreciate', 'blessed', 'relieved'],
    hopeful: ['hopeful', 'optimistic', 'better', 'excited', 'ready', 'motivated'],
    steady: ['okay', 'fine', 'steady', 'calm', 'neutral']
};

export const crisisPatterns = [
    /kill myself/i,
    /suicid/i,
    /end my life/i,
    /hurt myself/i,
    /harm myself/i,
    /self harm/i,
    /want to die/i,
    /can't go on/i,
    /hurt someone/i
];

export const promptDeck = [
    'What feels loudest in your mind right now?',
    'What would make tonight feel 10 percent lighter?',
    'Where do you feel this most in your body?',
    'What do you wish someone understood without a long explanation?',
    'What is one part of this moment you can make smaller?',
    'What kind of support would feel most believable right now?'
];

export const writingPrompts = [
    'Start with: Right now I feel...',
    'Start with: The part I keep replaying is...',
    'Start with: What I need most in this moment is...',
    'Start with: The next kind thing I can do is...'
];

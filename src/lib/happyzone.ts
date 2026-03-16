import { crisisPatterns, defaultFocusByMood, focusContent, moodContent, moodKeywords } from '../content';
import type { BuiltPlan, CheckInEntry, MoodKey, SupportFocus, ThemeMode } from '../types';

const STORAGE_KEY = 'happyzone.checkins.v2';
const THEME_KEY = 'happyzone.theme.v1';
export const HISTORY_LIMIT = 6;

const validationByMood: Record<MoodKey, string> = {
    overwhelmed: 'It sounds like you are carrying a lot right now.',
    anxious: 'It sounds like your system is on alert right now.',
    down: 'It sounds like things feel heavy right now.',
    lonely: 'It sounds like this feels lonely right now.',
    grateful: 'It sounds like you are noticing something steady right now.',
    hopeful: 'It sounds like some momentum is coming back.',
    steady: 'It sounds like you are taking honest stock of where you are.'
};

const microActionByMood: Record<MoodKey, string> = {
    overwhelmed: 'Set both feet on the floor and press them down for 30 seconds.',
    anxious: 'Exhale for twice as long as you inhale for six breaths.',
    down: 'Drink a glass of cold water slowly.',
    lonely: 'Roll your shoulders back five times and loosen your jaw.',
    grateful: 'Place a hand on your chest and take three slow breaths.',
    hopeful: 'Stand up and stretch your arms overhead for 30 seconds.',
    steady: 'Unclench your jaw and take six slow breaths.'
};

const distortionRules = [
    {
        label: 'catastrophizing',
        patterns: [
            /\b(worst|disaster|ruined|falling apart|can't handle|spiral|panic|too much)\b/i
        ],
        reframe: 'This may be catastrophizing. This moment can be hard without meaning the worst outcome is already here.'
    },
    {
        label: 'all-or-nothing thinking',
        patterns: [
            /\b(always|never|nothing|everything|completely|totally|no one|everyone)\b/i
        ],
        reframe: 'This may be all-or-nothing thinking. One hard part does not define the whole situation.'
    },
    {
        label: 'mind reading',
        patterns: [
            /\b(they think|they must think|everyone thinks|they hate me|they do not care|they don't care)\b/i
        ],
        reframe: 'This may be mind reading. You may not have enough evidence yet to know what others think.'
    },
    {
        label: 'fortune telling',
        patterns: [
            /\b(will never|won't get better|going to fail|nothing will change|can never)\b/i
        ],
        reframe: 'This may be fortune telling. A painful prediction is still not the same as a fact.'
    },
    {
        label: 'should statements',
        patterns: [
            /\b(should|shouldn't|must|have to|supposed to)\b/i
        ],
        reframe: 'This may be a harsh should statement. A gentler next step can help more than a rule.'
    }
] as const;

export function isMoodKey(value: unknown): value is MoodKey {
    return typeof value === 'string' && value in moodContent;
}

export function isSupportFocus(value: unknown): value is SupportFocus {
    return typeof value === 'string' && value in focusContent;
}

export function resolveFocusFromMood(mood: MoodKey): SupportFocus {
    return defaultFocusByMood[mood];
}

export function loadCheckIns(): CheckInEntry[] {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        const normalized = parsed.flatMap((item) => {
            if (!item || typeof item !== 'object') {
                return [];
            }

            const mood = isMoodKey((item as { mood?: unknown }).mood) ? (item as { mood: MoodKey }).mood : null;
            if (!mood) {
                return [];
            }

            const note = typeof (item as { note?: unknown }).note === 'string' ? (item as { note: string }).note : '';
            if (!note) {
                return [];
            }

            const createdAt = typeof (item as { createdAt?: unknown }).createdAt === 'string'
                ? (item as { createdAt: string }).createdAt
                : new Date().toISOString();

            const focus = isSupportFocus((item as { focus?: unknown }).focus)
                ? (item as { focus: SupportFocus }).focus
                : resolveFocusFromMood(mood);

            return [{
                id: typeof (item as { id?: unknown }).id === 'string'
                    ? (item as { id: string }).id
                    : `${createdAt}-${mood}`,
                mood,
                focus,
                note,
                summary: typeof (item as { summary?: unknown }).summary === 'string'
                    ? (item as { summary: string }).summary
                    : summarizeNote(note),
                crisis: Boolean((item as { crisis?: unknown }).crisis),
                createdAt
            }];
        });

        return normalized.slice(0, HISTORY_LIMIT);
    } catch {
        return [];
    }
}

export function saveCheckIns(entries: CheckInEntry[]): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
}

export function loadTheme(): ThemeMode {
    try {
        const savedTheme = window.localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
            return savedTheme;
        }
    } catch {
        return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemeMode): void {
    document.documentElement.dataset.theme = theme;

    try {
        window.localStorage.setItem(THEME_KEY, theme);
    } catch {
        // Ignore localStorage failures and keep the in-memory theme.
    }
}

export function inferMood(note: string): MoodKey {
    const lowered = note.toLowerCase();
    let winningMood: MoodKey = 'steady';
    let winningScore = 0;

    (Object.keys(moodKeywords) as MoodKey[]).forEach((mood) => {
        const score = moodKeywords[mood].reduce((total, keyword) => (
            lowered.includes(keyword) ? total + 1 : total
        ), 0);

        if (score > winningScore) {
            winningMood = mood;
            winningScore = score;
        }
    });

    return winningMood;
}

export function detectCrisis(note: string): boolean {
    return crisisPatterns.some((pattern) => pattern.test(note));
}

export function summarizeNote(note: string): string {
    const cleaned = note.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 90) {
        return cleaned;
    }
    return `${cleaned.slice(0, 87).trimEnd()}...`;
}

export function formatRelativeTime(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.round(diff / 60000);

    if (minutes < 1) {
        return 'just now';
    }
    if (minutes < 60) {
        return `${minutes} min ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return `${hours} hr ago`;
    }

    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
}

function detectDistortion(note: string): string {
    for (const rule of distortionRules) {
        if (rule.patterns.some((pattern) => pattern.test(note))) {
            return rule.reframe;
        }
    }

    return 'This may be emotional reasoning. The feeling is real, and the full picture may be wider than it feels right now.';
}

export function buildPlan(note: string, mood: MoodKey, crisis: boolean): BuiltPlan {
    if (crisis) {
        return {
            validation: 'It sounds like this feels very intense right now.',
            reframe: 'This kind of pain can make it seem like there is no next step, but that feeling can ease with live support.',
            microAction: 'Put space between yourself and anything you could use to hurt yourself while you call or text 988.'
        };
    }

    return {
        validation: validationByMood[mood],
        reframe: detectDistortion(note),
        microAction: microActionByMood[mood]
    };
}

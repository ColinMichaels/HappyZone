import { crisisPatterns, defaultFocusByMood, focusContent, moodContent, moodKeywords, supportSignalPatterns } from '../content';
import type { BuiltPlan, CheckInEntry, MoodKey, SupportAnalytics, SupportFocus, SupportPreference, SupportRecommendation, ThemeMode } from '../types';

const STORAGE_KEY = 'happyzone.checkins.v2';
const THEME_KEY = 'happyzone.theme.v1';
const SUPPORT_ANALYTICS_KEY = 'happyzone.support.analytics.v1';
const SUPPORT_PREFERENCE_KEY = 'happyzone.support.preference.v1';
const DISCLAIMER_ACK_KEY = 'happyzone.disclaimer.ack.v1';
export const STORED_CHECKIN_LIMIT = 42;
export const RECENT_CHECKIN_PREVIEW_LIMIT = 6;

const SUPPORT_PREFERENCE_SECRET = 'happyzone-support-pref-v1';
const SUPPORT_PREFERENCE_SALT = 'happyzone-support-pref-salt';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const defaultSupportAnalytics: SupportAnalytics = {
    supportButtonOpened: 0,
    supportResourcesUsed: 0,
    safetyPlanOpened: 0,
    personalizedRecommendationOptIns: 0,
    lastOpenedAt: null
};

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

        return normalized.slice(0, STORED_CHECKIN_LIMIT);
    } catch {
        return [];
    }
}

export function saveCheckIns(entries: CheckInEntry[]): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, STORED_CHECKIN_LIMIT)));
}

export function mergeCheckInEntry(entries: CheckInEntry[], entry: CheckInEntry): {
    entries: CheckInEntry[];
    activeEntry: CheckInEntry;
    isDuplicate: boolean;
} {
    const latestEntry = entries[0];

    if (
        latestEntry &&
        latestEntry.note === entry.note &&
        latestEntry.mood === entry.mood &&
        latestEntry.focus === entry.focus
    ) {
        return {
            entries,
            activeEntry: latestEntry,
            isDuplicate: true
        };
    }

    return {
        entries: [entry, ...entries].slice(0, STORED_CHECKIN_LIMIT),
        activeEntry: entry,
        isDuplicate: false
    };
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

export function loadDisclaimerAcknowledged(): boolean {
    try {
        return window.localStorage.getItem(DISCLAIMER_ACK_KEY) === 'true';
    } catch {
        return false;
    }
}

export function saveDisclaimerAcknowledged(): void {
    try {
        window.localStorage.setItem(DISCLAIMER_ACK_KEY, 'true');
    } catch {
        // Keep the session functional even if localStorage is unavailable.
    }
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

export function detectSupportSignal(note: string): boolean {
    return detectCrisis(note) || supportSignalPatterns.some((pattern) => pattern.test(note));
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

function toBase64(bytes: Uint8Array): string {
    let output = '';

    bytes.forEach((byte) => {
        output += String.fromCharCode(byte);
    });

    return btoa(output);
}

function fromBase64(value: string): ArrayBuffer {
    const decoded = atob(value);
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0)).buffer;
}

async function getSupportPreferenceKey(): Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(`${window.location.origin}:${SUPPORT_PREFERENCE_SECRET}`),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(SUPPORT_PREFERENCE_SALT),
            iterations: 100_000,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: 256
        },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function loadSupportPreference(): Promise<SupportPreference | null> {
    try {
        const raw = window.localStorage.getItem(SUPPORT_PREFERENCE_KEY);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as { iv?: string; cipherText?: string };
        if (typeof parsed.iv !== 'string' || typeof parsed.cipherText !== 'string') {
            return null;
        }

        const key = await getSupportPreferenceKey();
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: fromBase64(parsed.iv)
            },
            key,
            fromBase64(parsed.cipherText)
        );

        const parsedPreference = JSON.parse(decoder.decode(decrypted)) as Partial<SupportPreference>;
        if (
            typeof parsedPreference.personalizedRecommendations !== 'boolean' ||
            typeof parsedPreference.updatedAt !== 'string'
        ) {
            return null;
        }

        return {
            personalizedRecommendations: parsedPreference.personalizedRecommendations,
            updatedAt: parsedPreference.updatedAt
        };
    } catch {
        return null;
    }
}

export async function saveSupportPreference(preference: SupportPreference): Promise<void> {
    const key = await getSupportPreferenceKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv
        },
        key,
        encoder.encode(JSON.stringify(preference))
    );

    window.localStorage.setItem(SUPPORT_PREFERENCE_KEY, JSON.stringify({
        iv: toBase64(iv),
        cipherText: toBase64(new Uint8Array(encrypted))
    }));
}

export function loadSupportAnalytics(): SupportAnalytics {
    try {
        const raw = window.localStorage.getItem(SUPPORT_ANALYTICS_KEY);
        if (!raw) {
            return defaultSupportAnalytics;
        }

        const parsed = JSON.parse(raw) as Partial<SupportAnalytics>;
        return {
            supportButtonOpened: typeof parsed.supportButtonOpened === 'number' ? parsed.supportButtonOpened : 0,
            supportResourcesUsed: typeof parsed.supportResourcesUsed === 'number' ? parsed.supportResourcesUsed : 0,
            safetyPlanOpened: typeof parsed.safetyPlanOpened === 'number' ? parsed.safetyPlanOpened : 0,
            personalizedRecommendationOptIns: typeof parsed.personalizedRecommendationOptIns === 'number' ? parsed.personalizedRecommendationOptIns : 0,
            lastOpenedAt: typeof parsed.lastOpenedAt === 'string' ? parsed.lastOpenedAt : null
        };
    } catch {
        return defaultSupportAnalytics;
    }
}

export function trackSupportAnalytics(event: 'modal-opened' | 'resource-used' | 'safety-plan-opened' | 'opt-in-enabled'): SupportAnalytics {
    const current = loadSupportAnalytics();
    const next: SupportAnalytics = {
        ...current,
        lastOpenedAt: event === 'modal-opened' ? new Date().toISOString() : current.lastOpenedAt
    };

    if (event === 'modal-opened') {
        next.supportButtonOpened += 1;
    }

    if (event === 'resource-used') {
        next.supportResourcesUsed += 1;
    }

    if (event === 'safety-plan-opened') {
        next.safetyPlanOpened += 1;
    }

    if (event === 'opt-in-enabled') {
        next.personalizedRecommendationOptIns += 1;
    }

    window.localStorage.setItem(SUPPORT_ANALYTICS_KEY, JSON.stringify(next));
    return next;
}

export function buildSupportRecommendation(note: string): SupportRecommendation | null {
    const lowered = note.toLowerCase();

    if (/(hurt myself|harm myself|self harm|kill myself|suicid|end my life)/i.test(note)) {
        return {
            title: 'Start with live help now',
            detail: 'The safest next move is contacting live support instead of staying alone with this.',
            resourceId: 'lifeline-call'
        };
    }

    if (/(hopeless|can't go on|want to disappear|no point|do not want to be here|trapped)/i.test(note)) {
        return {
            title: 'Open the safety plan first',
            detail: 'Use the template to name warning signs, one coping step, and one person you can contact next.',
            resourceId: 'safety-plan'
        };
    }

    if (/(panic|panicked|overwhelmed|spiral|scared|afraid)/i.test(lowered)) {
        return {
            title: 'Text support if calling feels like too much',
            detail: 'Starting with a text can lower friction when the body is activated.',
            resourceId: 'crisis-text'
        };
    }

    if (/(alone|lonely|isolated|nobody|no one)/i.test(lowered)) {
        return {
            title: 'Use the safety plan to identify one person',
            detail: 'The template can help you choose one contact before the feeling gets louder.',
            resourceId: 'safety-plan'
        };
    }

    return null;
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

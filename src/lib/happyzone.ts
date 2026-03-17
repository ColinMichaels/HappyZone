import { crisisPatterns, defaultFocusByMood, focusContent, moodContent, moodKeywords, supportSignalPatterns, validationByMood, microActionByMood, distortionRules } from '../content';
import { BRAND_CONFIG } from '../brandConfig';
import type {
    BuiltPlan,
    CalendarExport,
    CheckInEntry,
    MoodKey,
    ProgressSummary,
    ReminderEntry,
    SupportAnalytics,
    SupportFocus,
    SupportPreference,
    SupportRecommendation,
    ThemeMode,
    VisitSnapshot
} from '../types';

const CHECKIN_STORAGE_KEY = 'happyzone.checkins.v2';
const REMINDER_STORAGE_KEY = 'happyzone.reminders.v1';
const VISIT_SNAPSHOT_KEY = 'happyzone.visit-snapshot.v1';
const THEME_KEY = 'happyzone.theme.v1';
const SUPPORT_ANALYTICS_KEY = 'happyzone.support.analytics.v1';
const SUPPORT_PREFERENCE_KEY = 'happyzone.support.preference.v1';
const DISCLAIMER_ACK_KEY = 'happyzone.disclaimer.ack.v1';

export const STORED_CHECKIN_LIMIT = 42;
export const STORED_REMINDER_LIMIT = 84;
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

const defaultVisitSnapshot: VisitSnapshot = {
    lastSeenAt: null
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

function padDateValue(value: number): string {
    return String(value).padStart(2, '0');
}

function toLocalDateKeyFromDate(date: Date): string {
    return `${date.getFullYear()}-${padDateValue(date.getMonth() + 1)}-${padDateValue(date.getDate())}`;
}

function isValidDate(value: string): boolean {
    return !Number.isNaN(new Date(value).getTime());
}

function sortReminders(reminders: ReminderEntry[]): ReminderEntry[] {
    return [...reminders].sort((left, right) => {
        const leftCompleted = left.completedAt ? 1 : 0;
        const rightCompleted = right.completedAt ? 1 : 0;

        if (leftCompleted !== rightCompleted) {
            return leftCompleted - rightCompleted;
        }

        return new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime();
    });
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return count === 1 ? singular : plural;
}

function shiftMinutes(timestamp: string, minutes: number): string {
    const next = new Date(timestamp);
    next.setMinutes(next.getMinutes() + minutes);
    return next.toISOString();
}

function escapeIcsText(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,');
}

function formatIcsDate(timestamp: string | Date): string {
    const value = timestamp instanceof Date ? timestamp : new Date(timestamp);

    return `${value.getUTCFullYear()}${padDateValue(value.getUTCMonth() + 1)}${padDateValue(value.getUTCDate())}T${padDateValue(value.getUTCHours())}${padDateValue(value.getUTCMinutes())}${padDateValue(value.getUTCSeconds())}Z`;
}

function getDominantMood(entries: CheckInEntry[]): MoodKey | null {
    if (entries.length === 0) {
        return null;
    }

    const counts = new Map<MoodKey, number>();

    entries.forEach((entry) => {
        counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
    });

    let dominantMood = entries[0].mood;
    let dominantCount = counts.get(dominantMood) ?? 0;

    entries.forEach((entry) => {
        const currentCount = counts.get(entry.mood) ?? 0;

        if (currentCount > dominantCount) {
            dominantMood = entry.mood;
            dominantCount = currentCount;
        }
    });

    return dominantMood;
}

function getEntryStreak(entries: CheckInEntry[]): number {
    const uniqueDays = Array.from(new Set(entries.map((entry) => toCalendarDateKey(entry.createdAt))));

    if (uniqueDays.length === 0) {
        return 0;
    }

    let streak = 1;
    let expectedDate = fromCalendarDateKey(uniqueDays[0]);

    for (let index = 1; index < uniqueDays.length; index += 1) {
        expectedDate = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate() - 1, 12, 0, 0, 0);

        if (uniqueDays[index] !== toCalendarDateKey(expectedDate)) {
            break;
        }

        streak += 1;
    }

    return streak;
}

function getReferenceEntries(entries: CheckInEntry[], lastSeenAt: string | null): CheckInEntry[] {
    if (lastSeenAt) {
        const lastSeenTimestamp = new Date(lastSeenAt).getTime();
        const freshEntries = entries.filter((entry) => new Date(entry.createdAt).getTime() > lastSeenTimestamp);

        if (freshEntries.length > 0) {
            return freshEntries.slice(0, 5);
        }
    }

    return entries.slice(0, 5);
}

export function isMoodKey(value: unknown): value is MoodKey {
    return typeof value === 'string' && value in moodContent;
}

export function isSupportFocus(value: unknown): value is SupportFocus {
    return typeof value === 'string' && value in focusContent;
}

export function resolveFocusFromMood(mood: MoodKey): SupportFocus {
    return defaultFocusByMood[mood];
}

export function toCalendarDateKey(timestamp: string | Date): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return toLocalDateKeyFromDate(date);
}

export function fromCalendarDateKey(dateKey: string): Date {
    const [year, month, day] = dateKey.split('-').map((segment) => Number(segment));
    return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function loadCheckIns(): CheckInEntry[] {
    try {
        const raw = window.localStorage.getItem(CHECKIN_STORAGE_KEY);
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

            const createdAt = typeof (item as { createdAt?: unknown }).createdAt === 'string' && isValidDate((item as { createdAt: string }).createdAt)
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
    window.localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(entries.slice(0, STORED_CHECKIN_LIMIT)));
}

export function loadReminders(): ReminderEntry[] {
    try {
        const raw = window.localStorage.getItem(REMINDER_STORAGE_KEY);
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

            const title = typeof (item as { title?: unknown }).title === 'string'
                ? (item as { title: string }).title.trim()
                : '';
            const scheduledFor = typeof (item as { scheduledFor?: unknown }).scheduledFor === 'string'
                ? (item as { scheduledFor: string }).scheduledFor
                : '';
            const checkInId = typeof (item as { checkInId?: unknown }).checkInId === 'string'
                ? (item as { checkInId: string }).checkInId
                : '';

            if (!title || !checkInId || !scheduledFor || !isValidDate(scheduledFor)) {
                return [];
            }

            const createdAt = typeof (item as { createdAt?: unknown }).createdAt === 'string' && isValidDate((item as { createdAt: string }).createdAt)
                ? (item as { createdAt: string }).createdAt
                : new Date().toISOString();
            const completedAt = typeof (item as { completedAt?: unknown }).completedAt === 'string' && isValidDate((item as { completedAt: string }).completedAt)
                ? (item as { completedAt: string }).completedAt
                : null;

            return [{
                id: typeof (item as { id?: unknown }).id === 'string'
                    ? (item as { id: string }).id
                    : `${checkInId}-${scheduledFor}`,
                checkInId,
                title,
                note: typeof (item as { note?: unknown }).note === 'string' ? (item as { note: string }).note : '',
                scheduledFor,
                createdAt,
                completedAt
            }];
        });

        return sortReminders(normalized).slice(0, STORED_REMINDER_LIMIT);
    } catch {
        return [];
    }
}

export function saveReminders(reminders: ReminderEntry[]): void {
    window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(sortReminders(reminders).slice(0, STORED_REMINDER_LIMIT)));
}

export function clearSavedLocalData(): void {
    try {
        [
            CHECKIN_STORAGE_KEY,
            REMINDER_STORAGE_KEY,
            VISIT_SNAPSHOT_KEY,
            SUPPORT_ANALYTICS_KEY,
            SUPPORT_PREFERENCE_KEY
        ].forEach((key) => window.localStorage.removeItem(key));
    } catch {
        // Ignore storage clearing failures so the UI can remain usable.
    }
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

export function mergeReminderEntry(reminders: ReminderEntry[], reminder: ReminderEntry): {
    reminders: ReminderEntry[];
    reminder: ReminderEntry;
    isDuplicate: boolean;
} {
    const existingReminder = reminders.find((item) => (
        item.checkInId === reminder.checkInId &&
        item.title === reminder.title &&
        item.scheduledFor === reminder.scheduledFor &&
        item.completedAt === reminder.completedAt
    ));

    if (existingReminder) {
        return {
            reminders,
            reminder: existingReminder,
            isDuplicate: true
        };
    }

    const nextReminders = sortReminders([
        reminder,
        ...reminders.filter((item) => item.id !== reminder.id)
    ]).slice(0, STORED_REMINDER_LIMIT);

    return {
        reminders: nextReminders,
        reminder,
        isDuplicate: false
    };
}

export function toggleReminderCompletion(reminders: ReminderEntry[], reminderId: string): ReminderEntry[] {
    return sortReminders(reminders.map((reminder) => {
        if (reminder.id !== reminderId) {
            return reminder;
        }

        return {
            ...reminder,
            completedAt: reminder.completedAt ? null : new Date().toISOString()
        };
    }));
}

export function getRemindersForCheckIn(reminders: ReminderEntry[], checkInId: string): ReminderEntry[] {
    return reminders.filter((reminder) => reminder.checkInId === checkInId);
}

export function loadVisitSnapshot(): VisitSnapshot {
    try {
        const raw = window.localStorage.getItem(VISIT_SNAPSHOT_KEY);
        if (!raw) {
            return defaultVisitSnapshot;
        }

        const parsed = JSON.parse(raw) as Partial<VisitSnapshot>;
        return {
            lastSeenAt: typeof parsed.lastSeenAt === 'string' && isValidDate(parsed.lastSeenAt)
                ? parsed.lastSeenAt
                : null
        };
    } catch {
        return defaultVisitSnapshot;
    }
}

export function saveVisitSnapshot(snapshot: VisitSnapshot): void {
    window.localStorage.setItem(VISIT_SNAPSHOT_KEY, JSON.stringify(snapshot));
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

export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    const targetTime = new Date(timestamp).getTime();
    if (Number.isNaN(targetTime)) {
        return 'just now';
    }

    const diff = targetTime - Date.now();
    const future = diff > 0;
    const minutes = Math.round(Math.abs(diff) / 60000);

    if (minutes < 1) {
        return future ? 'soon' : 'just now';
    }
    if (minutes < 60) {
        return future ? `in ${minutes} min` : `${minutes} min ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return future ? `in ${hours} hr` : `${hours} hr ago`;
    }

    const days = Math.round(hours / 24);
    return future
        ? `in ${days} ${pluralize(days, 'day')}`
        : `${days} ${pluralize(days, 'day')} ago`;
}

export function formatDateTime(timestamp: string): string {
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(new Date(timestamp));
}

export function formatCalendarMonth(timestamp: string | Date): string {
    const value = timestamp instanceof Date ? timestamp : new Date(timestamp);

    return new Intl.DateTimeFormat(undefined, {
        month: 'long',
        year: 'numeric'
    }).format(value);
}

export function formatCalendarDay(dateKey: string): string {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    }).format(fromCalendarDateKey(dateKey));
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

export function buildProgressSummary(
    entries: CheckInEntry[],
    reminders: ReminderEntry[],
    lastSeenAt: string | null,
    now = new Date().toISOString()
): ProgressSummary | null {
    if (entries.length === 0 && reminders.length === 0) {
        return null;
    }

    const nowTimestamp = new Date(now).getTime();
    const pendingReminders = reminders.filter((reminder) => !reminder.completedAt);
    const dueReminders = pendingReminders.filter((reminder) => new Date(reminder.scheduledFor).getTime() <= nowTimestamp);
    const upcomingReminders = pendingReminders
        .filter((reminder) => new Date(reminder.scheduledFor).getTime() > nowTimestamp)
        .slice(0, 3);
    const entriesSinceLastVisit = lastSeenAt
        ? entries.filter((entry) => new Date(entry.createdAt).getTime() > new Date(lastSeenAt).getTime()).length
        : 0;
    const streakDays = getEntryStreak(entries);
    const dominantMood = getDominantMood(getReferenceEntries(entries, lastSeenAt));
    const lastEntryAt = entries[0]?.createdAt ?? null;

    let headline = `${entries.length} saved ${pluralize(entries.length, 'check-in')} on this device`;

    if (dueReminders.length > 0) {
        headline = `${dueReminders.length} ${pluralize(dueReminders.length, 'reminder')} ready to revisit`;
    } else if (lastSeenAt && entriesSinceLastVisit > 0) {
        headline = `${entriesSinceLastVisit} new ${pluralize(entriesSinceLastVisit, 'check-in')} since your last visit`;
    } else if (streakDays > 1) {
        headline = `${streakDays}-day reflection streak`;
    }

    const detailParts: string[] = [];

    if (streakDays > 0) {
        detailParts.push(`${streakDays}-day streak`);
    }

    if (dominantMood) {
        detailParts.push(`recent mood: ${moodContent[dominantMood].label.toLowerCase()}`);
    }

    if (dueReminders.length > 0) {
        detailParts.push(`${dueReminders.length} due now`);
    } else if (upcomingReminders[0]) {
        detailParts.push(`next reminder ${formatRelativeTime(upcomingReminders[0].scheduledFor)}`);
    } else if (lastEntryAt) {
        detailParts.push(`last check-in ${formatRelativeTime(lastEntryAt)}`);
    }

    return {
        headline,
        detail: detailParts.join(' • '),
        entriesSinceLastVisit,
        streakDays,
        dominantMood,
        lastEntryAt,
        dueReminders,
        upcomingReminders
    };
}

export function buildIcsCalendarExport(
    entries: CheckInEntry[],
    reminders: ReminderEntry[],
    generatedAt = new Date().toISOString()
): CalendarExport {
    const dtStamp = formatIcsDate(generatedAt);
    const entriesById = new Map(entries.map((entry) => [entry.id, entry]));
    const eventBlocks: string[] = [];

    entries.forEach((entry) => {
        eventBlocks.push([
            'BEGIN:VEVENT',
            `UID:checkin-${entry.id}@happyzone.local`,
            `DTSTAMP:${dtStamp}`,
            `DTSTART:${formatIcsDate(entry.createdAt)}`,
            `DTEND:${formatIcsDate(shiftMinutes(entry.createdAt, 15))}`,
            `SUMMARY:${escapeIcsText(`${BRAND_CONFIG.name} check-in: ${moodContent[entry.mood].label}`)}`,
            `DESCRIPTION:${escapeIcsText(`Focus: ${focusContent[entry.focus].label}\nSummary: ${entry.summary}`)}`,
            `CATEGORIES:${BRAND_CONFIG.name},Journal`,
            'END:VEVENT'
        ].join('\r\n'));
    });

    reminders.forEach((reminder) => {
        const entry = entriesById.get(reminder.checkInId);
        const descriptionLines = [
            reminder.note.trim() || `Scheduled reminder from ${BRAND_CONFIG.name}.`,
            entry ? `Linked check-in: ${entry.summary}` : 'Linked check-in unavailable on this device.'
        ];
        const lines = [
            'BEGIN:VEVENT',
            `UID:reminder-${reminder.id}@happyzone.local`,
            `DTSTAMP:${dtStamp}`,
            `DTSTART:${formatIcsDate(reminder.scheduledFor)}`,
            `DTEND:${formatIcsDate(shiftMinutes(reminder.scheduledFor, 30))}`,
            `SUMMARY:${escapeIcsText(reminder.title)}`,
            `DESCRIPTION:${escapeIcsText(descriptionLines.join('\n'))}`,
            `CATEGORIES:${BRAND_CONFIG.name},Reminder`
        ];

        if (!reminder.completedAt) {
            lines.push(
                'BEGIN:VALARM',
                'TRIGGER:-PT30M',
                'ACTION:DISPLAY',
                `DESCRIPTION:${escapeIcsText(reminder.title)}`,
                'END:VALARM'
            );
        }

        lines.push('END:VEVENT');
        eventBlocks.push(lines.join('\r\n'));
    });

    return {
        filename: `${BRAND_CONFIG.name.toLowerCase().replace(/\s+/g, '-')}-calendar-${toCalendarDateKey(generatedAt).replace(/-/g, '')}.ics`,
        content: [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            `PRODID:-//${BRAND_CONFIG.name}//Private Check-in Calendar//EN`,
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            `X-WR-CALNAME:${BRAND_CONFIG.name}`,
            ...eventBlocks,
            'END:VCALENDAR',
            ''
        ].join('\r\n')
    };
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

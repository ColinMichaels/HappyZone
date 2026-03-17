export type MoodKey = 'overwhelmed' | 'anxious' | 'down' | 'lonely' | 'grateful' | 'hopeful' | 'steady';
export type SupportFocus = 'calm' | 'clarity' | 'connection' | 'rest';
export type ThemeMode = 'light' | 'dark';
export type StatusState = 'default' | 'error' | 'success' | 'info';
export type WizardStep = 'mood' | 'support' | 'journal';

export interface MoodContent {
    label: string;
    hint: string;
    reflection: string;
    brightSpot: string;
    steps: string[];
    reset: string;
}

export interface FocusContent {
    label: string;
    description: string;
    laneText: string;
    steps: [string, string];
    resetCue: string;
}

export interface RitualAction {
    title: string;
    description: string;
    noteSeed: string;
    focus: SupportFocus;
}

export interface CheckInEntry {
    id: string;
    mood: MoodKey;
    focus: SupportFocus;
    note: string;
    summary: string;
    crisis: boolean;
    createdAt: string;
}

export interface ReminderEntry {
    id: string;
    checkInId: string;
    title: string;
    note: string;
    scheduledFor: string;
    createdAt: string;
    completedAt: string | null;
}

export interface VisitSnapshot {
    lastSeenAt: string | null;
}

export interface ProgressSummary {
    headline: string;
    detail: string;
    entriesSinceLastVisit: number;
    streakDays: number;
    dominantMood: MoodKey | null;
    lastEntryAt: string | null;
    dueReminders: ReminderEntry[];
    upcomingReminders: ReminderEntry[];
}

export interface CalendarExport {
    filename: string;
    content: string;
}

export interface BuiltPlan {
    validation: string;
    reframe: string;
    microAction: string;
}

export interface SupportResource {
    id: string;
    title: string;
    detail: string;
    actionLabel: string;
    href: string;
    kind: 'call' | 'text' | 'link';
}

export interface SupportRecommendation {
    title: string;
    detail: string;
    resourceId: string;
}

export interface SupportPreference {
    personalizedRecommendations: boolean;
    updatedAt: string;
}

export interface SupportAnalytics {
    supportButtonOpened: number;
    supportResourcesUsed: number;
    safetyPlanOpened: number;
    personalizedRecommendationOptIns: number;
    lastOpenedAt: string | null;
}

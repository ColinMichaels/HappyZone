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

export interface BuiltPlan {
    validation: string;
    reframe: string;
    microAction: string;
}

import type { IconType } from 'react-icons';
import {
    MdAir,
    MdArrowBack,
    MdArrowForward,
    MdAssignmentTurnedIn,
    MdBedtime,
    MdBolt,
    MdCall,
    MdCalendarMonth,
    MdCenterFocusStrong,
    MdCloudQueue,
    MdDarkMode,
    MdDownload,
    MdFavoriteBorder,
    MdHistory,
    MdInfoOutline,
    MdInsights,
    MdLightMode,
    MdPeopleOutline,
    MdPersonOutline,
    MdPsychology,
    MdSave,
    MdSms,
    MdSpa,
    MdVisibility,
    MdWarningAmber,
    MdWaves,
    MdWbSunny
} from 'react-icons/md';

import type { MoodKey, SupportFocus } from '../types';

const moodIcons: Record<MoodKey, IconType> = {
    overwhelmed: MdWaves,
    anxious: MdBolt,
    down: MdCloudQueue,
    lonely: MdPersonOutline,
    grateful: MdFavoriteBorder,
    hopeful: MdWbSunny,
    steady: MdSpa
};

const focusIcons: Record<SupportFocus, IconType> = {
    calm: MdAir,
    clarity: MdVisibility,
    connection: MdPeopleOutline,
    rest: MdBedtime
};

const toolIcons: Record<string, IconType> = {
    breathing: MdAir,
    grounding: MdCenterFocusStrong,
    reframe: MdPsychology
};

const supportResourceIcons: Record<string, IconType> = {
    'lifeline-call': MdCall,
    emergency: MdWarningAmber,
    'crisis-text': MdSms,
    'safety-plan': MdAssignmentTurnedIn
};

export const utilityIcons = {
    light: MdLightMode,
    dark: MdDarkMode,
    info: MdInfoOutline,
    history: MdHistory,
    insights: MdInsights,
    calmingTools: MdSpa,
    calendar: MdCalendarMonth,
    download: MdDownload,
    previous: MdArrowBack,
    next: MdArrowForward,
    save: MdSave,
    warning: MdWarningAmber,
    breathing: MdAir,
    grounding: MdCenterFocusStrong,
    reframe: MdPsychology
} as const;

export function getChoiceIcon(variant: 'mood' | 'focus', value: string): IconType | null {
    if (variant === 'mood') {
        return moodIcons[value as MoodKey] ?? null;
    }

    return focusIcons[value as SupportFocus] ?? null;
}

export function getToolIcon(value: string): IconType | null {
    return toolIcons[value] ?? null;
}

export function getSupportResourceIcon(value: string): IconType | null {
    return supportResourceIcons[value] ?? null;
}

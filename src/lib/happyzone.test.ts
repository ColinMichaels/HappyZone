import {
    buildPlan,
    buildSupportRecommendation,
    detectSupportSignal,
    inferMood,
    mergeCheckInEntry,
    trackSupportAnalytics
} from './happyzone';

describe('happyzone logic', () => {
    it('detects support-signal language from journal text', () => {
        expect(detectSupportSignal('I feel hopeless and trapped.')).toBe(true);
        expect(detectSupportSignal('Today felt steady and manageable.')).toBe(false);
    });

    it('builds a resource recommendation that matches the journal risk pattern', () => {
        expect(buildSupportRecommendation('I feel hopeless and there is no point.')).toEqual({
            title: 'Open the safety plan first',
            detail: 'Use the template to name warning signs, one coping step, and one person you can contact next.',
            resourceId: 'safety-plan'
        });

        expect(buildSupportRecommendation('I am panicked and overwhelmed.')).toEqual({
            title: 'Text support if calling feels like too much',
            detail: 'Starting with a text can lower friction when the body is activated.',
            resourceId: 'crisis-text'
        });
    });

    it('builds a CBT-style plan for standard check-ins and urgent copy for crisis check-ins', () => {
        expect(buildPlan('I am worried about everything and it feels like the worst outcome is coming.', 'anxious', false)).toEqual({
            validation: 'It sounds like your system is on alert right now.',
            reframe: 'This may be catastrophizing. This moment can be hard without meaning the worst outcome is already here.',
            microAction: 'Exhale for twice as long as you inhale for six breaths.'
        });

        expect(buildPlan('I want to hurt myself.', 'down', true)).toEqual({
            validation: 'It sounds like this feels very intense right now.',
            reframe: 'This kind of pain can make it seem like there is no next step, but that feeling can ease with live support.',
            microAction: 'Put space between yourself and anything you could use to hurt yourself while you call or text 988.'
        });
    });

    it('infers mood from the note and tracks support analytics locally', () => {
        expect(inferMood('I am anxious, stressed, and worried about tomorrow.')).toBe('anxious');

        const analytics = trackSupportAnalytics('modal-opened');
        expect(analytics.supportButtonOpened).toBe(1);
        expect(analytics.lastOpenedAt).not.toBeNull();
    });

    it('does not add a duplicate when the newest saved entry matches the current draft exactly', () => {
        const existingEntry = {
            id: 'entry-1',
            mood: 'anxious' as const,
            focus: 'calm' as const,
            note: 'I am worried about everything and need to slow down.',
            summary: 'I am worried about everything and need to slow down.',
            crisis: false,
            createdAt: '2026-03-16T10:00:00.000Z'
        };

        const duplicateAttempt = {
            ...existingEntry,
            id: 'entry-2',
            createdAt: '2026-03-16T10:01:00.000Z'
        };

        expect(mergeCheckInEntry([existingEntry], duplicateAttempt)).toEqual({
            entries: [existingEntry],
            activeEntry: existingEntry,
            isDuplicate: true
        });
    });
});

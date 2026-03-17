import {
    applyTheme,
    buildIcsCalendarExport,
    buildPlan,
    buildProgressSummary,
    buildSupportRecommendation,
    clearSavedLocalData,
    detectSupportSignal,
    inferMood,
    loadCheckIns,
    loadDisclaimerAcknowledged,
    loadReminders,
    loadSupportAnalytics,
    loadSupportPreference,
    loadTheme,
    loadVisitSnapshot,
    mergeCheckInEntry,
    saveCheckIns,
    saveDisclaimerAcknowledged,
    saveReminders,
    saveSupportPreference,
    saveVisitSnapshot,
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

    it('summarizes progress with streak and reminder counts for a returning session', () => {
        const entries = [
            {
                id: 'entry-2',
                mood: 'hopeful' as const,
                focus: 'clarity' as const,
                note: 'I can see a useful next step again.',
                summary: 'I can see a useful next step again.',
                crisis: false,
                createdAt: '2026-03-16T09:00:00.000Z'
            },
            {
                id: 'entry-1',
                mood: 'anxious' as const,
                focus: 'calm' as const,
                note: 'Yesterday felt noisy, but I slowed down.',
                summary: 'Yesterday felt noisy, but I slowed down.',
                crisis: false,
                createdAt: '2026-03-15T09:00:00.000Z'
            }
        ];

        const reminders = [
            {
                id: 'reminder-1',
                checkInId: 'entry-1',
                title: 'Revisit your calm plan',
                note: 'Notice whether the breathing cue helped.',
                scheduledFor: '2026-03-16T08:00:00.000Z',
                createdAt: '2026-03-15T09:05:00.000Z',
                completedAt: null
            },
            {
                id: 'reminder-2',
                checkInId: 'entry-2',
                title: 'Check in before tomorrow starts',
                note: '',
                scheduledFor: '2026-03-17T08:00:00.000Z',
                createdAt: '2026-03-16T09:05:00.000Z',
                completedAt: null
            }
        ];

        expect(buildProgressSummary(
            entries,
            reminders,
            '2026-03-16T07:30:00.000Z',
            '2026-03-16T12:00:00.000Z'
        )).toMatchObject({
            headline: '1 reminder ready to revisit',
            entriesSinceLastVisit: 1,
            streakDays: 2,
            dominantMood: 'hopeful'
        });
    });

    it('builds an ICS export with journal events and reminder alarms', () => {
        const entries = [
            {
                id: 'entry-1',
                mood: 'anxious' as const,
                focus: 'calm' as const,
                note: 'I feel on edge.',
                summary: 'I feel on edge.',
                crisis: false,
                createdAt: '2026-03-16T10:00:00.000Z'
            }
        ];

        const reminders = [
            {
                id: 'reminder-1',
                checkInId: 'entry-1',
                title: 'Revisit your calm plan',
                note: 'See if the breath work helped.',
                scheduledFor: '2026-03-17T15:00:00.000Z',
                createdAt: '2026-03-16T10:05:00.000Z',
                completedAt: null
            }
        ];

        const calendarExport = buildIcsCalendarExport(entries, reminders, '2026-03-16T12:00:00.000Z');

        expect(calendarExport.filename).toBe('happyzone-calendar-20260316.ics');
        expect(calendarExport.content).toContain('BEGIN:VCALENDAR');
        expect(calendarExport.content).toContain('SUMMARY:HappyZone check-in: Anxious');
        expect(calendarExport.content).toContain('SUMMARY:Revisit your calm plan');
        expect(calendarExport.content).toContain('BEGIN:VALARM');
    });

    it('clears saved local data without resetting theme or disclaimer acknowledgement', async () => {
        saveCheckIns([{
            id: 'entry-1',
            mood: 'steady',
            focus: 'calm',
            note: 'I am checking in.',
            summary: 'I am checking in.',
            crisis: false,
            createdAt: '2026-03-16T10:00:00.000Z'
        }]);
        saveReminders([{
            id: 'reminder-1',
            checkInId: 'entry-1',
            title: 'Check back in',
            note: '',
            scheduledFor: '2026-03-17T10:00:00.000Z',
            createdAt: '2026-03-16T10:05:00.000Z',
            completedAt: null
        }]);
        saveVisitSnapshot({
            lastSeenAt: '2026-03-16T09:00:00.000Z'
        });
        trackSupportAnalytics('modal-opened');
        await saveSupportPreference({
            personalizedRecommendations: true,
            updatedAt: '2026-03-16T10:10:00.000Z'
        });
        applyTheme('dark');
        saveDisclaimerAcknowledged();

        clearSavedLocalData();

        expect(loadCheckIns()).toEqual([]);
        expect(loadReminders()).toEqual([]);
        expect(loadVisitSnapshot()).toEqual({
            lastSeenAt: null
        });
        expect(loadSupportAnalytics()).toMatchObject({
            supportButtonOpened: 0,
            supportResourcesUsed: 0,
            safetyPlanOpened: 0,
            personalizedRecommendationOptIns: 0,
            lastOpenedAt: null
        });
        expect(await loadSupportPreference()).toBeNull();
        expect(loadTheme()).toBe('dark');
        expect(loadDisclaimerAcknowledged()).toBe(true);
    });
});

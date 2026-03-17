import { useEffect, useRef, useState } from 'react';

import { focusContent, moodContent, promptDeck, ritualActions, writingPrompts } from './content';
import { CalendarPanel } from './components/CalendarPanel';
import { ChoiceGrid } from './components/ChoiceGrid';
import { Header } from './components/Header';
import { HistoryPanel } from './components/HistoryPanel';
import { JournalStep } from './components/JournalStep';
import { LearnMoreFooter } from './components/LearnMoreFooter';
import { PlanOutput } from './components/PlanOutput';
import { ProgressSummaryPanel } from './components/ProgressSummaryPanel';
import { DisclaimerModal } from './components/DisclaimerModal';
import { SupportModal } from './components/SupportModal';
import { ThoughtReframerModal } from './components/ThoughtReframerModal';
import { CalmingToolsPanel } from './components/CalmingToolsPanel';
import {
    applyTheme,
    buildIcsCalendarExport,
    buildProgressSummary,
    buildSupportRecommendation,
    clearSavedLocalData,
    detectCrisis,
    detectSupportSignal,
    getRemindersForCheckIn,
    inferMood,
    loadCheckIns,
    loadDisclaimerAcknowledged,
    loadReminders,
    loadSupportPreference,
    loadTheme,
    loadVisitSnapshot,
    mergeCheckInEntry,
    mergeReminderEntry,
    prefersReducedMotion,
    resolveFocusFromMood,
    saveCheckIns,
    saveDisclaimerAcknowledged,
    saveReminders,
    saveSupportPreference,
    saveVisitSnapshot,
    summarizeNote,
    toggleReminderCompletion,
    trackSupportAnalytics
} from './lib/happyzone';
import { utilityIcons } from './lib/materialIcons';
import { BRAND_CONFIG } from './brandConfig';
import type { CheckInEntry, MoodKey, ReminderEntry, StatusState, SupportFocus, ThemeMode, WizardStep } from './types';

interface FormStatus {
    message: string;
    state: StatusState;
}

interface AppBootstrap {
    checkIns: CheckInEntry[];
    reminders: ReminderEntry[];
    lastSeenAt: string | null;
}

type WorkspaceView = 'checkin' | 'plan' | 'calendar' | 'tools' | 'history';

const emptyStatus: FormStatus = {
    message: '',
    state: 'default'
};

function loadBootstrap(): AppBootstrap {
    const checkIns = loadCheckIns();
    const reminders = loadReminders();
    const visitSnapshot = loadVisitSnapshot();

    return {
        checkIns,
        reminders,
        lastSeenAt: visitSnapshot.lastSeenAt
    };
}

export default function App() {
    const bootstrapRef = useRef<AppBootstrap | null>(null);

    if (!bootstrapRef.current) {
        bootstrapRef.current = loadBootstrap();
    }

    const bootstrap = bootstrapRef.current;
    const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
    const [step, setStep] = useState<WizardStep>('mood');
    const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
    const [selectedFocus, setSelectedFocus] = useState<SupportFocus | null>(null);
    const [hasManualFocusSelection, setHasManualFocusSelection] = useState(false);
    const [note, setNote] = useState('');
    const [status, setStatus] = useState<FormStatus>(emptyStatus);
    const [checkIns, setCheckIns] = useState<CheckInEntry[]>(bootstrap.checkIns);
    const [reminders, setReminders] = useState<ReminderEntry[]>(bootstrap.reminders);
    const [activeEntry, setActiveEntry] = useState<CheckInEntry | null>(bootstrap.checkIns[0] ?? null);
    const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(() => !loadDisclaimerAcknowledged());
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [isThoughtReframerOpen, setIsThoughtReframerOpen] = useState(false);
    const [personalizedSupportRecommendations, setPersonalizedSupportRecommendations] = useState(false);
    const [promptIndex, setPromptIndex] = useState(() => new Date().getDate() % promptDeck.length);
    const [calendarExportStatus, setCalendarExportStatus] = useState('');
    const [mobileView, setMobileView] = useState<WorkspaceView>(() => (bootstrap.checkIns[0] ? 'plan' : 'checkin'));
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isWizardActive = mobileView === 'checkin';
    const isProgressionActive = isWizardActive && step !== 'mood';

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        document.title = `${BRAND_CONFIG.name} | ${BRAND_CONFIG.tagline}`;
    }, []);

    useEffect(() => {
        saveVisitSnapshot({
            lastSeenAt: new Date().toISOString()
        });
    }, []);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 440)}px`;
    }, [note, step]);

    useEffect(() => {
        let cancelled = false;

        loadSupportPreference().then((preference) => {
            if (!cancelled && preference) {
                setPersonalizedSupportRecommendations(preference.personalizedRecommendations);
            }
        }).catch(() => {
            // Keep the default opt-out state if local preference loading fails.
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const progressSummary = buildProgressSummary(checkIns, reminders, bootstrap.lastSeenAt);
    const noteLength = note.trim().length;
    const supportSignalDetected = noteLength > 0 && detectSupportSignal(note);
    const supportRecommendation = personalizedSupportRecommendations
        ? buildSupportRecommendation(note)
        : null;
    const selectedMoodLabel = selectedMood ? moodContent[selectedMood].label : 'auto-detect';
    const selectedFocusLabel = selectedFocus ? focusContent[selectedFocus].label : 'choose later';
    const activeFocus = selectedFocus ?? activeEntry?.focus ?? 'calm';
    const breathingInstruction = focusContent[activeFocus].resetCue;
    const WarningIcon = utilityIcons.warning;
    const activeEntryReminders = activeEntry ? getRemindersForCheckIn(reminders, activeEntry.id) : [];
    const workspaceTabs = [
        {
            view: 'checkin' as const,
            label: 'Check-in',
            icon: utilityIcons.journal,
            badge: null
        },
        {
            view: 'plan' as const,
            label: 'Plan',
            icon: utilityIcons.plan,
            badge: activeEntryReminders.length > 0 ? activeEntryReminders.length : null
        },
        {
            view: 'calendar' as const,
            label: 'Calendar',
            icon: utilityIcons.calendar,
            badge: reminders.length > 0 ? reminders.length : null
        },
        {
            view: 'tools' as const,
            label: 'Tools',
            icon: utilityIcons.calmingTools,
            badge: null
        },
        {
            view: 'history' as const,
            label: 'History',
            icon: utilityIcons.history,
            badge: checkIns.length > 0 ? checkIns.length : null
        }
    ];

    const moodItems = (Object.keys(moodContent) as MoodKey[]).map((key) => ({
        value: key,
        title: moodContent[key].label,
        copy: moodContent[key].hint
    }));

    const focusItems = (Object.keys(focusContent) as SupportFocus[]).map((key) => ({
        value: key,
        title: focusContent[key].label,
        copy: focusContent[key].description
    }));

    function focusJournalSoon() {
        setMobileView('checkin');
        window.setTimeout(() => textareaRef.current?.focus(), 0);
    }

    function focusSectionSoon(sectionId: string, nextView: WorkspaceView) {
        setMobileView(nextView);
        window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start'
        }), 0);
    }

    function focusPlanSoon() {
        focusSectionSoon('planOutput', 'plan');
    }

    function openEntry(entry: CheckInEntry, message: string) {
        setActiveEntry(entry);
        setStatus({
            message,
            state: 'info'
        });
        focusPlanSoon();
    }

    function handleSelectMood(nextMood: MoodKey) {
        setSelectedMood(nextMood);

        if (!hasManualFocusSelection || selectedFocus === null) {
            setSelectedFocus(resolveFocusFromMood(nextMood));
        }
    }

    function handleSelectFocus(nextFocus: SupportFocus) {
        setSelectedFocus(nextFocus);
        setHasManualFocusSelection(true);
    }

    function appendSeed(seed: string) {
        setStep('journal');
        setNote((current) => {
            const trimmed = current.trim();
            return trimmed ? `${trimmed}\n\n${seed}` : seed;
        });
        focusJournalSoon();
    }

    function handleApplyRitual(focus: SupportFocus, seed: string, title: string) {
        setSelectedFocus(focus);
        setHasManualFocusSelection(true);
        appendSeed(seed);
        setStatus({
            message: `Loaded "${title}" and tuned support to ${focusContent[focus].label}.`,
            state: 'info'
        });
    }

    function handleNoteChange(nextNote: string) {
        setNote(nextNote);

        if (status.state === 'error' && nextNote.trim().length >= 12) {
            setStatus(emptyStatus);
        }
    }

    function resetDraft(nextStatus: FormStatus = emptyStatus) {
        setSelectedMood(null);
        setSelectedFocus(null);
        setHasManualFocusSelection(false);
        setNote('');
        setIsSupportModalOpen(false);
        setIsThoughtReframerOpen(false);
        setStatus(nextStatus);
        setStep('mood');
        setMobileView('checkin');
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedNote = note.trim();
        if (trimmedNote.length < 12) {
            setStatus({
                message: 'Write a little more so the app has enough signal to build a useful plan.',
                state: 'error'
            });
            textareaRef.current?.focus();
            return;
        }

        const mood = selectedMood ?? inferMood(trimmedNote);
        const focus = selectedFocus ?? resolveFocusFromMood(mood);
        const crisis = detectCrisis(trimmedNote);
        const entry: CheckInEntry = {
            id: crypto.randomUUID(),
            mood,
            focus,
            note: trimmedNote,
            summary: summarizeNote(trimmedNote),
            crisis,
            createdAt: new Date().toISOString()
        };

        const result = mergeCheckInEntry(checkIns, entry);
        setCheckIns(result.entries);
        setActiveEntry(result.activeEntry);

        if (!result.isDuplicate) {
            saveCheckIns(result.entries);
        }

        resetDraft();
        focusPlanSoon();
    }

    function clearForm() {
        resetDraft({
            message: 'Ready for a new check-in.',
            state: 'default'
        });
    }

    async function handlePersonalizedSupportChange(enabled: boolean) {
        setPersonalizedSupportRecommendations(enabled);

        try {
            await saveSupportPreference({
                personalizedRecommendations: enabled,
                updatedAt: new Date().toISOString()
            });

            if (enabled) {
                trackSupportAnalytics('opt-in-enabled');
            }
        } catch {
            setStatus({
                message: 'Support preference could not be saved. The current choice will apply for this session.',
                state: 'info'
            });
        }
    }

    function handleCreateReminder(entry: CheckInEntry, draft: { title: string; note: string; scheduledFor: string }): boolean {
        const reminder: ReminderEntry = {
            id: crypto.randomUUID(),
            checkInId: entry.id,
            title: draft.title,
            note: draft.note,
            scheduledFor: draft.scheduledFor,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        const result = mergeReminderEntry(reminders, reminder);

        if (!result.isDuplicate) {
            setReminders(result.reminders);
            saveReminders(result.reminders);
        }

        return result.isDuplicate;
    }

    function handleToggleReminder(reminderId: string) {
        const nextReminders = toggleReminderCompletion(reminders, reminderId);
        setReminders(nextReminders);
        saveReminders(nextReminders);
    }

    function handleOpenReminder(reminder: ReminderEntry) {
        const linkedEntry = checkIns.find((entry) => entry.id === reminder.checkInId);

        if (!linkedEntry) {
            setStatus({
                message: 'The reminder is saved, but its linked journal entry is not available on this device.',
                state: 'info'
            });
            return;
        }

        openEntry(linkedEntry, `Loaded the plan linked to "${reminder.title}".`);
    }

    function handleExportCalendar() {
        if (checkIns.length === 0 && reminders.length === 0) {
            setCalendarExportStatus('Save a check-in or reminder before exporting a calendar file.');
            return;
        }

        const calendarExport = buildIcsCalendarExport(checkIns, reminders);
        const calendarBlob = new Blob([calendarExport.content], {
            type: 'text/calendar;charset=utf-8'
        });
        const downloadUrl = window.URL.createObjectURL(calendarBlob);
        const link = document.createElement('a');

        link.href = downloadUrl;
        link.download = calendarExport.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);
        setCalendarExportStatus(`Downloaded ${calendarExport.filename}. Import it into Google, Apple, or Outlook to add these events.`);
    }

    function handleClearSavedData() {
        clearSavedLocalData();
        setCheckIns([]);
        setReminders([]);
        setActiveEntry(null);
        setPersonalizedSupportRecommendations(false);
        setCalendarExportStatus('');
        resetDraft();
    }

    return (
        <div className="min-h-screen bg-halo-bg text-halo-text">
            <div className="halo-aura halo-aura-one"></div>
            <div className="halo-aura halo-aura-two"></div>

            <div className="app-frame relative mx-auto flex min-h-screen w-full flex-col px-0 py-0 sm:px-6 sm:py-6">
                <Header theme={theme} onThemeChange={setTheme} minimal={isWizardActive} />

                <main className="app-main mt-4">
                    {!isWizardActive && (
                        <div className="app-summary-row">
                            <ProgressSummaryPanel
                                summary={progressSummary}
                                onOpenReminder={handleOpenReminder}
                                onToggleReminder={handleToggleReminder}
                            />
                        </div>
                    )}

                    {!isProgressionActive && (
                        <nav className="mobile-workspace-nav" aria-label="Workspace sections" role="tablist">
                            {workspaceTabs.map((tab) => {
                                const TabIcon = tab.icon;

                                return (
                                    <button
                                        key={tab.view}
                                        id={`workspace-tab-${tab.view}`}
                                        aria-controls={`workspace-panel-${tab.view}`}
                                        aria-selected={mobileView === tab.view}
                                        className="mobile-workspace-tab"
                                        data-active={mobileView === tab.view}
                                        onClick={() => setMobileView(tab.view)}
                                        role="tab"
                                        type="button"
                                    >
                                        <span className="mobile-workspace-tab-icon-wrap">
                                            <TabIcon className="utility-icon" aria-hidden="true" />
                                            {tab.badge ? (
                                                <span className="mobile-workspace-tab-badge" aria-hidden="true">
                                                    {Math.min(tab.badge, 99)}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className="mobile-workspace-tab-label">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    )}

                    <div className="app-columns">
                        <div className="app-primary-column">
                            <div
                                id="workspace-panel-checkin"
                                aria-labelledby="workspace-tab-checkin"
                                className="workspace-panel"
                                data-mobile-active={mobileView === 'checkin'}
                                role="tabpanel"
                            >
                                <form className="wizard-flow" onSubmit={handleSubmit} noValidate>
                                    {step === 'mood' ? (
                                        <section className="halo-panel wizard-step px-4 py-4 sm:px-6">
                                            <div className="space-y-2">
                                                <h2 className="halo-section-title">How are you feeling?</h2>
                                            </div>

                                            <div className="mt-5">
                                                <ChoiceGrid
                                                    ariaLabel="Mood selection"
                                                    items={moodItems}
                                                    selectedValue={selectedMood}
                                                    variant="mood"
                                                    onSelect={(value) => handleSelectMood(value as MoodKey)}
                                                />
                                            </div>

                                            <div className="wizard-actions mt-5">
                                                <button className="halo-button-primary" onClick={() => setStep('support')} type="button">Next</button>
                                            </div>
                                        </section>
                                    ) : null}

                                    {step === 'support' ? (
                                        <section className="halo-panel wizard-step px-4 py-4 sm:px-6">
                                            <div className="space-y-2">
                                                <h2 className="halo-section-title">What do you need right now?</h2>
                                            </div>

                                            <div className="mt-5">
                                                <ChoiceGrid
                                                    ariaLabel="Support selection"
                                                    items={focusItems}
                                                    selectedValue={selectedFocus}
                                                    variant="focus"
                                                    onSelect={(value) => handleSelectFocus(value as SupportFocus)}
                                                />
                                            </div>

                                            <div className="wizard-actions wizard-actions-between mt-5">
                                                <button className="halo-button-secondary" onClick={() => setStep('mood')} type="button">Back</button>
                                                <button
                                                    className="halo-button-primary"
                                                    onClick={() => {
                                                        setStep('journal');
                                                        focusJournalSoon();
                                                    }}
                                                    type="button"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </section>
                                    ) : null}

                                    {step === 'journal' ? (
                                        <JournalStep
                                            selectedMoodLabel={selectedMoodLabel}
                                            selectedFocusLabel={selectedFocusLabel}
                                            prompt={promptDeck[promptIndex]}
                                            prompts={writingPrompts}
                                            rituals={ritualActions}
                                            note={note}
                                            statusMessage={status.message}
                                            statusState={status.state}
                                            textareaRef={textareaRef}
                                            onBack={() => setStep('support')}
                                            onNoteChange={handleNoteChange}
                                            onShufflePrompt={() => setPromptIndex((current) => (current + 1) % promptDeck.length)}
                                            onApplyPrompt={appendSeed}
                                            onApplyRitual={(ritual) => handleApplyRitual(ritual.focus, ritual.noteSeed, ritual.title)}
                                            onOpenThoughtReframer={() => setIsThoughtReframerOpen(true)}
                                        />
                                    ) : null}

                                    {step === 'journal' && noteLength > 0 ? (
                                        <div className="wizard-sticky-bar">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-6 text-halo-muted truncate">
                                                    {noteLength >= 12 ? (
                                                        <>
                                                            <span className="sm:hidden">Ready</span>
                                                            <span className="hidden sm:inline">Ready to generate your plan.</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="sm:hidden">More...</span>
                                                            <span className="hidden sm:inline">Keep writing for a focused plan.</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {supportSignalDetected && (
                                                    <button
                                                        className="support-trigger-button px-2"
                                                        aria-label="Get support"
                                                        aria-controls="supportModal"
                                                        aria-expanded={isSupportModalOpen}
                                                        aria-haspopup="dialog"
                                                        onClick={() => {
                                                            setIsSupportModalOpen(true);
                                                            trackSupportAnalytics('modal-opened');
                                                        }}
                                                        type="button"
                                                    >
                                                        <WarningIcon className="button-icon m-0" aria-hidden="true" />
                                                        <span className="hidden sm:inline ml-1">Support</span>
                                                    </button>
                                                )}
                                                <button className="halo-button-primary whitespace-nowrap" disabled={noteLength < 12} type="submit">
                                                    {noteLength >= 12 ? 'Generate plan' : 'Next'}
                                                </button>
                                                <button className="halo-button-secondary hidden sm:inline-flex" onClick={clearForm} type="button">Clear</button>
                                            </div>
                                        </div>
                                    ) : null}
                                </form>
                            </div>

                            <div
                                id="workspace-panel-plan"
                                aria-labelledby="workspace-tab-plan"
                                className="workspace-panel"
                                data-mobile-active={mobileView === 'plan'}
                                role="tabpanel"
                            >
                                <PlanOutput
                                    entry={activeEntry}
                                    reminders={activeEntryReminders}
                                    onCreateReminder={handleCreateReminder}
                                    onToggleReminder={handleToggleReminder}
                                />
                            </div>
                        </div>

                        <div className={`app-secondary-column ${isWizardActive ? 'hidden lg:block' : ''}`}>
                            <div
                                id="workspace-panel-calendar"
                                aria-labelledby="workspace-tab-calendar"
                                className="workspace-panel"
                                data-mobile-active={mobileView === 'calendar'}
                                role="tabpanel"
                            >
                                <CalendarPanel
                                    entries={checkIns}
                                    reminders={reminders}
                                    onSelectEntry={(entry) => openEntry(entry, 'Loaded a saved check-in.')}
                                    onToggleReminder={handleToggleReminder}
                                    onExportCalendar={handleExportCalendar}
                                    exportStatusMessage={calendarExportStatus}
                                />
                            </div>

                            <div
                                id="workspace-panel-tools"
                                aria-labelledby="workspace-tab-tools"
                                className="workspace-panel"
                                data-mobile-active={mobileView === 'tools'}
                                role="tabpanel"
                            >
                                <CalmingToolsPanel
                                    breathingInstruction={breathingInstruction}
                                    onOpenThoughtReframer={() => setIsThoughtReframerOpen(true)}
                                />
                            </div>

                            <div
                                id="workspace-panel-history"
                                aria-labelledby="workspace-tab-history"
                                className="workspace-panel"
                                data-mobile-active={mobileView === 'history'}
                                role="tabpanel"
                            >
                                <HistoryPanel
                                    entries={checkIns}
                                    onSelect={(entry) => openEntry(entry, 'Loaded a saved check-in.')}
                                />
                            </div>
                        </div>
                    </div>
                </main>

                {(!isWizardActive || checkIns.length === 0) && (
                    <LearnMoreFooter
                        savedCheckInCount={checkIns.length}
                        savedReminderCount={reminders.length}
                        onClearSavedData={handleClearSavedData}
                    />
                )}

                <DisclaimerModal
                    isOpen={isDisclaimerOpen}
                    onAcknowledge={() => {
                        saveDisclaimerAcknowledged();
                        setIsDisclaimerOpen(false);
                    }}
                />

                <SupportModal
                    isOpen={isSupportModalOpen}
                    personalizedRecommendations={personalizedSupportRecommendations}
                    recommendation={supportRecommendation}
                    onClose={() => setIsSupportModalOpen(false)}
                    onPersonalizedChange={handlePersonalizedSupportChange}
                />

                <ThoughtReframerModal
                    isOpen={isThoughtReframerOpen}
                    onClose={() => setIsThoughtReframerOpen(false)}
                    onApplyBalancedTruth={(value) => {
                        const prefix = 'Balanced truth: ';
                        setStep('journal');
                        setNote((current) => current.trim() ? `${current}\n\n${prefix}${value}` : `${prefix}${value}`);
                        setStatus({
                            message: 'Balanced thought added to your journal.',
                            state: 'info'
                        });
                        setIsThoughtReframerOpen(false);
                        focusJournalSoon();
                    }}
                />
            </div>
        </div>
    );
}

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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

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
        window.setTimeout(() => textareaRef.current?.focus(), 0);
    }

    function focusPlanSoon() {
        window.setTimeout(() => document.getElementById('planOutput')?.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start'
        }), 0);
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

            <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-4 sm:px-6 sm:py-6">
                <Header theme={theme} onThemeChange={setTheme} />

                <main className="mt-4 grid gap-4">
                    <ProgressSummaryPanel
                        summary={progressSummary}
                        onOpenReminder={handleOpenReminder}
                        onToggleReminder={handleToggleReminder}
                    />

                    <form className="wizard-flow" onSubmit={handleSubmit} noValidate>
                        {step === 'mood' ? (
                            <section className="halo-panel wizard-step px-5 py-5 sm:px-6">
                                <div className="space-y-2">
                                    <p className="halo-eyebrow">Step 1 of 3</p>
                                    <h2 className="halo-section-title">Mood</h2>
                                    <p className="halo-helper-text">Choose the feeling that fits best, or move on and let the journal speak first.</p>
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
                                    <p className="halo-helper-text">Selections stay editable as you move through the check-in.</p>
                                    <button className="halo-button-primary" onClick={() => setStep('support')} type="button">Next</button>
                                </div>
                            </section>
                        ) : null}

                        {step === 'support' ? (
                            <section className="halo-panel wizard-step px-5 py-5 sm:px-6">
                                <div className="space-y-2">
                                    <p className="halo-eyebrow">Step 2 of 3</p>
                                    <h2 className="halo-section-title">Support</h2>
                                    <p className="halo-helper-text">
                                        {selectedMood ? `Mood selected: ${moodContent[selectedMood].label}.` : 'No mood selected. You can keep this flexible.'}
                                    </p>
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
                                <div>
                                    <p className="halo-field-label">Ready when you are</p>
                                    <p className="text-sm leading-6 text-halo-muted">
                                        {noteLength >= 12
                                            ? 'Generate a grounded plan from this check-in.'
                                            : 'Write a little more so the plan has enough signal.'}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    {supportSignalDetected ? (
                                        <button
                                            className="support-trigger-button"
                                            aria-controls="supportModal"
                                            aria-expanded={isSupportModalOpen}
                                            aria-haspopup="dialog"
                                            onClick={() => {
                                                setIsSupportModalOpen(true);
                                                trackSupportAnalytics('modal-opened');
                                            }}
                                            type="button"
                                        >
                                            <WarningIcon className="button-icon" aria-hidden="true" />
                                            Get support
                                        </button>
                                    ) : null}
                                    <button className="halo-button-primary" disabled={noteLength < 12} type="submit">Generate plan</button>
                                    <button className="halo-button-secondary" onClick={clearForm} type="button">Clear</button>
                                </div>
                            </div>
                        ) : null}
                    </form>

                    <PlanOutput
                        entry={activeEntry}
                        reminders={activeEntryReminders}
                        onCreateReminder={handleCreateReminder}
                        onToggleReminder={handleToggleReminder}
                    />

                    <CalendarPanel
                        entries={checkIns}
                        reminders={reminders}
                        onSelectEntry={(entry) => openEntry(entry, 'Loaded a saved check-in.')}
                        onToggleReminder={handleToggleReminder}
                        onExportCalendar={handleExportCalendar}
                        exportStatusMessage={calendarExportStatus}
                    />

                    <CalmingToolsPanel
                        breathingInstruction={breathingInstruction}
                        onOpenThoughtReframer={() => setIsThoughtReframerOpen(true)}
                    />

                    <HistoryPanel
                        entries={checkIns}
                        onSelect={(entry) => openEntry(entry, 'Loaded a saved check-in.')}
                    />
                </main>

                <LearnMoreFooter
                    savedCheckInCount={checkIns.length}
                    savedReminderCount={reminders.length}
                    onClearSavedData={handleClearSavedData}
                />

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

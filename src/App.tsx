import { useEffect, useRef, useState } from 'react';

import { focusContent, moodContent, promptDeck, ritualActions, writingPrompts } from './content';
import { applyTheme, detectCrisis, HISTORY_LIMIT, inferMood, loadCheckIns, loadTheme, resolveFocusFromMood, saveCheckIns, summarizeNote } from './lib/happyzone';
import type { CheckInEntry, MoodKey, StatusState, SupportFocus, ThemeMode, WizardStep } from './types';
import { ChoiceGrid } from './components/ChoiceGrid';
import { Header } from './components/Header';
import { HistoryPanel } from './components/HistoryPanel';
import { JournalStep } from './components/JournalStep';
import { LearnMoreFooter } from './components/LearnMoreFooter';
import { PlanOutput } from './components/PlanOutput';

interface FormStatus {
    message: string;
    state: StatusState;
}

const emptyStatus: FormStatus = {
    message: '',
    state: 'default'
};

export default function App() {
    const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
    const [step, setStep] = useState<WizardStep>('mood');
    const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
    const [selectedFocus, setSelectedFocus] = useState<SupportFocus | null>(null);
    const [hasManualFocusSelection, setHasManualFocusSelection] = useState(false);
    const [note, setNote] = useState('');
    const [status, setStatus] = useState<FormStatus>(emptyStatus);
    const [checkIns, setCheckIns] = useState<CheckInEntry[]>(() => loadCheckIns());
    const [activeEntry, setActiveEntry] = useState<CheckInEntry | null>(() => {
        const entries = loadCheckIns();
        return entries[0] ?? null;
    });
    const [promptIndex, setPromptIndex] = useState(() => new Date().getDate() % promptDeck.length);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) {
            return;
        }

        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 440)}px`;
    }, [note, step]);

    const noteLength = note.trim().length;
    const selectedMoodLabel = selectedMood ? moodContent[selectedMood].label : 'auto-detect';
    const selectedFocusLabel = selectedFocus ? focusContent[selectedFocus].label : 'choose later';

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

        const nextEntries = [entry, ...checkIns].slice(0, HISTORY_LIMIT);
        setCheckIns(nextEntries);
        setActiveEntry(entry);
        saveCheckIns(nextEntries);
        setStatus({
            message: crisis
                ? 'Plan created. Urgent support resources are shown above the reflection.'
                : 'Gentle action plan created and saved locally.',
            state: crisis ? 'info' : 'success'
        });
    }

    function clearForm() {
        setSelectedMood(null);
        setSelectedFocus(null);
        setHasManualFocusSelection(false);
        setNote('');
        setStatus({
            message: 'Ready for a new check-in.',
            state: 'default'
        });
        setStep('mood');
    }

    return (
        <div className="min-h-screen bg-halo-bg text-halo-text">
            <div className="halo-aura halo-aura-one"></div>
            <div className="halo-aura halo-aura-two"></div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-4 sm:px-6 sm:py-6">
                <Header theme={theme} onThemeChange={setTheme} />

                <main className="mt-4 grid gap-4">
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
                                    <button className="halo-button-primary" disabled={noteLength < 12} type="submit">Generate plan</button>
                                    <button className="halo-button-secondary" onClick={clearForm} type="button">Clear</button>
                                </div>
                            </div>
                        ) : null}
                    </form>

                    <PlanOutput entry={activeEntry} />

                    <HistoryPanel
                        entries={checkIns}
                        onSelect={(entry) => {
                            setActiveEntry(entry);
                            setStatus({
                                message: 'Loaded a saved check-in.',
                                state: 'info'
                            });
                        }}
                    />
                </main>

                <LearnMoreFooter />
            </div>
        </div>
    );
}

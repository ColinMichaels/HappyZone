import type { RefObject } from 'react';

import type { RitualAction, StatusState } from '../types';

interface JournalStepProps {
    selectedMoodLabel: string;
    selectedFocusLabel: string;
    prompt: string;
    prompts: string[];
    rituals: RitualAction[];
    note: string;
    statusMessage: string;
    statusState: StatusState;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    onBack: () => void;
    onNoteChange: (value: string) => void;
    onShufflePrompt: () => void;
    onApplyPrompt: (prompt: string) => void;
    onApplyRitual: (ritual: RitualAction) => void;
}

export function JournalStep({
    selectedMoodLabel,
    selectedFocusLabel,
    prompt,
    prompts,
    rituals,
    note,
    statusMessage,
    statusState,
    textareaRef,
    onBack,
    onNoteChange,
    onShufflePrompt,
    onApplyPrompt,
    onApplyRitual
}: JournalStepProps) {
    return (
        <section className="halo-panel wizard-step px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="halo-eyebrow">Step 3 of 3</p>
                    <h2 className="halo-section-title mt-2">Journal</h2>
                    <p className="halo-helper-text mt-2">
                        Mood: {selectedMoodLabel}. Support: {selectedFocusLabel}.
                    </p>
                </div>
                <button className="halo-button-secondary" onClick={onBack} type="button">Back</button>
            </div>

            <details className="suggested-starts mt-5">
                <summary className="suggested-starts-summary">
                    <div>
                        <p className="halo-field-label">Suggested starts</p>
                        <p className="halo-helper-text mt-1">Prompts and quick rituals if the first sentence feels stuck.</p>
                    </div>
                    <span className="learn-more-toggle">Open</span>
                </summary>

                <div className="mt-4 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                            <p className="halo-field-label">Daily prompt</p>
                            <p className="halo-body-copy">{prompt}</p>
                        </div>
                        <button className="halo-button-secondary" onClick={onShufflePrompt} type="button">Shuffle</button>
                    </div>

                    <div>
                        <p className="halo-field-label">Quick rituals</p>
                        <div className="ritual-grid mt-2">
                            {rituals.map((ritual) => (
                                <button
                                    key={ritual.title}
                                    type="button"
                                    className="ritual-choice"
                                    onClick={() => onApplyRitual(ritual)}
                                >
                                    <span className="choice-kicker">{ritual.focus}</span>
                                    <span className="choice-title">{ritual.title}</span>
                                    <span className="choice-copy">{ritual.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="halo-field-label">Prompt chips</p>
                        <div className="chip-row mt-2" aria-label="Helpful writing prompts">
                            {prompts.map((promptChip) => (
                                <button
                                    key={promptChip}
                                    type="button"
                                    className="prompt-chip-button"
                                    onClick={() => onApplyPrompt(promptChip.replace('Start with: ', ''))}
                                >
                                    {promptChip}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </details>

            <div className="mt-5">
                <label htmlFor="journalInput" className="halo-field-label">What is happening right now?</label>
                <textarea
                    id="journalInput"
                    ref={textareaRef}
                    className="halo-input halo-input-prominent mt-2"
                    rows={10}
                    placeholder="Try one honest paragraph. Start with the part that feels loudest in your body or mind."
                    value={note}
                    onChange={(event) => onNoteChange(event.target.value)}
                    onKeyDown={(event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                            event.preventDefault();
                            event.currentTarget.form?.requestSubmit();
                        }
                    }}
                />
            </div>

            <p className="halo-helper-text mt-3">Cmd/Ctrl + Enter also generates the plan.</p>
            <p id="formStatus" className="text-sm leading-6 text-halo-muted" data-state={statusState !== 'default' ? statusState : undefined} aria-live="polite">
                {statusMessage}
            </p>
        </section>
    );
}

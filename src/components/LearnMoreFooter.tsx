import { useState } from 'react';
import { BRAND_CONFIG } from '../brandConfig';

interface LearnMoreFooterProps {
    savedCheckInCount: number;
    savedReminderCount: number;
    onClearSavedData: () => void;
}

function pluralize(count: number, singular: string): string {
    return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

export function LearnMoreFooter({ savedCheckInCount, savedReminderCount, onClearSavedData }: LearnMoreFooterProps) {
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [clearStatusMessage, setClearStatusMessage] = useState('');

    return (
        <footer className="mt-4 pb-4">
            <details id="learnMorePanel" className="halo-panel px-4 py-4 sm:px-6">
                <summary className="learn-more-summary">
                    <div>
                        <p className="halo-eyebrow">How this works</p>
                        <h2 className="halo-section-title mt-1">Designed for a calm mind.</h2>
                    </div>
                    <span className="learn-more-toggle">Open</span>
                </summary>

                <div className="mt-4 grid gap-3">
                    <article className="halo-card p-4">
                        <h3 className="halo-card-title">Space to breathe</h3>
                        <p className="halo-body-copy mt-2">The check-in moves step by step so you are not hit with too many questions at once. It is meant to give you a little more room to think and respond at your own pace.</p>
                    </article>
                    <article className="halo-card p-4">
                        <h3 className="halo-card-title">Your space, your focus</h3>
                        <p className="halo-body-copy mt-2">Design notes and extra explanations are tucked away here on purpose. That keeps the main check-in clear, quiet, and easier to stay with.</p>
                    </article>
                    <article className="halo-card p-4">
                        <h3 className="halo-card-title">Built for the moment</h3>
                        <p className="halo-body-copy mt-2">Large tap targets and clear text are there to make the app easier to use when your energy is low or your stress is high. The goal is less friction when you need steadiness most.</p>
                    </article>
                    <article className="halo-card p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <h3 className="halo-card-title">Local data controls</h3>
                                <p className="halo-body-copy mt-2">
                                    Currently saved on this browser: {pluralize(savedCheckInCount, 'check-in')} and {pluralize(savedReminderCount, 'reminder')}.
                                    Clearing data removes saved check-ins, reminders, the returning-session snapshot, and support-related stored preferences.
                                    Theme and disclaimer acknowledgement stay as they are.
                                </p>
                            </div>

                            {!isClearConfirmOpen ? (
                                <button
                                    className="halo-button-secondary"
                                    onClick={() => {
                                        setIsClearConfirmOpen(true);
                                        setClearStatusMessage('');
                                    }}
                                    type="button"
                                >
                                    Reset saved data
                                </button>
                            ) : (
                                <div className="footer-action-row">
                                    <button
                                        className="halo-button-primary"
                                        onClick={() => {
                                            onClearSavedData();
                                            setIsClearConfirmOpen(false);
                                            setClearStatusMessage('Saved local data cleared from this browser.');
                                        }}
                                        type="button"
                                    >
                                        Clear saved data
                                    </button>
                                    <button
                                        className="halo-button-secondary"
                                        onClick={() => {
                                            setIsClearConfirmOpen(false);
                                            setClearStatusMessage('Saved local data was left in place.');
                                        }}
                                        type="button"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        {isClearConfirmOpen ? (
                            <p className="halo-helper-text mt-3">This only affects data stored in this browser and cannot be undone.</p>
                        ) : null}

                        <p className="halo-helper-text mt-3" aria-live="polite">{clearStatusMessage}</p>
                    </article>
                </div>
            </details>

            <p className="footer-disclaimer mt-3">
                Disclaimer: {BRAND_CONFIG.disclaimer}
            </p>
        </footer>
    );
}

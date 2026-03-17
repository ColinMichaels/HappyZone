import { focusContent, moodContent } from '../content';
import { formatRelativeTime, RECENT_CHECKIN_PREVIEW_LIMIT } from '../lib/happyzone';
import type { CheckInEntry } from '../types';
import { MoodInsights } from './MoodInsights';

interface HistoryPanelProps {
    entries: CheckInEntry[];
    onSelect: (entry: CheckInEntry) => void;
}

export function HistoryPanel({ entries, onSelect }: HistoryPanelProps) {
    const visibleEntries = entries.slice(0, RECENT_CHECKIN_PREVIEW_LIMIT);

    return (
        <details className="halo-panel px-4 py-4 sm:px-6">
            <summary className="learn-more-summary">
                <div>
                    <p className="halo-eyebrow">Recent check-ins</p>
                    <h2 className="halo-section-title mt-1">Saved on this device</h2>
                </div>
                <span className="learn-more-toggle" aria-label={`${entries.length} saved check-ins`}>
                    {entries.length}
                </span>
            </summary>

            <div className="mt-4 space-y-3" aria-live="polite">
                {entries.length === 0 ? (
                    <article className="halo-card p-4">
                        <p className="halo-eyebrow">Nothing saved yet</p>
                        <h3 className="halo-card-title mt-2">Your recent check-ins will appear here.</h3>
                        <p className="halo-body-copy mt-2">Saved entries stay on this device so you can revisit a plan without starting from zero.</p>
                    </article>
                ) : (
                    <>
                        <MoodInsights entries={entries} />

                        {entries.length > RECENT_CHECKIN_PREVIEW_LIMIT ? (
                            <p className="halo-helper-text">
                                Showing the latest {RECENT_CHECKIN_PREVIEW_LIMIT} of {entries.length} saved check-ins.
                            </p>
                        ) : null}

                        {visibleEntries.map((entry) => (
                            <button key={entry.id} type="button" className="halo-history-card" onClick={() => onSelect(entry)}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="halo-badge">{moodContent[entry.mood].label}</span>
                                    <span className="halo-badge">{focusContent[entry.focus].label}</span>
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-halo-soft">
                                        {formatRelativeTime(entry.createdAt)}
                                    </span>
                                </div>

                                <h3 className="halo-card-title mt-3">{entry.summary}</h3>
                                <p className="halo-body-copy mt-2">
                                    {entry.crisis
                                        ? 'Urgent support resources were surfaced for this check-in.'
                                        : `${focusContent[entry.focus].label}: ${moodContent[entry.mood].brightSpot}`}
                                </p>
                            </button>
                        ))}
                    </>
                )}
            </div>
        </details>
    );
}

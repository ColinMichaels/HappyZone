import { moodContent } from '../content';
import { formatDateTime } from '../lib/happyzone';
import { utilityIcons } from '../lib/materialIcons';
import type { ProgressSummary, ReminderEntry } from '../types';

interface ProgressSummaryPanelProps {
    summary: ProgressSummary | null;
    onOpenReminder: (reminder: ReminderEntry) => void;
    onToggleReminder: (reminderId: string) => void;
}

export function ProgressSummaryPanel({ summary, onOpenReminder, onToggleReminder }: ProgressSummaryPanelProps) {
    if (!summary) {
        return null;
    }

    const dueReminders = summary.dueReminders.slice(0, 3);
    const upcomingReminders = summary.upcomingReminders.slice(0, 2);

    return (
        <section className="halo-panel px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="halo-section-title mt-2">{summary.headline}</h2>
                </div>
            </div>

            <div className="progress-summary-grid mt-5">
                <article className="progress-stat-card">
                    <p className="halo-field-label">New visits</p>
                    <p className="progress-stat-value">{summary.entriesSinceLastVisit}</p>
                </article>

                <article className="progress-stat-card">
                    <p className="halo-field-label">Current streak</p>
                    <p className="progress-stat-value">{summary.streakDays}</p>
                </article>

                <article className="progress-stat-card">
                    <p className="halo-field-label">Recent mood</p>
                    <p className="progress-stat-value progress-stat-label">
                        {summary.dominantMood ? moodContent[summary.dominantMood].label : 'Building'}
                    </p>
                </article>
            </div>

            {dueReminders.length > 0 ? (
                <div className="mt-5">
                    <p className="halo-field-label">Ready now</p>
                    <div className="progress-reminder-list mt-3">
                        {dueReminders.map((reminder) => (
                            <article key={reminder.id} className="progress-reminder-card">
                                <div className="min-w-0">
                                    <h3 className="halo-card-title">{reminder.title}</h3>
                                    <p className="halo-helper-text mt-2">{formatDateTime(reminder.scheduledFor)}</p>
                                    {reminder.note ? (
                                        <p className="halo-body-copy mt-3">{reminder.note}</p>
                                    ) : null}
                                </div>

                                <div className="progress-reminder-actions">
                                    <button className="halo-button-secondary" onClick={() => onOpenReminder(reminder)} type="button">
                                        Open plan
                                    </button>
                                    <button className="halo-button-primary" onClick={() => onToggleReminder(reminder.id)} type="button">
                                        Mark done
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            ) : null}

            {upcomingReminders.length > 0 ? (
                <div className="mt-5">
                    <p className="halo-field-label">Coming up</p>
                    <div className="progress-reminder-list mt-3">
                        {upcomingReminders.map((reminder) => (
                            <article key={reminder.id} className="progress-reminder-card">
                                <div className="min-w-0">
                                    <h3 className="halo-card-title">{reminder.title}</h3>
                                    <p className="halo-helper-text mt-2">{formatDateTime(reminder.scheduledFor)}</p>
                                </div>

                                <div className="progress-reminder-actions">
                                    <button className="halo-button-secondary" onClick={() => onOpenReminder(reminder)} type="button">
                                        Open plan
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}

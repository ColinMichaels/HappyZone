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

    const CalendarIcon = utilityIcons.calendar;
    const dueReminders = summary.dueReminders.slice(0, 3);
    const upcomingReminders = summary.upcomingReminders.slice(0, 2);

    return (
        <section className="halo-panel px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="halo-eyebrow">Progress snapshot</p>
                    <h2 className="halo-section-title mt-2">Welcome back</h2>
                    <p className="halo-body-copy mt-3">{summary.headline}</p>
                    {summary.detail ? (
                        <p className="halo-helper-text mt-2">{summary.detail}</p>
                    ) : null}
                </div>

                <span className="icon-action">
                    <a className="halo-icon-button" href="#calendarPanel" aria-label="View calendar">
                        <CalendarIcon className="utility-icon" aria-hidden="true" />
                    </a>
                    <span className="icon-action-tooltip" aria-hidden="true">View calendar</span>
                </span>
            </div>

            <div className="progress-summary-grid mt-5">
                <article className="progress-stat-card">
                    <p className="halo-field-label">New since last visit</p>
                    <p className="progress-stat-value">{summary.entriesSinceLastVisit}</p>
                    <p className="halo-helper-text">Fresh check-ins added after your previous session.</p>
                </article>

                <article className="progress-stat-card">
                    <p className="halo-field-label">Current streak</p>
                    <p className="progress-stat-value">{summary.streakDays}</p>
                    <p className="halo-helper-text">Consecutive days with at least one journal entry.</p>
                </article>

                <article className="progress-stat-card">
                    <p className="halo-field-label">Recent mood</p>
                    <p className="progress-stat-value progress-stat-label">
                        {summary.dominantMood ? moodContent[summary.dominantMood].label : 'Building'}
                    </p>
                    <p className="halo-helper-text">Based on your latest saved check-ins.</p>
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

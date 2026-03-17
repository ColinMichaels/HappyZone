import { useMemo, useState } from 'react';

import { focusContent, moodContent } from '../content';
import { formatCalendarDay, formatCalendarMonth, formatDateTime, formatRelativeTime, toCalendarDateKey } from '../lib/happyzone';
import { utilityIcons } from '../lib/materialIcons';
import type { CheckInEntry, ReminderEntry } from '../types';

interface CalendarPanelProps {
    entries: CheckInEntry[];
    reminders: ReminderEntry[];
    onSelectEntry: (entry: CheckInEntry) => void;
    onToggleReminder: (reminderId: string) => void;
    onExportCalendar: () => void;
    exportStatusMessage: string;
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildMonthGrid(anchor: Date): Date[] {
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12, 0, 0, 0);
    const gridStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - monthStart.getDay(), 12, 0, 0, 0);

    return Array.from({ length: 42 }, (_, index) => (
        new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index, 12, 0, 0, 0)
    ));
}

export function CalendarPanel({
    entries,
    reminders,
    onSelectEntry,
    onToggleReminder,
    onExportCalendar,
    exportStatusMessage
}: CalendarPanelProps) {
    const DownloadIcon = utilityIcons.download;
    const PreviousIcon = utilityIcons.previous;
    const NextIcon = utilityIcons.next;
    const today = new Date();
    const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0));
    const [selectedDateKey, setSelectedDateKey] = useState(() => toCalendarDateKey(today));

    const entriesByDate = useMemo(() => {
        const lookup = new Map<string, CheckInEntry[]>();

        entries.forEach((entry) => {
            const dateKey = toCalendarDateKey(entry.createdAt);
            lookup.set(dateKey, [...(lookup.get(dateKey) ?? []), entry]);
        });

        return lookup;
    }, [entries]);

    const remindersByDate = useMemo(() => {
        const lookup = new Map<string, ReminderEntry[]>();

        reminders.forEach((reminder) => {
            const dateKey = toCalendarDateKey(reminder.scheduledFor);
            lookup.set(dateKey, [...(lookup.get(dateKey) ?? []), reminder]);
        });

        return lookup;
    }, [reminders]);

    const entriesById = useMemo(() => (
        new Map(entries.map((entry) => [entry.id, entry]))
    ), [entries]);

    const monthDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
    const selectedEntries = entriesByDate.get(selectedDateKey) ?? [];
    const selectedReminders = remindersByDate.get(selectedDateKey) ?? [];

    return (
        <section id="calendarPanel" className="halo-panel px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="halo-eyebrow">Calendar</p>
                    <h2 className="halo-section-title mt-2">Journal and reminders</h2>
                    <p className="halo-helper-text mt-2">
                        Each saved check-in lands on the day it was written. Reminders stay on the dates you scheduled for follow-up.
                    </p>
                </div>

                <span className="icon-action">
                    <button
                        aria-label="Export calendar as ICS"
                        className="halo-icon-button"
                        disabled={entries.length === 0 && reminders.length === 0}
                        onClick={onExportCalendar}
                        type="button"
                    >
                        <DownloadIcon className="utility-icon" aria-hidden="true" />
                    </button>
                    <span className="icon-action-tooltip" aria-hidden="true">Export .ics</span>
                </span>
            </div>

            <p className="halo-helper-text mt-3" aria-live="polite">{exportStatusMessage}</p>

            <div className="calendar-toolbar mt-5">
                <span className="icon-action">
                    <button
                        aria-label="Show previous month"
                        className="halo-icon-button"
                        onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12, 0, 0, 0))}
                        type="button"
                    >
                        <PreviousIcon className="utility-icon" aria-hidden="true" />
                    </button>
                    <span className="icon-action-tooltip" aria-hidden="true">Previous month</span>
                </span>

                <h3 className="calendar-month-label">{formatCalendarMonth(visibleMonth)}</h3>

                <span className="icon-action">
                    <button
                        aria-label="Show next month"
                        className="halo-icon-button"
                        onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12, 0, 0, 0))}
                        type="button"
                    >
                        <NextIcon className="utility-icon" aria-hidden="true" />
                    </button>
                    <span className="icon-action-tooltip" aria-hidden="true">Next month</span>
                </span>
            </div>

            <div className="calendar-weekday-row mt-4" aria-hidden="true">
                {weekdayLabels.map((label) => (
                    <span key={label} className="calendar-weekday-label">{label}</span>
                ))}
            </div>

            <div className="calendar-grid mt-3">
                {monthDays.map((date) => {
                    const dateKey = toCalendarDateKey(date);
                    const dayEntries = entriesByDate.get(dateKey) ?? [];
                    const dayReminders = remindersByDate.get(dateKey) ?? [];
                    const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                    const isSelected = dateKey === selectedDateKey;
                    const isToday = dateKey === toCalendarDateKey(today);

                    return (
                        <button
                            key={dateKey}
                            aria-label={`${formatCalendarDay(dateKey)}. ${dayEntries.length} journal ${dayEntries.length === 1 ? 'entry' : 'entries'}. ${dayReminders.length} reminder${dayReminders.length === 1 ? '' : 's'}.`}
                            className="calendar-day-cell"
                            data-muted={!isCurrentMonth}
                            data-selected={isSelected}
                            data-today={isToday}
                            onClick={() => setSelectedDateKey(dateKey)}
                            type="button"
                        >
                            <span className="calendar-day-number">{date.getDate()}</span>

                            <span className="calendar-day-indicators" aria-hidden="true">
                                {dayEntries.length > 0 ? (
                                    <span className="calendar-day-indicator" data-kind="entry">
                                        {dayEntries.length > 1 ? dayEntries.length : ''}
                                    </span>
                                ) : null}
                                {dayReminders.length > 0 ? (
                                    <span className="calendar-day-indicator" data-kind="reminder">
                                        {dayReminders.length > 1 ? dayReminders.length : ''}
                                    </span>
                                ) : null}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="calendar-detail-panel mt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="halo-field-label">Selected day</p>
                        <h3 className="halo-card-title mt-2">{formatCalendarDay(selectedDateKey)}</h3>
                    </div>
                    <span className="halo-badge">
                        {selectedEntries.length + selectedReminders.length} item{selectedEntries.length + selectedReminders.length === 1 ? '' : 's'}
                    </span>
                </div>

                {selectedEntries.length === 0 && selectedReminders.length === 0 ? (
                    <article className="halo-card mt-4 p-4">
                        <p className="halo-eyebrow">Quiet day</p>
                        <h4 className="halo-card-title mt-2">No check-ins or reminders are attached to this date yet.</h4>
                        <p className="halo-body-copy mt-2">Save a journal entry or reminder and it will appear here automatically.</p>
                    </article>
                ) : (
                    <div className="calendar-detail-list mt-4">
                        {selectedEntries.map((entry) => (
                            <button key={entry.id} className="halo-history-card" onClick={() => onSelectEntry(entry)} type="button">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="halo-badge">{moodContent[entry.mood].label}</span>
                                    <span className="halo-badge">{focusContent[entry.focus].label}</span>
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-halo-soft">
                                        {formatRelativeTime(entry.createdAt)}
                                    </span>
                                </div>

                                <h4 className="halo-card-title mt-3">{entry.summary}</h4>
                                <p className="halo-helper-text mt-2">{formatDateTime(entry.createdAt)}</p>
                            </button>
                        ))}

                        {selectedReminders.map((reminder) => {
                            const linkedEntry = entriesById.get(reminder.checkInId) ?? null;

                            return (
                                <article key={reminder.id} className="reminder-card" data-completed={Boolean(reminder.completedAt)}>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="halo-badge">{reminder.completedAt ? 'Completed' : 'Pending'}</span>
                                        <span className="halo-badge">{formatRelativeTime(reminder.scheduledFor)}</span>
                                    </div>

                                    <h4 className="halo-card-title mt-3">{reminder.title}</h4>
                                    <p className="halo-helper-text mt-2">{formatDateTime(reminder.scheduledFor)}</p>
                                    {reminder.note ? (
                                        <p className="halo-body-copy mt-3">{reminder.note}</p>
                                    ) : null}

                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {linkedEntry ? (
                                            <button className="halo-button-secondary" onClick={() => onSelectEntry(linkedEntry)} type="button">
                                                Open linked plan
                                            </button>
                                        ) : null}
                                        <button className="halo-button-primary" onClick={() => onToggleReminder(reminder.id)} type="button">
                                            {reminder.completedAt ? 'Reopen reminder' : 'Mark done'}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

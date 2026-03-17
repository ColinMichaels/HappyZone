import { useEffect, useState } from 'react';

import { focusContent, supportResources } from '../content';
import { buildPlan, formatDateTime, formatRelativeTime } from '../lib/happyzone';
import { utilityIcons } from '../lib/materialIcons';
import type { CheckInEntry, ReminderEntry } from '../types';

interface ReminderDraft {
    title: string;
    note: string;
    scheduledFor: string;
}

interface PlanOutputProps {
    entry: CheckInEntry | null;
    reminders: ReminderEntry[];
    onCreateReminder: (entry: CheckInEntry, draft: ReminderDraft) => boolean;
    onToggleReminder: (reminderId: string) => void;
}

function padDateValue(value: number): string {
    return String(value).padStart(2, '0');
}

function toDateTimeLocalValue(date: Date): string {
    return `${date.getFullYear()}-${padDateValue(date.getMonth() + 1)}-${padDateValue(date.getDate())}T${padDateValue(date.getHours())}:${padDateValue(date.getMinutes())}`;
}

function buildDefaultReminderDate(): string {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(9, 0, 0, 0);
    return toDateTimeLocalValue(next);
}

function buildDefaultReminderTitle(entry: CheckInEntry): string {
    return `Revisit your ${focusContent[entry.focus].label.toLowerCase()} plan`;
}

export function PlanOutput({ entry, reminders, onCreateReminder, onToggleReminder }: PlanOutputProps) {
    const SaveIcon = utilityIcons.save;
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderNote, setReminderNote] = useState('');
    const [scheduledFor, setScheduledFor] = useState('');
    const [reminderStatus, setReminderStatus] = useState('');

    useEffect(() => {
        if (!entry) {
            setReminderTitle('');
            setReminderNote('');
            setScheduledFor('');
            setReminderStatus('');
            return;
        }

        setReminderTitle(buildDefaultReminderTitle(entry));
        setReminderNote('');
        setScheduledFor(buildDefaultReminderDate());
        setReminderStatus('');
    }, [entry?.id]);

    if (!entry) {
        return (
            <section id="planOutput" className="halo-panel px-5 py-5 sm:px-6">
                <div>
                    <p className="halo-eyebrow">Your plan</p>
                    <h2 className="halo-section-title mt-2">Gentle action plan</h2>
                </div>

                <div className="halo-card mt-5 p-5">
                    <p className="halo-eyebrow">Nothing generated yet</p>
                    <h3 className="halo-card-title mt-2">Move through the three steps above, then generate when ready.</h3>
                    <p className="halo-body-copy mt-3">The response stays brief, practical, and easy to act on.</p>
                </div>
            </section>
        );
    }

    const currentEntry = entry;
    const plan = buildPlan(currentEntry.note, currentEntry.mood, currentEntry.crisis);
    const safetyPlanResource = supportResources.find((resource) => resource.id === 'safety-plan') ?? null;

    function handleReminderSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedTitle = reminderTitle.trim();
        if (!trimmedTitle) {
            setReminderStatus('Add a short title so the reminder is recognizable later.');
            return;
        }

        const scheduledDate = new Date(scheduledFor);
        if (Number.isNaN(scheduledDate.getTime())) {
            setReminderStatus('Choose a valid date and time for the reminder.');
            return;
        }

        const isDuplicate = onCreateReminder(currentEntry, {
            title: trimmedTitle,
            note: reminderNote.trim(),
            scheduledFor: scheduledDate.toISOString()
        });

        if (isDuplicate) {
            setReminderStatus('That reminder already exists for this journal entry.');
            return;
        }

        setReminderStatus('Reminder saved. It will show up in the calendar and the next welcome-back summary.');
        setReminderTitle(buildDefaultReminderTitle(currentEntry));
        setReminderNote('');
        setScheduledFor(buildDefaultReminderDate());
    }

    return (
        <section id="planOutput" className="halo-panel px-5 py-5 sm:px-6">
            <div>
                <p className="halo-eyebrow">Your plan</p>
                <h2 className="halo-section-title mt-2">Gentle action plan</h2>
            </div>

            <article className="mt-5 space-y-4">
                {currentEntry.crisis ? (
                    <div className="rounded-halo-lg border border-halo-danger bg-halo-danger-bg p-5">
                        <p className="halo-eyebrow text-halo-danger">Urgent support</p>
                        <h3 className="halo-card-title mt-2">This sounds more urgent than a normal check-in.</h3>
                        <p className="halo-body-copy mt-3 text-halo-text">
                            If you may act on thoughts of harming yourself or someone else, call or text 988 now, or call 911 if there is immediate danger.
                            Stay with live support rather than relying only on this app.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <a className="halo-button-primary no-underline" href="tel:988">Call 988</a>
                            <a className="halo-button-secondary no-underline" href="https://988lifeline.org/get-help/" target="_blank" rel="noreferrer">
                                Open 988 support
                            </a>
                            {safetyPlanResource ? (
                                <a
                                    className="halo-button-secondary no-underline"
                                    href={safetyPlanResource.href}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {safetyPlanResource.title}
                                </a>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                    <span className="halo-badge">Saved {formatRelativeTime(currentEntry.createdAt)}</span>
                </div>

                <section className="halo-card p-5">
                    <h3 className="halo-card-title">Three short lines</h3>
                    <div className="mt-4 space-y-3">
                        <p className="halo-body-copy text-halo-text">{plan.validation}</p>
                        <p className="halo-body-copy text-halo-text">{plan.reframe}</p>
                        <p className="halo-body-copy text-halo-text">{plan.microAction}</p>
                    </div>
                </section>

                <section className="halo-card p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="halo-eyebrow">Reminder</p>
                            <h3 className="halo-card-title mt-2">Schedule a follow-up</h3>
                            <p className="halo-helper-text mt-2">
                                Tie this check-in to a future reminder so the next login starts with what still needs attention.
                            </p>
                        </div>
                        <div className="reminder-count-chip" aria-label={`${reminders.length} reminders`}>
                            <span className="reminder-count-chip-label">Reminders</span>
                            <span className="reminder-count-chip-badge" aria-hidden="true">{reminders.length}</span>
                        </div>
                    </div>

                    <form className="mt-5 grid gap-4" onSubmit={handleReminderSubmit}>
                        <div className="reminder-form-grid">
                            <div>
                                <label className="halo-field-label" htmlFor="reminderTitle">Reminder title</label>
                                <input
                                    id="reminderTitle"
                                    className="halo-inline-input mt-2"
                                    value={reminderTitle}
                                    onChange={(event) => setReminderTitle(event.target.value)}
                                    placeholder="Check back in on this plan"
                                    type="text"
                                />
                            </div>

                            <div>
                                <label className="halo-field-label" htmlFor="reminderDateTime">When should it happen?</label>
                                <input
                                    id="reminderDateTime"
                                    className="halo-inline-input mt-2"
                                    value={scheduledFor}
                                    onChange={(event) => setScheduledFor(event.target.value)}
                                    type="datetime-local"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="halo-field-label" htmlFor="reminderNote">Reminder note</label>
                            <textarea
                                id="reminderNote"
                                className="halo-input reminder-note-input mt-2"
                                rows={4}
                                value={reminderNote}
                                onChange={(event) => setReminderNote(event.target.value)}
                                placeholder="Optional: what do you want to review or notice when this reminder comes back?"
                            />
                        </div>

                        <div className="reminder-form-actions">
                            <p className="halo-helper-text">
                                Saved reminders stay private on this device until you export them to a calendar file.
                            </p>
                            <span className="icon-action">
                                <button aria-label="Save reminder" className="halo-icon-button" type="submit">
                                    <SaveIcon className="utility-icon" aria-hidden="true" />
                                </button>
                                <span className="icon-action-tooltip" aria-hidden="true">Save reminder</span>
                            </span>
                        </div>
                    </form>

                    <p className="halo-helper-text mt-3" aria-live="polite">{reminderStatus}</p>

                    <div className="reminder-list mt-5">
                        {reminders.length === 0 ? (
                            <article className="halo-card p-4">
                                <p className="halo-eyebrow">Nothing queued yet</p>
                                <h4 className="halo-card-title mt-2">Add a reminder when you want this plan to come back later.</h4>
                                <p className="halo-body-copy mt-2">Each reminder is attached to this journal entry and appears in the calendar view below.</p>
                            </article>
                        ) : (
                            reminders.map((reminder) => (
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
                                        <button className="halo-button-secondary" onClick={() => onToggleReminder(reminder.id)} type="button">
                                            {reminder.completedAt ? 'Reopen reminder' : 'Mark done'}
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </article>
        </section>
    );
}

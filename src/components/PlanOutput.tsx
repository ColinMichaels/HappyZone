import { buildPlan, formatRelativeTime } from '../lib/happyzone';
import type { CheckInEntry } from '../types';

interface PlanOutputProps {
    entry: CheckInEntry | null;
}

export function PlanOutput({ entry }: PlanOutputProps) {
    if (!entry) {
        return (
            <section className="halo-panel px-5 py-5 sm:px-6">
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

    const plan = buildPlan(entry.note, entry.mood, entry.crisis);

    return (
        <section className="halo-panel px-5 py-5 sm:px-6">
            <div>
                <p className="halo-eyebrow">Your plan</p>
                <h2 className="halo-section-title mt-2">Gentle action plan</h2>
            </div>

            <article className="mt-5 space-y-4">
                {entry.crisis ? (
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
                        </div>
                    </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                    <span className="halo-badge">Saved {formatRelativeTime(entry.createdAt)}</span>
                </div>

                <section className="halo-card p-5">
                    <h3 className="halo-card-title">Three short lines</h3>
                    <div className="mt-4 space-y-3">
                        <p className="halo-body-copy text-halo-text">{plan.validation}</p>
                        <p className="halo-body-copy text-halo-text">{plan.reframe}</p>
                        <p className="halo-body-copy text-halo-text">{plan.microAction}</p>
                    </div>
                </section>
            </article>
        </section>
    );
}

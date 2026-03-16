import { moodContent } from '../content';
import type { CheckInEntry, MoodKey } from '../types';

interface MoodInsightsProps {
    entries: CheckInEntry[];
}

interface HeatmapCell {
    dayKey: string;
    label: string;
    mood: MoodKey | null;
}

const HEATMAP_DAYS = 28;
const legendOrder: MoodKey[] = ['steady', 'hopeful', 'grateful', 'anxious', 'overwhelmed', 'lonely', 'down'];
const dayFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
});

function startOfLocalDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function buildHeatmap(entries: CheckInEntry[]): HeatmapCell[] {
    const today = startOfLocalDay(new Date());
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (HEATMAP_DAYS - 1));

    const latestEntryByDay = new Map<string, CheckInEntry>();

    entries.forEach((entry) => {
        const entryDate = new Date(entry.createdAt);
        if (Number.isNaN(entryDate.getTime())) {
            return;
        }

        const localDay = startOfLocalDay(entryDate);
        if (localDay.getTime() < startDate.getTime() || localDay.getTime() > today.getTime()) {
            return;
        }

        const dayKey = toDayKey(localDay);
        const existingEntry = latestEntryByDay.get(dayKey);
        if (!existingEntry || new Date(existingEntry.createdAt).getTime() < entryDate.getTime()) {
            latestEntryByDay.set(dayKey, entry);
        }
    });

    return Array.from({ length: HEATMAP_DAYS }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);

        const dayKey = toDayKey(date);
        const mood = latestEntryByDay.get(dayKey)?.mood ?? null;

        return {
            dayKey,
            label: `${dayFormatter.format(date)}: ${mood ? moodContent[mood].label : 'No check-in'}`,
            mood
        };
    });
}

export function MoodInsights({ entries }: MoodInsightsProps) {
    const cells = buildHeatmap(entries);
    const trackedDays = cells.filter((cell) => cell.mood !== null).length;
    const moodsInRange = legendOrder.filter((mood) => cells.some((cell) => cell.mood === mood));
    const latestTrackedCell = [...cells].reverse().find((cell) => cell.mood !== null);

    return (
        <details className="halo-card p-4">
            <summary className="learn-more-summary">
                <div>
                    <p className="halo-field-label">Mood insights</p>
                    <p className="halo-helper-text mt-1">4-week heatmap from check-ins saved on this device.</p>
                </div>
                <span className="learn-more-toggle" aria-label={`${trackedDays} days with saved moods in the last four weeks`}>
                    {trackedDays}
                </span>
            </summary>

            <div className="mt-4 space-y-4">
                <div className="space-y-1">
                    <p className="halo-body-copy">
                        {trackedDays === 0
                            ? 'No saved moods in the last four weeks yet.'
                            : `${trackedDays} day${trackedDays === 1 ? '' : 's'} logged in the last four weeks.`}
                    </p>
                    <p className="halo-helper-text">
                        {latestTrackedCell?.mood
                            ? `Most recent saved mood: ${moodContent[latestTrackedCell.mood].label}.`
                            : 'All insight processing stays in this browser.'}
                    </p>
                </div>

                <div className="mood-insights-scale" aria-hidden="true">
                    <span>4 weeks ago</span>
                    <span>Today</span>
                </div>

                <div className="mood-insights-grid" role="list" aria-label="Mood heatmap for the last four weeks">
                    {cells.map((cell) => (
                        <div
                            key={cell.dayKey}
                            className="mood-insights-cell"
                            role="listitem"
                            aria-label={cell.label}
                            title={cell.label}
                        >
                            <span className="mood-insights-dot" data-mood={cell.mood ?? 'empty'} aria-hidden="true"></span>
                        </div>
                    ))}
                </div>

                {moodsInRange.length > 0 ? (
                    <div className="mood-insights-legend" aria-label="Mood legend">
                        {moodsInRange.map((mood) => (
                            <span key={mood} className="mood-insights-legend-item">
                                <span className="mood-insights-legend-dot" data-mood={mood} aria-hidden="true"></span>
                                {moodContent[mood].label}
                            </span>
                        ))}
                        <span className="mood-insights-legend-item">
                            <span className="mood-insights-legend-dot" data-mood="empty" aria-hidden="true"></span>
                            No check-in
                        </span>
                    </div>
                ) : null}

                <p className="halo-helper-text">Only local check-in data is used. Nothing leaves this browser.</p>
            </div>
        </details>
    );
}

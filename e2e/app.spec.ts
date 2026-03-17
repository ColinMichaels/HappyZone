import { expect, test, type Locator, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        window.localStorage.clear();
    });
});

function padDateValue(value: number): string {
    return String(value).padStart(2, '0');
}

function toDateTimeLocalValue(date: Date): string {
    return `${date.getFullYear()}-${padDateValue(date.getMonth() + 1)}-${padDateValue(date.getDate())}T${padDateValue(date.getHours())}:${padDateValue(date.getMinutes())}`;
}

function formatCalendarMonthLabel(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
        month: 'long',
        year: 'numeric'
    }).format(date);
}

function formatCalendarDayLabel(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function buildCalendarDayButtonName(date: Date, entryCount: number, reminderCount: number): string {
    const entryLabel = entryCount === 1 ? 'entry' : 'entries';
    const reminderLabel = reminderCount === 1 ? 'reminder' : 'reminders';

    return `${formatCalendarDayLabel(date)}. ${entryCount} journal ${entryLabel}. ${reminderCount} ${reminderLabel}.`;
}

async function moveToJournal(page: Page) {
    await page.goto('/');
    await page.getByRole('button', { name: /i understand/i }).click();
    await page.getByRole('radio', { name: /anxious/i }).click();
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByRole('button', { name: /^next$/i }).click();
}

async function openWorkspaceTabIfVisible(page: Page, label: string) {
    const tab = page.getByRole('tab', { name: new RegExp(`^${label}`, 'i') }).first();

    if (await tab.isVisible()) {
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
    }
}

async function openDetailsPanel(details: Locator) {
    await expect(details).toBeVisible();

    if ((await details.getAttribute('open')) !== null) {
        return;
    }

    await details.locator(':scope > summary.learn-more-summary').click();
    await expect(details).toHaveAttribute('open', '');
}

async function openRecentCheckIns(page: Page) {
    await openWorkspaceTabIfVisible(page, 'History');
    await openDetailsPanel(page.locator('#workspace-panel-history details.halo-panel').first());
}

async function openMoodInsights(page: Page) {
    await openRecentCheckIns(page);
    await openDetailsPanel(page.locator('#workspace-panel-history details.halo-card').filter({ hasText: 'Mood insights' }).first());
}

async function openCalmingTools(page: Page) {
    await openWorkspaceTabIfVisible(page, 'Tools');
    await openDetailsPanel(page.locator('#workspace-panel-tools details.halo-panel').first());
}

async function createReminder(page: Page, title: string, scheduledFor: string, note?: string) {
    const planOutput = page.locator('#planOutput');

    await planOutput.getByLabel(/reminder title/i).fill(title);
    await planOutput.getByLabel(/when should it happen/i).fill(scheduledFor);

    if (note !== undefined) {
        await planOutput.getByLabel(/reminder note/i).fill(note);
    }

    await planOutput.getByRole('button', { name: /save reminder/i }).click();
}

test('generates a gentle action plan through the main flow', async ({ page }) => {
    await moveToJournal(page);
    await page.getByLabel(/what is happening right now/i).fill('I am worried about everything and it feels like the worst outcome is coming.');
    await page.getByRole('button', { name: /generate plan/i }).click();

    await expect(page.getByText(/this may be catastrophizing/i)).toBeVisible();
    await openWorkspaceTabIfVisible(page, 'Check-in');
    await expect(page.getByRole('heading', { name: /how are you feeling/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /generate plan/i })).toHaveCount(0);
});

test('shows the support modal for higher-risk journal language', async ({ page }) => {
    await moveToJournal(page);
    await page.getByLabel(/what is happening right now/i).fill('I feel hopeless and want to hurt myself.');

    await expect(page.getByRole('button', { name: /get support/i })).toBeVisible();
    await page.getByRole('button', { name: /get support/i }).click();

    await expect(page.getByRole('dialog', { name: /immediate support resources/i })).toBeVisible();
    await expect(page.getByText(/call or text 988/i)).toBeVisible();
    await expect(page.getByText(/open the safety plan template/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /open the safety plan template/i })).toHaveAttribute('href', /safety-plan-template\.html$/);
});

test('shows the safety plan link in the urgent support section after a crisis check-in', async ({ page }) => {
    await moveToJournal(page);
    await page.getByLabel(/what is happening right now/i).fill('I feel hopeless and want to hurt myself.');
    await page.getByRole('button', { name: /generate plan/i }).click();

    await expect(page.getByText(/this sounds more urgent than a normal check-in/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /open the safety plan template/i })).toHaveAttribute('href', /safety-plan-template\.html$/);
});

test('lets a user work through the thought reframer and append the balanced truth', async ({ page }) => {
    await moveToJournal(page);
    await page.getByRole('button', { name: /help me reframe this thought/i }).click();

    const dialog = page.getByRole('dialog', { name: /help me reframe this thought/i });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox').fill('It feels bad right now.');
    await dialog.getByRole('button', { name: /^next$/i }).click();
    await dialog.getByRole('textbox').fill('I have handled hard days before.');
    await dialog.getByRole('button', { name: /^next$/i }).click();
    await dialog.getByRole('textbox').fill('This is hard, but it is not permanent and I have support.');
    await dialog.getByRole('button', { name: /add to journal/i }).click();

    await expect(page.getByLabel(/what is happening right now/i)).toHaveValue(
        'Balanced truth: This is hard, but it is not permanent and I have support.'
    );
});

test('opens calming tools and launches the reframer outside the journal flow', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /i understand/i }).click();

    await openCalmingTools(page);
    await page.getByRole('button', { name: /thought reframer/i }).click();
    await page.getByRole('button', { name: /open thought reframer/i }).click();

    const dialog = page.getByRole('dialog', { name: /help me reframe this thought/i });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('textbox').fill('Everything is falling apart.');
    await dialog.getByRole('button', { name: /^next$/i }).click();
    await dialog.getByRole('textbox').fill('There are parts of today I can still control.');
    await dialog.getByRole('button', { name: /^next$/i }).click();
    await dialog.getByRole('textbox').fill('This is a hard day, but it is not the whole story.');
    await dialog.getByRole('button', { name: /add to journal/i }).click();

    await expect(page.getByRole('heading', { name: /write it out/i })).toBeVisible();
    await expect(page.getByLabel(/what is happening right now/i)).toHaveValue(
        'Balanced truth: This is a hard day, but it is not the whole story.'
    );
});

test('persists saved check-ins and mood insights after a reload', async ({ page }) => {
    const journalNote = 'I handled one hard call and I want to remember that I can slow down.';

    await moveToJournal(page);
    await page.getByLabel(/what is happening right now/i).fill(journalNote);
    await page.getByRole('button', { name: /generate plan/i }).click();

    await expect(page.getByRole('heading', { name: /three short lines/i })).toBeVisible();
    await openWorkspaceTabIfVisible(page, 'Check-in');
    await expect(page.getByRole('heading', { name: /how are you feeling/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /generate plan/i })).toHaveCount(0);

    await page.reload();

    await expect(page.getByRole('button', { name: /i understand/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /three short lines/i })).toBeVisible();

    await openRecentCheckIns(page);
    await expect(
        page.locator('details.halo-panel:has-text("Recent check-ins") .halo-history-card').filter({ hasText: journalNote })
    ).toHaveCount(1);

    await openMoodInsights(page);
    await expect(page.getByText(/1 day logged in the last four weeks/i)).toBeVisible();
    await expect(page.getByText(/most recent saved mood: anxious/i)).toBeVisible();
    await expect(page.getByText(/only local check-in data is used/i)).toBeVisible();
});

test('persists the theme choice and first-visit acknowledgement after reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /i understand/i }).click();
    await page.getByRole('button', { name: /switch to dark theme/i }).click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('button', { name: /i understand/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /how are you feeling/i })).toBeVisible();
});

test('covers reminder follow-ups through the welcome-back summary and calendar navigation', async ({ page }) => {
    const now = new Date();
    const dueReminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0, 0, 0);
    const nextMonthReminderDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0, 0);
    const nextMonthDayLabel = buildCalendarDayButtonName(
        new Date(nextMonthReminderDate.getFullYear(), nextMonthReminderDate.getMonth(), nextMonthReminderDate.getDate(), 12, 0, 0, 0),
        0,
        1
    );

    await moveToJournal(page);
    await page.getByLabel(/what is happening right now/i).fill('I want to revisit this plan later and make sure the next step still feels realistic.');
    await page.getByRole('button', { name: /generate plan/i }).click();

    await expect(page.getByRole('heading', { name: /schedule a follow-up/i })).toBeVisible();

    await createReminder(page, 'Check back in soon', toDateTimeLocalValue(dueReminderDate), 'Notice whether the calmer next step still fits.');
    await expect(page.getByText(/reminder saved/i)).toBeVisible();

    await createReminder(page, 'Review next month', toDateTimeLocalValue(nextMonthReminderDate));
    await expect(page.locator('#planOutput').getByText('Review next month')).toBeVisible();

    await page.reload();

    const summaryPanel = page.locator('.app-summary-row section.halo-panel').first();
    const calendarPanel = page.locator('#calendarPanel');

    await expect(page.getByRole('button', { name: /i understand/i })).toHaveCount(0);
    await expect(summaryPanel.getByRole('heading', { name: /1 reminder ready to revisit/i })).toBeVisible();
    await expect(summaryPanel.getByRole('button', { name: /open plan/i })).toHaveCount(2);
    await summaryPanel.getByRole('button', { name: /mark done/i }).click();
    await expect(summaryPanel.getByText(/ready now/i)).toHaveCount(0);
    await expect(summaryPanel.getByRole('heading', { name: /1 new check-in since your last visit/i })).toBeVisible();
    await expect(summaryPanel.getByRole('button', { name: /open plan/i })).toHaveCount(1);

    await openWorkspaceTabIfVisible(page, 'Calendar');
    await calendarPanel.getByRole('button', { name: /show next month/i }).click();
    await expect(calendarPanel.locator('.calendar-month-label')).toHaveText(formatCalendarMonthLabel(nextMonthReminderDate));
    await calendarPanel.getByRole('button', { name: nextMonthDayLabel }).click();
    await expect(calendarPanel.getByText('Review next month')).toBeVisible();
    await expect(calendarPanel.getByRole('button', { name: /open linked plan/i })).toBeVisible();
});

test('covers the breathing reset and grounding guide calming tools', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /i understand/i }).click();

    await openCalmingTools(page);

    const breathingCard = page.locator('.halo-card').filter({ hasText: 'One-minute breathing reset' });
    const groundingCard = page.locator('.calming-tool-card').filter({ hasText: '5-4-3-2-1 reset' });

    await expect(breathingCard.getByRole('heading', { name: /one-minute breathing reset/i })).toBeVisible();
    await breathingCard.getByRole('button', { name: /start breathing/i }).click();
    await expect(breathingCard.getByRole('button', { name: /stop breathing/i })).toBeVisible();

    await page.getByRole('button', { name: /grounding guide/i }).click();
    await expect(groundingCard.getByRole('heading', { name: /5-4-3-2-1 reset/i })).toBeVisible();
    await expect(groundingCard.getByText(/step 1 of 5/i)).toBeVisible();

    for (let step = 0; step < 4; step += 1) {
        await groundingCard.getByRole('button', { name: /^next$/i }).click();
    }

    await groundingCard.getByRole('button', { name: /finish/i }).click();
    await expect(groundingCard.getByText(/grounding pass complete/i)).toBeVisible();
    await groundingCard.getByRole('button', { name: /run again/i }).click();
    await expect(groundingCard.getByText(/step 1 of 5/i)).toBeVisible();
});

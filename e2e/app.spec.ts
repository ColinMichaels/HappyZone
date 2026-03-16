import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
        window.localStorage.clear();
    });
});

async function moveToJournal(page: Page) {
    await page.goto('/');
    await page.getByRole('button', { name: /i understand/i }).click();
    await page.getByRole('radio', { name: /anxious/i }).click();
    await page.getByRole('button', { name: /^next$/i }).click();
    await page.getByRole('button', { name: /^next$/i }).click();
}

async function openRecentCheckIns(page: Page) {
    await page.locator('details.halo-panel:has-text("Recent check-ins") > summary.learn-more-summary').click();
}

async function openMoodInsights(page: Page) {
    await page.locator('details.halo-card:has-text("Mood insights") > summary.learn-more-summary').click();
}

test('generates a gentle action plan through the main flow', async ({ page }) => {
    await moveToJournal(page);
    await page.getByLabel(/what is happening right now/i).fill('I am worried about everything and it feels like the worst outcome is coming.');
    await page.getByRole('button', { name: /generate plan/i }).click();

    await expect(page.getByText(/this may be catastrophizing/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /^mood$/i })).toBeVisible();
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

test('persists saved check-ins and mood insights after a reload', async ({ page }) => {
    const journalNote = 'I handled one hard call and I want to remember that I can slow down.';

    await moveToJournal(page);
    await page.getByLabel(/what is happening right now/i).fill(journalNote);
    await page.getByRole('button', { name: /generate plan/i }).click();

    await expect(page.getByRole('heading', { name: /three short lines/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^mood$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /generate plan/i })).toHaveCount(0);

    await page.reload();

    await expect(page.getByRole('button', { name: /i understand/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /three short lines/i })).toBeVisible();

    await openRecentCheckIns(page);
    await expect(page.getByText(journalNote)).toBeVisible();

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
    await expect(page.getByRole('heading', { name: /private check-in/i })).toBeVisible();
});

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import App from './App';
import { BreathingReset } from './components/BreathingReset';
import { loadCheckIns, loadReminders, saveCheckIns, saveReminders, saveVisitSnapshot } from './lib/happyzone';

async function moveToJournalStep(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /i understand/i }));
    await user.click(screen.getByRole('radio', { name: /anxious/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
}

function setReducedMotionPreference(enabled: boolean) {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? enabled : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }));
}

describe('App regression coverage', () => {
    it('guides a user through the main flow and generates a gentle action plan', async () => {
        const user = userEvent.setup();
        render(<App />);

        await moveToJournalStep(user);
        await user.type(
            screen.getByLabelText(/what is happening right now/i),
            'I am worried about everything and it feels like the worst outcome is coming.'
        );

        await user.click(screen.getByRole('button', { name: /generate plan/i }));

        expect(await screen.findByRole('heading', { name: /three short lines/i })).toBeInTheDocument();
        expect(screen.getByText(/this may be catastrophizing/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /^mood$/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /generate plan/i })).not.toBeInTheDocument();
        expect(loadCheckIns()).toHaveLength(1);
    });

    it('lets a user save a reminder from the generated plan', async () => {
        const user = userEvent.setup();
        render(<App />);

        await moveToJournalStep(user);
        await user.type(
            screen.getByLabelText(/what is happening right now/i),
            'I want to come back to this plan tomorrow and check whether it helped.'
        );

        await user.click(screen.getByRole('button', { name: /generate plan/i }));
        await screen.findByRole('heading', { name: /schedule a follow-up/i });

        await user.click(screen.getByRole('button', { name: /save reminder/i }));

        expect(await screen.findByText(/reminder saved/i)).toBeInTheDocument();
        expect(loadReminders()).toHaveLength(1);
        expect(screen.getAllByText(/pending/i)[0]).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /export calendar as ics/i })).toBeInTheDocument();
    });

    it('shows the support guardrail when the journal text looks riskier', async () => {
        const user = userEvent.setup();
        render(<App />);

        await moveToJournalStep(user);
        await user.type(screen.getByLabelText(/what is happening right now/i), 'I feel hopeless and want to hurt myself.');

        await user.click(screen.getByRole('button', { name: /get support/i }));

        expect(await screen.findByRole('dialog', { name: /immediate support resources/i })).toBeInTheDocument();
        expect(screen.getByText(/call or text 988/i)).toBeInTheDocument();
        expect(screen.getByText(/open the safety plan template/i)).toBeInTheDocument();
    });

    it('lets the thought reframer append a balanced truth back into the journal', async () => {
        const user = userEvent.setup();
        render(<App />);

        await moveToJournalStep(user);
        await user.click(screen.getByRole('button', { name: /help me reframe this thought/i }));

        const dialog = await screen.findByRole('dialog', { name: /help me reframe this thought/i });

        await user.type(within(dialog).getByRole('textbox'), 'It feels bad right now.');
        await user.click(within(dialog).getByRole('button', { name: /^next$/i }));
        await user.type(within(dialog).getByRole('textbox'), 'I have handled hard days before.');
        await user.click(within(dialog).getByRole('button', { name: /^next$/i }));
        await user.type(within(dialog).getByRole('textbox'), 'This is hard, but it is not permanent and I have support.');
        await user.click(within(dialog).getByRole('button', { name: /add to journal/i }));

        expect(screen.getByLabelText(/what is happening right now/i)).toHaveValue(
            'Balanced truth: This is hard, but it is not permanent and I have support.'
        );
        expect(screen.getByText(/balanced thought added to your journal/i)).toBeInTheDocument();
    });

    it('opens the calming tools reframer and routes the balanced truth into the journal step', async () => {
        const user = userEvent.setup();
        render(<App />);

        await user.click(screen.getByRole('button', { name: /i understand/i }));
        await user.click(screen.getByText(/calming tools/i));
        await user.click(screen.getByRole('button', { name: /thought reframer/i }));
        await user.click(screen.getByRole('button', { name: /open thought reframer/i }));

        const dialog = await screen.findByRole('dialog', { name: /help me reframe this thought/i });

        await user.type(within(dialog).getByRole('textbox'), 'This feels impossible.');
        await user.click(within(dialog).getByRole('button', { name: /^next$/i }));
        await user.type(within(dialog).getByRole('textbox'), 'I have made it through hard weeks before.');
        await user.click(within(dialog).getByRole('button', { name: /^next$/i }));
        await user.type(within(dialog).getByRole('textbox'), 'This is hard, but I can take one next step.');
        await user.click(within(dialog).getByRole('button', { name: /add to journal/i }));

        expect(screen.getByRole('heading', { name: /^journal$/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/what is happening right now/i)).toHaveValue(
            'Balanced truth: This is hard, but I can take one next step.'
        );
    });

    it('shows a welcome-back summary with due reminders on the next load', async () => {
        const user = userEvent.setup();

        saveCheckIns([{
            id: 'entry-1',
            mood: 'steady',
            focus: 'calm',
            note: 'I want to keep building steadiness.',
            summary: 'I want to keep building steadiness.',
            crisis: false,
            createdAt: '2020-01-02T10:00:00.000Z'
        }]);
        saveReminders([{
            id: 'reminder-1',
            checkInId: 'entry-1',
            title: 'Check back in',
            note: 'Review the calm plan.',
            scheduledFor: '2020-01-03T09:00:00.000Z',
            createdAt: '2020-01-02T10:05:00.000Z',
            completedAt: null
        }]);
        saveVisitSnapshot({
            lastSeenAt: '2020-01-01T09:00:00.000Z'
        });

        render(<App />);

        await user.click(screen.getByRole('button', { name: /i understand/i }));

        expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
        expect(screen.getByText(/1 reminder ready to revisit/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /view calendar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /open plan/i })).toBeInTheDocument();
    });

    it('lets the user clear saved local journal and reminder data from the footer controls', async () => {
        const user = userEvent.setup();

        saveCheckIns([{
            id: 'entry-1',
            mood: 'steady',
            focus: 'calm',
            note: 'I want to keep building steadiness.',
            summary: 'I want to keep building steadiness.',
            crisis: false,
            createdAt: '2020-01-02T10:00:00.000Z'
        }]);
        saveReminders([{
            id: 'reminder-1',
            checkInId: 'entry-1',
            title: 'Check back in',
            note: 'Review the calm plan.',
            scheduledFor: '2020-01-03T09:00:00.000Z',
            createdAt: '2020-01-02T10:05:00.000Z',
            completedAt: null
        }]);

        render(<App />);

        await user.click(screen.getByRole('button', { name: /i understand/i }));
        await user.click(screen.getByRole('heading', { name: /designed for a calm mind/i }));
        await user.click(screen.getByRole('button', { name: /reset saved data/i }));
        await user.click(screen.getByRole('button', { name: /clear saved data/i }));

        expect(await screen.findByText(/saved local data cleared from this browser/i)).toBeInTheDocument();
        expect(loadCheckIns()).toEqual([]);
        expect(loadReminders()).toEqual([]);
        expect(screen.getByText(/your recent check-ins will appear here/i)).toBeInTheDocument();
    });

    it('respects reduced-motion preferences when scrolling to the generated plan', async () => {
        const user = userEvent.setup();

        setReducedMotionPreference(true);
        render(<App />);

        await moveToJournalStep(user);
        await user.type(
            screen.getByLabelText(/what is happening right now/i),
            'I want a short plan without animated scrolling getting in the way.'
        );

        await user.click(screen.getByRole('button', { name: /generate plan/i }));

        await screen.findByRole('heading', { name: /three short lines/i });
        await waitFor(() => expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
            behavior: 'auto',
            block: 'start'
        }));
    });

    it('keeps the breathing orb static when reduced motion is preferred', () => {
        setReducedMotionPreference(true);
        render(<BreathingReset instruction="Use the breath count only." />);

        expect(screen.getByText(/motion reduced\. follow the timer and breath label without the orb expanding\./i)).toBeInTheDocument();
        expect(document.querySelector('.halo-orb')).toHaveAttribute('data-reduced-motion', 'true');
    });
});

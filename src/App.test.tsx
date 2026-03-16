import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';

async function moveToJournalStep(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /i understand/i }));
    await user.click(screen.getByRole('radio', { name: /anxious/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
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

        expect(await screen.findByText(/gentle action plan created and saved locally/i)).toBeInTheDocument();
        expect(screen.getByText(/this may be catastrophizing/i)).toBeInTheDocument();
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
});

export default {
    content: ['./index.html', './src/**/*.{js,ts}'],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)'],
                display: ['var(--font-display)']
            },
            spacing: {
                section: 'var(--spacing-halo-section)',
                card: 'var(--spacing-halo-card)',
                control: 'var(--spacing-halo-control)'
            },
            borderRadius: {
                'halo-sm': 'var(--radius-halo-sm)',
                'halo-md': 'var(--radius-halo-md)',
                'halo-lg': 'var(--radius-halo-lg)',
                'halo-pill': 'var(--radius-halo-pill)'
            },
            boxShadow: {
                'halo-sm': 'var(--shadow-halo-sm)',
                'halo-md': 'var(--shadow-halo-md)',
                'halo-lg': 'var(--shadow-halo-lg)'
            },
            transitionDuration: {
                fast: 'var(--duration-fast)',
                base: 'var(--duration-base)'
            },
            transitionTimingFunction: {
                halo: 'var(--ease-halo)'
            }
        }
    }
};

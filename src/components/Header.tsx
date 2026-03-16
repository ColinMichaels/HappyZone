import type { ThemeMode } from '../types';

interface HeaderProps {
    theme: ThemeMode;
    onThemeChange: (theme: ThemeMode) => void;
}

export function Header({ theme, onThemeChange }: HeaderProps) {
    return (
        <header className="halo-panel halo-hero halo-topbar px-3 py-3 sm:px-4">
            <div className="flex items-start justify-between gap-3">
                <p className="halo-brand-mark">HappyZone</p>

                <div className="header-utility-row">
                    <div className="theme-toggle-group" aria-label="Theme mode">
                        <button
                            className="theme-toggle"
                            data-active={theme === 'light'}
                            aria-pressed={theme === 'light'}
                            aria-label="Switch to light theme"
                            onClick={() => onThemeChange('light')}
                            type="button"
                        >
                            Light
                        </button>
                        <button
                            className="theme-toggle"
                            data-active={theme === 'dark'}
                            aria-pressed={theme === 'dark'}
                            aria-label="Switch to dark theme"
                            onClick={() => onThemeChange('dark')}
                            type="button"
                        >
                            Dark
                        </button>
                    </div>

                    <a className="halo-icon-link" href="#learnMorePanel" aria-label="Open How this works">i</a>
                </div>
            </div>

            <div className="mt-2 min-w-0">
                <h1 className="halo-hero-title">Private Check-in</h1>
                <p className="halo-header-subtext mt-1">A space for your thoughts. Private by design.</p>
            </div>
        </header>
    );
}

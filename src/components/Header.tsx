import type { ThemeMode } from '../types';

interface HeaderProps {
    theme: ThemeMode;
    onThemeChange: (theme: ThemeMode) => void;
}

export function Header({ theme, onThemeChange }: HeaderProps) {
    return (
        <header className="halo-panel halo-hero halo-topbar px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="halo-eyebrow">HappyZone</p>
                    <h1 className="halo-hero-title mt-2">Private, phone-friendly check-in.</h1>
                    <p className="halo-helper-text mt-2 max-w-md">Three short steps. Nothing leaves this device.</p>
                </div>
                <a className="halo-icon-link" href="#learnMorePanel" aria-label="Open How this works">i</a>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
                <p className="halo-field-label">Theme</p>
                <div className="inline-flex rounded-halo-pill border border-halo-border bg-halo-bg p-1">
                    <button
                        className="theme-toggle"
                        data-active={theme === 'light'}
                        aria-pressed={theme === 'light'}
                        onClick={() => onThemeChange('light')}
                        type="button"
                    >
                        Light
                    </button>
                    <button
                        className="theme-toggle"
                        data-active={theme === 'dark'}
                        aria-pressed={theme === 'dark'}
                        onClick={() => onThemeChange('dark')}
                        type="button"
                    >
                        Dark
                    </button>
                </div>
            </div>
        </header>
    );
}

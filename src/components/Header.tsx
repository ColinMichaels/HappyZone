import type { ThemeMode } from '../types';
import { utilityIcons } from '../lib/materialIcons';

interface HeaderProps {
    theme: ThemeMode;
    onThemeChange: (theme: ThemeMode) => void;
}

export function Header({ theme, onThemeChange }: HeaderProps) {
    const LightIcon = utilityIcons.light;
    const DarkIcon = utilityIcons.dark;
    const InfoIcon = utilityIcons.info;

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
                            <LightIcon className="theme-toggle-icon" aria-hidden="true" />
                        </button>
                        <button
                            className="theme-toggle"
                            data-active={theme === 'dark'}
                            aria-pressed={theme === 'dark'}
                            aria-label="Switch to dark theme"
                            onClick={() => onThemeChange('dark')}
                            type="button"
                        >
                            <DarkIcon className="theme-toggle-icon" aria-hidden="true" />
                        </button>
                    </div>

                    <span className="icon-action">
                        <a className="halo-icon-link" href="#learnMorePanel" aria-label="Open How this works">
                            <InfoIcon className="utility-icon" aria-hidden="true" />
                        </a>
                        <span className="icon-action-tooltip" aria-hidden="true">How this works</span>
                    </span>
                </div>
            </div>

            <div className="mt-2 min-w-0">
                <h1 className="halo-hero-title">Private Check-in</h1>
                <p className="halo-header-subtext mt-1">A space for your thoughts. Private by design.</p>
            </div>
        </header>
    );
}

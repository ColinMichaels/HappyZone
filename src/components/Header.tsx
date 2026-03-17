import type { ThemeMode } from '../types';
import { utilityIcons } from '../lib/materialIcons';

interface HeaderProps {
    theme: ThemeMode;
    onThemeChange: (theme: ThemeMode) => void;
    minimal?: boolean;
}

export function Header({ theme, onThemeChange, minimal = false }: HeaderProps) {
    const LightIcon = utilityIcons.light;
    const DarkIcon = utilityIcons.dark;
    const InfoIcon = utilityIcons.info;

    return (
        <header className="halo-panel halo-hero halo-topbar px-3 py-1.5 sm:px-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                    <p className="halo-brand-mark shrink-0">HappyZone</p>
                    
                    {!minimal && (
                        <div className="hidden md:flex items-center gap-3 border-l border-halo-divider pl-3 ml-1 overflow-hidden">
                            <h1 className="halo-hero-title text-lg whitespace-nowrap overflow-hidden text-ellipsis">Private Check-in</h1>
                            <span className="halo-header-subtext hidden lg:inline border-l border-halo-divider pl-3 ml-1">Private by design.</span>
                        </div>
                    )}
                </div>

                <div className="header-utility-row shrink-0">
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

                    {!minimal && (
                        <span className="icon-action">
                            <a className="halo-icon-link" href="#learnMorePanel" aria-label="Open How this works">
                                <InfoIcon className="utility-icon" aria-hidden="true" />
                            </a>
                            <span className="icon-action-tooltip" aria-hidden="true">How this works</span>
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}

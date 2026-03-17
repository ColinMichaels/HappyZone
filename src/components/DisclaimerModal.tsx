import { useEffect, useRef, useState } from 'react';

import { supportResources } from '../content';
import { trackSupportAnalytics } from '../lib/happyzone';
import { BRAND_CONFIG } from '../brandConfig';

interface DisclaimerModalProps {
    isOpen: boolean;
    onAcknowledge: () => void;
}

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DisclaimerModal({ isOpen, onAcknowledge }: DisclaimerModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const acknowledgeButtonRef = useRef<HTMLButtonElement>(null);
    const [showEmergencyInfo, setShowEmergencyInfo] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setShowEmergencyInfo(false);
            return;
        }

        const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const frame = window.requestAnimationFrame(() => acknowledgeButtonRef.current?.focus());

        function handleKeydown(event: KeyboardEvent) {
            if (event.key !== 'Tab') {
                return;
            }

            const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
            if (!focusableElements || focusableElements.length === 0) {
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        document.addEventListener('keydown', handleKeydown);

        return () => {
            window.cancelAnimationFrame(frame);
            document.removeEventListener('keydown', handleKeydown);
            document.body.style.overflow = previousOverflow;
            previousActiveElement?.focus();
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="disclaimer-modal-backdrop" role="presentation">
            <div
                ref={dialogRef}
                className="disclaimer-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="disclaimerModalTitle"
                aria-describedby="disclaimerModalDescription"
            >
                <div className="disclaimer-modal-stack">
                    <div>
                        <p className="halo-eyebrow">Before you start</p>
                        <h2 id="disclaimerModalTitle" className="halo-section-title mt-2">Medical disclaimer</h2>
                    </div>

                    <p id="disclaimerModalDescription" className="halo-body-copy text-halo-text">
                        {BRAND_CONFIG.disclaimer}
                    </p>

                    {showEmergencyInfo ? (
                        <section id="disclaimerSupportPanel" className="halo-card p-4" aria-labelledby="disclaimerSupportTitle">
                            <div className="space-y-2">
                                <p className="halo-field-label">Immediate support</p>
                                <h3 id="disclaimerSupportTitle" className="halo-card-title">Local emergency links and numbers</h3>
                                <p className="halo-helper-text">
                                    Use these resources if you need urgent support or want a safety-planning starting point before continuing.
                                </p>
                            </div>

                            <div className="support-resource-list mt-4">
                                {supportResources.map((resource) => (
                                    <a
                                        key={resource.id}
                                        className="support-resource-card"
                                        href={resource.href}
                                        target={resource.kind === 'link' ? '_blank' : undefined}
                                        rel={resource.kind === 'link' ? 'noreferrer' : undefined}
                                        onClick={() => {
                                            trackSupportAnalytics('resource-used');

                                            if (resource.id === 'safety-plan') {
                                                trackSupportAnalytics('safety-plan-opened');
                                            }
                                        }}
                                    >
                                        <div className="support-resource-copy">
                                            <h3 className="halo-card-title">{resource.title}</h3>
                                            <p className="halo-body-copy mt-2">{resource.detail}</p>
                                        </div>
                                        <span className="halo-button-secondary">{resource.actionLabel}</span>
                                    </a>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    <div className="flex flex-wrap justify-end gap-3">
                        <button
                            className="halo-button-secondary"
                            aria-expanded={showEmergencyInfo}
                            aria-controls="disclaimerSupportPanel"
                            onClick={() => setShowEmergencyInfo((current) => !current)}
                            type="button"
                        >
                            {showEmergencyInfo ? 'Hide emergency info' : 'Emergency info'}
                        </button>
                        <button
                            ref={acknowledgeButtonRef}
                            className="halo-button-primary"
                            onClick={onAcknowledge}
                            type="button"
                        >
                            I understand
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useRef } from 'react';

import { supportResources } from '../content';
import { trackSupportAnalytics } from '../lib/happyzone';
import { getSupportResourceIcon } from '../lib/materialIcons';
import type { SupportRecommendation } from '../types';

interface SupportModalProps {
    isOpen: boolean;
    personalizedRecommendations: boolean;
    recommendation: SupportRecommendation | null;
    onClose: () => void;
    onPersonalizedChange: (enabled: boolean) => void;
}

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SupportModal({
    isOpen,
    personalizedRecommendations,
    recommendation,
    onClose,
    onPersonalizedChange
}: SupportModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

        function handleKeydown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

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
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const recommendedResource = recommendation
        ? supportResources.find((resource) => resource.id === recommendation.resourceId) ?? null
        : null;

    return (
        <div
            className="support-modal-backdrop"
            role="presentation"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                ref={dialogRef}
                id="supportModal"
                className="support-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="supportModalTitle"
                aria-describedby="supportModalDescription supportModalPrivacy"
            >
                <div className="support-modal-header">
                    <div>
                        <p className="halo-eyebrow">Get support</p>
                        <h2 id="supportModalTitle" className="halo-section-title mt-2">Immediate support resources</h2>
                    </div>
                    <button ref={closeButtonRef} className="halo-button-secondary" onClick={onClose} type="button">Close</button>
                </div>

                <div className="support-modal-stack">
                    <section className="halo-card p-4">
                        <p id="supportModalDescription" className="halo-body-copy text-halo-text">
                            This button gives you a fast path to live help and a local safety plan template when your writing starts to sound riskier or more hopeless.
                        </p>
                        <p id="supportModalPrivacy" className="halo-helper-text mt-3">
                            Your note stays in this browser. The app only stores local button-use counts and an encrypted preference if you opt into personalized suggestions.
                        </p>
                    </section>

                    <section className="halo-card p-4">
                        <div className="support-preference-row">
                            <div>
                                <p className="halo-field-label">Personalized suggestions</p>
                                <p className="halo-helper-text mt-1">Optional. Uses this note only in this browser to highlight the best starting resource.</p>
                            </div>
                            <label className="support-toggle">
                                <input
                                    type="checkbox"
                                    checked={personalizedRecommendations}
                                    onChange={(event) => onPersonalizedChange(event.target.checked)}
                                />
                                <span>{personalizedRecommendations ? 'On' : 'Off'}</span>
                            </label>
                        </div>

                        {personalizedRecommendations ? (
                            recommendation && recommendedResource ? (
                                <div className="support-recommendation mt-4" aria-live="polite">
                                    <p className="halo-field-label">Suggested first step</p>
                                    <h3 className="halo-card-title mt-2">{recommendation.title}</h3>
                                    <p className="halo-body-copy mt-2">{recommendation.detail}</p>
                                    <p className="halo-helper-text mt-2">Highlighted resource: {recommendedResource.title}</p>
                                </div>
                            ) : (
                                <p className="halo-helper-text mt-4" aria-live="polite">
                                    No specific recommendation was found, so the full support list stays available below.
                                </p>
                            )
                        ) : (
                            <p className="halo-helper-text mt-4">You can leave personalized suggestions off and use the resource list directly.</p>
                        )}
                    </section>

                    <section className="support-resource-list" aria-label="Support resources">
                        {supportResources.map((resource) => {
                            const isRecommended = personalizedRecommendations && recommendation?.resourceId === resource.id;
                            const ResourceIcon = getSupportResourceIcon(resource.id);

                            return (
                                <a
                                    key={resource.id}
                                    className="support-resource-card"
                                    data-recommended={isRecommended ? 'true' : 'false'}
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
                                    <div className="support-resource-leading">
                                        {ResourceIcon ? (
                                            <span className="summary-icon support-resource-icon" aria-hidden="true">
                                                <ResourceIcon className="utility-icon" />
                                            </span>
                                        ) : null}

                                        <div className="support-resource-copy">
                                            <div className="support-resource-heading-row">
                                                <h3 className="halo-card-title">{resource.title}</h3>
                                                {isRecommended ? <span className="support-recommended-badge">Suggested</span> : null}
                                            </div>
                                            <p className="halo-body-copy mt-2">{resource.detail}</p>
                                        </div>
                                    </div>
                                    <span className="halo-button-secondary">{resource.actionLabel}</span>
                                </a>
                            );
                        })}
                    </section>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useRef, useState } from 'react';

interface ThoughtReframerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyBalancedTruth: (value: string) => void;
}

const focusableSelector = 'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const steps = [
    {
        question: 'What is the evidence for this negative thought?',
        helper: 'List only what supports the thought as directly and concretely as you can.'
    },
    {
        question: 'What is the evidence against it?',
        helper: 'Include exceptions, missing context, or facts that do not fit the harsh version.'
    },
    {
        question: 'Now, write a balanced version of the truth.',
        helper: 'Aim for something honest, steady, and believable rather than overly positive.'
    }
] as const;

export function ThoughtReframerModal({ isOpen, onClose, onApplyBalancedTruth }: ThoughtReframerModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [evidenceFor, setEvidenceFor] = useState('');
    const [evidenceAgainst, setEvidenceAgainst] = useState('');
    const [balancedTruth, setBalancedTruth] = useState('');

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

    const currentQuestion = steps[stepIndex];
    const canMoveForward = stepIndex === 0
        ? evidenceFor.trim().length > 0
        : stepIndex === 1
            ? evidenceAgainst.trim().length > 0
            : balancedTruth.trim().length > 0;

    return (
        <div
            className="reframer-modal-backdrop"
            role="presentation"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                ref={dialogRef}
                className="reframer-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="thoughtReframerTitle"
                aria-describedby="thoughtReframerDescription"
            >
                <div className="reframer-modal-header">
                    <div>
                        <p className="halo-eyebrow">Thought reframer</p>
                        <h2 id="thoughtReframerTitle" className="halo-section-title mt-2">Help me reframe this thought.</h2>
                    </div>
                    <button ref={closeButtonRef} className="halo-button-secondary" onClick={onClose} type="button">Close</button>
                </div>

                <div className="reframer-modal-stack">
                    <p id="thoughtReframerDescription" className="halo-helper-text">
                        Move through the three steps slowly. You do not need perfect wording. You only need something more balanced than the first harsh version.
                    </p>

                    <div className="reframer-progress" aria-hidden="true">
                        {steps.map((step, index) => (
                            <span
                                key={step.question}
                                className="reframer-progress-dot"
                                data-active={index === stepIndex}
                            ></span>
                        ))}
                    </div>

                    <section className="reframer-card">
                        <p className="halo-field-label">Step {stepIndex + 1} of {steps.length}</p>
                        <h3 className="halo-card-title mt-2">{currentQuestion.question}</h3>
                        <p className="halo-helper-text mt-2">{currentQuestion.helper}</p>

                        {stepIndex === 0 ? (
                            <textarea
                                className="halo-input reframer-input mt-4"
                                rows={5}
                                value={evidenceFor}
                                onChange={(event) => setEvidenceFor(event.target.value)}
                            />
                        ) : null}

                        {stepIndex === 1 ? (
                            <textarea
                                className="halo-input reframer-input mt-4"
                                rows={5}
                                value={evidenceAgainst}
                                onChange={(event) => setEvidenceAgainst(event.target.value)}
                            />
                        ) : null}

                        {stepIndex === 2 ? (
                            <textarea
                                className="halo-input reframer-input mt-4"
                                rows={5}
                                value={balancedTruth}
                                onChange={(event) => setBalancedTruth(event.target.value)}
                            />
                        ) : null}
                    </section>

                    <div className="reframer-actions">
                        <button
                            className="halo-button-secondary"
                            disabled={stepIndex === 0}
                            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                            type="button"
                        >
                            Back
                        </button>

                        <div className="reframer-actions-end">
                            {stepIndex === steps.length - 1 ? (
                                <button
                                    className="halo-button-secondary"
                                    disabled={balancedTruth.trim().length === 0}
                                    onClick={() => onApplyBalancedTruth(balancedTruth.trim())}
                                    type="button"
                                >
                                    Add to journal
                                </button>
                            ) : null}

                            <button
                                className="halo-button-primary"
                                disabled={!canMoveForward}
                                onClick={() => {
                                    if (stepIndex === steps.length - 1) {
                                        onClose();
                                        return;
                                    }

                                    setStepIndex((current) => Math.min(steps.length - 1, current + 1));
                                }}
                                type="button"
                            >
                                {stepIndex === steps.length - 1 ? 'Done' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

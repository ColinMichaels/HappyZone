import { useEffect, useState } from 'react';

import { BREATHING_STEPS } from '../content';
import { prefersReducedMotion } from '../lib/happyzone';

interface BreathingResetProps {
    instruction: string;
}

export function BreathingReset({ instruction }: BreathingResetProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState<number>(BREATHING_STEPS[0].seconds);
    const reducedMotion = prefersReducedMotion();

    useEffect(() => {
        setIsRunning(false);
        setStepIndex(0);
        setSecondsLeft(BREATHING_STEPS[0].seconds);
    }, [instruction]);

    useEffect(() => {
        if (!isRunning) {
            return;
        }

        const timer = window.setTimeout(() => {
            if (secondsLeft <= 1) {
                const nextStep = (stepIndex + 1) % BREATHING_STEPS.length;
                setStepIndex(nextStep);
                setSecondsLeft(BREATHING_STEPS[nextStep].seconds);
                return;
            }

            setSecondsLeft((current) => current - 1);
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [isRunning, secondsLeft, stepIndex]);

    const activeStep = BREATHING_STEPS[stepIndex];

    return (
        <section className="halo-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="halo-card-title">One-minute breathing reset</h3>
                    <p className="halo-body-copy mt-2">{instruction}</p>
                </div>
                <button
                    id="breathingButton"
                    className="halo-button-secondary"
                    onClick={() => {
                        if (isRunning) {
                            setIsRunning(false);
                            setStepIndex(0);
                            setSecondsLeft(BREATHING_STEPS[0].seconds);
                            return;
                        }

                        setIsRunning(true);
                    }}
                    type="button"
                >
                    {isRunning ? 'Stop breathing' : 'Start breathing'}
                </button>
            </div>

            <div className="mt-5 flex flex-col items-center gap-4 rounded-halo-md border border-halo-divider bg-halo-bg-soft px-5 py-6 text-center">
                <div
                    className="halo-orb"
                    data-reduced-motion={reducedMotion}
                    style={reducedMotion ? undefined : { ['--breath-scale' as string]: activeStep.scale }}
                >
                    <span className="font-display text-4xl text-halo-heading">{secondsLeft}</span>
                </div>
                <div>
                    <p className="font-semibold text-halo-heading">{activeStep.label}</p>
                    <p className="halo-helper-text mt-1">
                        {reducedMotion
                            ? 'Motion reduced. Follow the timer and breath label without the orb expanding.'
                            : 'Use the longer exhale to downshift your body before you think about fixing the whole day.'}
                    </p>
                </div>
            </div>
        </section>
    );
}

import { useState } from 'react';

const groundingSteps = [
    {
        count: '5',
        prompt: 'Name five things you can see.',
        helper: 'Let your eyes move slowly. Simple objects count.'
    },
    {
        count: '4',
        prompt: 'Name four things you can feel.',
        helper: 'Notice pressure, temperature, fabric, or where your body meets the chair or floor.'
    },
    {
        count: '3',
        prompt: 'Name three things you can hear.',
        helper: 'Choose whatever is present right now, even if it is faint or repetitive.'
    },
    {
        count: '2',
        prompt: 'Name two things you can smell.',
        helper: 'If nothing stands out, name two scents you remember well and take one slow breath.'
    },
    {
        count: '1',
        prompt: 'Name one thing you can taste, or take one steady breath.',
        helper: 'Finish with one simple anchor and notice whether your body feels a little less sharp.'
    }
] as const;

export function GroundingGuide() {
    const [stepIndex, setStepIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const currentStep = groundingSteps[stepIndex];

    function resetGuide() {
        setStepIndex(0);
        setIsComplete(false);
    }

    return (
        <section className="calming-tool-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="halo-field-label">Grounding guide</p>
                    <h3 className="halo-card-title mt-2">5-4-3-2-1 reset</h3>
                    <p className="halo-helper-text mt-2">Move one sense at a time so attention can come back into the room.</p>
                </div>
                <button className="halo-button-secondary" onClick={resetGuide} type="button">Start over</button>
            </div>

            <div className="grounding-progress mt-4" aria-hidden="true">
                {groundingSteps.map((step, index) => (
                    <span
                        key={step.count}
                        className="grounding-progress-dot"
                        data-active={!isComplete && index === stepIndex}
                        data-complete={isComplete || index < stepIndex}
                    ></span>
                ))}
            </div>

            {isComplete ? (
                <div className="grounding-step-card mt-4">
                    <span className="grounding-count">Done</span>
                    <div>
                        <p className="choice-kicker">Grounding pass complete</p>
                        <h4 className="halo-card-title mt-2">You finished one calm reset.</h4>
                        <p className="halo-body-copy mt-2">
                            Pause for a moment and notice whether the room, your breath, or your shoulders feel slightly less tense.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grounding-step-card mt-4">
                    <span className="grounding-count">{currentStep.count}</span>
                    <div>
                        <p className="choice-kicker">Step {stepIndex + 1} of {groundingSteps.length}</p>
                        <h4 className="halo-card-title mt-2">{currentStep.prompt}</h4>
                        <p className="halo-body-copy mt-2">{currentStep.helper}</p>
                    </div>
                </div>
            )}

            <div className="reframer-actions mt-4">
                <button
                    className="halo-button-secondary"
                    disabled={stepIndex === 0 || isComplete}
                    onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                    type="button"
                >
                    Back
                </button>

                {isComplete ? (
                    <button className="halo-button-primary" onClick={resetGuide} type="button">Run again</button>
                ) : (
                    <button
                        className="halo-button-primary"
                        onClick={() => {
                            if (stepIndex === groundingSteps.length - 1) {
                                setIsComplete(true);
                                return;
                            }

                            setStepIndex((current) => current + 1);
                        }}
                        type="button"
                    >
                        {stepIndex === groundingSteps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                )}
            </div>
        </section>
    );
}

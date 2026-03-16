import { useState } from 'react';

import { getToolIcon } from '../lib/materialIcons';
import { BreathingReset } from './BreathingReset';
import { GroundingGuide } from './GroundingGuide';

type ToolKey = 'breathing' | 'grounding' | 'reframe';

interface CalmingToolsPanelProps {
    breathingInstruction: string;
    onOpenThoughtReframer: () => void;
}

const tools: Array<{ key: ToolKey; label: string; description: string }> = [
    {
        key: 'breathing',
        label: 'Breathing reset',
        description: 'A paced minute for your nervous system.'
    },
    {
        key: 'grounding',
        label: 'Grounding guide',
        description: 'A five-sense reset when thoughts get loud.'
    },
    {
        key: 'reframe',
        label: 'Thought reframer',
        description: 'A structured way to soften a harsh thought.'
    }
];

export function CalmingToolsPanel({ breathingInstruction, onOpenThoughtReframer }: CalmingToolsPanelProps) {
    const [activeTool, setActiveTool] = useState<ToolKey>('breathing');

    return (
        <details className="halo-panel px-5 py-5 sm:px-6">
            <summary className="learn-more-summary">
                <div>
                    <p className="halo-eyebrow">Calming tools</p>
                    <h2 className="halo-section-title mt-1">Reset, breathe, or reframe</h2>
                </div>
                <span className="learn-more-toggle" aria-label="Three calming tools available">3</span>
            </summary>

            <div className="mt-4 space-y-4">
                <p className="halo-helper-text">
                    Use one tool at a time. These helpers stay in the browser and are meant to lower friction when you need a steadier next step.
                </p>

                <div className="tool-switcher" aria-label="Choose a calming tool">
                    {tools.map((tool) => {
                        const ToolIcon = getToolIcon(tool.key);

                        return (
                            <button
                                key={tool.key}
                                className="tool-switch"
                                data-active={tool.key === activeTool}
                                onClick={() => setActiveTool(tool.key)}
                                type="button"
                            >
                                <div className="choice-title-row">
                                    {ToolIcon ? (
                                        <span className="choice-icon-badge" aria-hidden="true">
                                            <ToolIcon className="choice-icon" />
                                        </span>
                                    ) : null}
                                    <span className="choice-title">{tool.label}</span>
                                </div>
                                <span className="choice-copy">{tool.description}</span>
                            </button>
                        );
                    })}
                </div>

                {activeTool === 'breathing' ? <BreathingReset instruction={breathingInstruction} /> : null}
                {activeTool === 'grounding' ? <GroundingGuide /> : null}
                {activeTool === 'reframe' ? (
                    <section className="calming-tool-card">
                        <div className="space-y-2">
                            <p className="halo-field-label">Thought reframer</p>
                            <h3 className="halo-card-title">Slow down the harsh version</h3>
                            <p className="halo-body-copy">
                                This tool walks you through three short prompts so you can separate the first painful thought from a more balanced truth.
                            </p>
                        </div>

                        <div className="mt-4 grid gap-3">
                            <div className="halo-step">
                                <span className="halo-step-index">1</span>
                                <p className="halo-body-copy">Name the evidence that seems to support the thought.</p>
                            </div>
                            <div className="halo-step">
                                <span className="halo-step-index">2</span>
                                <p className="halo-body-copy">Name the evidence that does not fit the harsh version.</p>
                            </div>
                            <div className="halo-step">
                                <span className="halo-step-index">3</span>
                                <p className="halo-body-copy">Write one balanced sentence and place it back into your journal.</p>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button className="halo-button-primary" onClick={onOpenThoughtReframer} type="button">Open thought reframer</button>
                        </div>
                    </section>
                ) : null}
            </div>
        </details>
    );
}

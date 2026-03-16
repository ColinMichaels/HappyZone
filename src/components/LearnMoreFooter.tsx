export function LearnMoreFooter() {
    return (
        <footer className="mt-4 pb-4">
            <details id="learnMorePanel" className="halo-panel px-5 py-5 sm:px-6">
                <summary className="learn-more-summary">
                    <div>
                        <p className="halo-eyebrow">How this works</p>
                        <h2 className="halo-section-title mt-1">The quieter version of HappyZone</h2>
                    </div>
                    <span className="learn-more-toggle">Open</span>
                </summary>

                <div className="mt-4 grid gap-3">
                    <article className="halo-card p-4">
                        <h3 className="halo-card-title">One step at a time</h3>
                        <p className="halo-body-copy mt-2">Mood, support, and journaling are separated into a top-down sequence so the screen only asks for one decision at a time.</p>
                    </article>
                    <article className="halo-card p-4">
                        <h3 className="halo-card-title">Meta content moved out</h3>
                        <p className="halo-body-copy mt-2">Design language, accessibility, and support-model notes now live here instead of competing with the check-in itself.</p>
                    </article>
                    <article className="halo-card p-4">
                        <h3 className="halo-card-title">Touch and readability first</h3>
                        <p className="halo-body-copy mt-2">Controls keep sturdy tap sizes, the journal gets the most space, and urgent support stays explicit when needed.</p>
                    </article>
                </div>
            </details>
        </footer>
    );
}

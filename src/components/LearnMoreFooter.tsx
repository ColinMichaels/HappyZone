export function LearnMoreFooter() {
    return (
        <footer className="mt-4 pb-4">
            <details id="learnMorePanel" className="halo-panel px-5 py-5 sm:px-6">
                <summary className="learn-more-summary">
                    <div>
                        <p className="halo-eyebrow">How this works</p>
                        <h2 className="halo-section-title mt-1">Designed for a calm mind.</h2>
                    </div>
                    <span className="learn-more-toggle">Open</span>
                </summary>

                <div className="mt-4 grid gap-3">
                    <article className="halo-card p-4">
                        <h3 className="halo-card-title">Space to breathe</h3>
                        <p className="halo-body-copy mt-2">The check-in moves step by step so you are not hit with too many questions at once. It is meant to give you a little more room to think and respond at your own pace.</p>
                    </article>
                    <article className="halo-card p-4">
                        <h3 className="halo-card-title">Your space, your focus</h3>
                        <p className="halo-body-copy mt-2">Design notes and extra explanations are tucked away here on purpose. That keeps the main check-in clear, quiet, and easier to stay with.</p>
                    </article>
                    <article className="halo-card p-4">
                        <h3 className="halo-card-title">Built for the moment</h3>
                        <p className="halo-body-copy mt-2">Large tap targets and clear text are there to make the app easier to use when your energy is low or your stress is high. The goal is less friction when you need steadiness most.</p>
                    </article>
                </div>
            </details>

            <p className="footer-disclaimer mt-3">
                Disclaimer: HappyZone is a self-help tool designed for reflection and guidance; it is not a licensed medical or mental health service. This application should not be used as a substitute for professional medical advice, diagnosis, or treatment. If you are experiencing a mental health crisis, please reach out to a licensed professional or a local crisis center immediately.
            </p>
        </footer>
    );
}

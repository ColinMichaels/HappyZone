export interface BrandConfig {
    readonly name: string;
    readonly tagline: string;
    readonly catchPhrase: string;
    readonly disclaimer: string;
    readonly logoUrl?: string; // If provided, an image will be shown instead of the text name in the brand mark
}

export const BRAND_CONFIG: BrandConfig = {
    name: 'Pause',
    tagline: 'Stop and reflect',
    catchPhrase: 'Private by design.',
    disclaimer: 'Pause is a self-help tool designed for reflection and guidance; it is not a licensed medical or mental health service. This application should not be used as a substitute for professional medical advice, diagnosis, or treatment. If you are experiencing a mental health crisis, please reach out to a licensed professional or a local crisis center immediately.',
    // logoUrl: '/logo.svg', // Uncomment and set to use a logo image
};

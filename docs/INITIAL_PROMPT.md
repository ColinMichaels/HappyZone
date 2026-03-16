Design Prompt for Tailwind Theme (Halo Wellness)

The goal is to create a Tailwind CSS theme object that defines our wellness‑focused UI using the Halo design tokens defined below. The theme should work for both light and dark modes using CSS variables. Follow these guidelines:
•	Provide an emotionally calming and modern aesthetic with gentle neutrals, soft periwinkle as primary, muted sage support tones, deep slate typography, and generous spacing. The dark mode should feel moonlit and restorative rather than techy.
•	Build the theme using Tailwind’s @theme directive. Define custom color variables under the --color-* namespace so that Tailwind automatically exposes utilities like bg-halo-primary, text-halo-muted, etc. Theme variables defined with @theme instruct Tailwind to create corresponding utility classes ￼.
•	Define variables for spacing, radii, shadows, fonts, durations, etc. using appropriate namespaces (--spacing-*, --radius-*, --shadow-*, etc.) so that Tailwind generates utility classes for them ￼.
•	Include dark mode variants by defining the same variables inside [data-theme="dark"] and configure Tailwind with darkMode: ["class", '[data-theme="dark"]'].
•	Ensure all tokens meet WCAG 2.2 Level AA contrast ratios: normal text must have at least 4.5:1 contrast against its background and large text at least 3:1 ￼. Provide visible focus rings with two‑layer outlines that differ by at least a 3:1 contrast change to comply with focus appearance requirements ￼.
•	Provide at least one accent color; ensure color is not the only cue for meaning (e.g., success, warning, danger). Provide alert and state variants with accessible backgrounds.
•	Avoid glassmorphism blur, washed‑out pastel text, and red‑vs‑green‑only status messaging.
•	Do not include icons or images; focus on tokens.

Halo design tokens

Use the following tokens to populate the @theme section of your Tailwind config (light mode). Each variable name should map to a --color-*, --font-*, --spacing-*, etc. variable depending on its purpose. For example, --halo-primary becomes --color-halo-primary:

```:root,
[data-theme="light"] {
  --halo-font-sans: "Inter", "Manrope", "Segoe UI", system-ui, sans-serif;
  --halo-font-display: "Manrope", "Inter", "Segoe UI", system-ui, sans-serif;

  --halo-bg: #F7F8F5;
  --halo-bg-elevated: #FFFFFF;
  --halo-bg-soft: #EEF2EC;
  --halo-bg-tint: #E7EBFF;
  --halo-gradient-hero: linear-gradient(180deg, #FBFCF9 0%, #F4F6FF 100%);

  --halo-text: #1E2830;
  --halo-text-muted: #4D5B63;
  --halo-text-soft: #6A7A84;
  --halo-heading: #14202A;

  --halo-primary: #5163C9;
  --halo-primary-hover: #4659BC;
  --halo-primary-active: #3E50AA;
  --halo-on-primary: #FFFFFF;

  --halo-secondary: #E7EBFF;
  --halo-on-secondary: #2B397A;

  --halo-link: #2F4BA3;
  --halo-focus-inner: #FFFFFF;
  --halo-focus-outer: #2B397A;

  --halo-border: #A8B7C2;
  --halo-border-control: #7B8D98;
  --halo-divider: #D7E0E6;

  --halo-success-bg: #E8F3EE;
  --halo-success: #375E53;
  --halo-warning-bg: #FFF4DB;
  --halo-warning: #725A1D;
  --halo-danger-bg: #FDECEF;
  --halo-danger: #8E4455;
  --halo-info-bg: #EAF1FF;
  --halo-info: #2F4BA3;

  --halo-aura-1: rgba(81, 99, 201, 0.14);
  --halo-aura-2: rgba(94, 118, 107, 0.12);

  --halo-radius-sm: 12px;
  --halo-radius-md: 18px;
  --halo-radius-lg: 28px;
  --halo-radius-pill: 999px;

  --halo-shadow-sm: 0 1px 2px rgba(17, 24, 39, 0.04);
  --halo-shadow-md: 0 10px 30px rgba(20, 32, 42, 0.08);
  --halo-shadow-lg: 0 24px 60px rgba(20, 32, 42, 0.10);

  --halo-space-section: clamp(4rem, 7vw, 7rem);
  --halo-space-card: clamp(1rem, 1.8vw, 1.5rem);
  --halo-control-height: 3rem;

  --halo-duration-fast: 160ms;
  --halo-duration-base: 220ms;
  --halo-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```
       
Dark mode tokens
               
```
[data-theme="dark"] {
  --halo-bg: #101417;
  --halo-bg-elevated: #151B20;
  --halo-bg-soft: #1B2329;
  --halo-bg-tint: #1D264B;
  --halo-gradient-hero: linear-gradient(180deg, #11161A 0%, #171D35 100%);

  --halo-text: #F2F6F8;
  --halo-text-muted: #B4C0C8;
  --halo-text-soft: #8FA0AA;
  --halo-heading: #FFFFFF;

  --halo-primary: #A9B7FF;
  --halo-primary-hover: #B5C1FF;
  --halo-primary-active: #98A9FF;
  --halo-on-primary: #0F1420;

  --halo-secondary: #1D264B;
  --halo-on-secondary: #D7DFFF;

  --halo-link: #C9DAFF;
  --halo-focus-inner: #101417;
  --halo-focus-outer: #C7D4FF;

  --halo-border: #3B4A55;
  --halo-border-control: #566B78;
  --halo-divider: #2A343C;

  --halo-success-bg: #17342E;
  --halo-success: #A8E0CD;
  --halo-warning-bg: #3A2B14;
  --halo-warning: #FFDCA1;
  --halo-danger-bg: #43212B;
  --halo-danger: #FFC9D4;
  --halo-info-bg: #1D264B;
  --halo-info: #C9DAFF;

  --halo-aura-1: rgba(169, 183, 255, 0.18);
  --halo-aura-2: rgba(168, 224, 205, 0.10);

  --halo-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.28);
  --halo-shadow-md: 0 12px 36px rgba(0, 0, 0, 0.34);
  --halo-shadow-lg: 0 30px 80px rgba(0, 0, 0, 0.40);
}

```


Desired output from Codex

Implement a tailwind.config.js file that uses these tokens to generate theme values and utilities. Use the @theme directive to define variables inside the theme layer. For example:
       
```
@import "tailwindcss";
@theme {
  --color-halo-bg: var(--halo-bg);
  --color-halo-primary: var(--halo-primary);
  --color-halo-primary-hover: var(--halo-primary-hover);
  /* repeat for all color, spacing, radius, shadow and duration tokens */
}
```
       

In the Tailwind config, define darkMode: ["class", '[data-theme="dark"]'] to activate dark mode when the [data-theme="dark"] attribute is present. Map custom font families and other tokens using fontFamily: { sans: 'var(--font-sans)', display: 'var(--font-display)' }, and define custom spacing (spacing), border radius (borderRadius), shadows (boxShadow), and transition timing functions referencing your variables.

Finally, provide an example usage snippet demonstrating how to apply the theme to a card component using Tailwind classes and showing both light and dark variants. The snippet should illustrate accessible contrast, focus outlines, and the use of the accent color in a primary button.

This markdown file can be copied into your code editor; feed it to Codex to generate the Tailwind theme. Make sure to adapt variable names to the appropriate theme namespaces as described in Tailwind’s theme variable documentation ￼.

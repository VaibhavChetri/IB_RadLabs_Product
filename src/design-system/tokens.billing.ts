/**
 * Billing module — tokens that don't fit in the global theme.
 * These mirror the CSS custom properties declared under .billing-module
 * in src/index.css, exposed as TypeScript constants for use inside
 * components when an inline style is unavoidable.
 *
 * Prefer the CSS variables wherever possible — these are a fallback for
 * SVG fills, recharts colors, and anywhere CSS vars don't reach.
 */

export const billingColors = {
	bg: 'oklch(98% 0.005 80)',
	bgSunken: 'oklch(96% 0.006 80)',
	bgCard: 'oklch(100% 0 0)',
	bgTinted: 'oklch(97% 0.008 80)',

	ink: 'oklch(18% 0.010 60)',
	ink2: 'oklch(35% 0.010 60)',
	ink3: 'oklch(52% 0.010 60)',
	ink4: 'oklch(70% 0.008 60)',
	ink5: 'oklch(82% 0.006 60)',

	rule: 'oklch(89% 0.006 80)',
	ruleStrong: 'oklch(80% 0.010 80)',
	ruleInk: 'oklch(20% 0.010 60)',

	risk: 'oklch(52% 0.18 25)',
	riskBg: 'oklch(96% 0.025 25)',
	riskRule: 'oklch(85% 0.06 25)',

	warn: 'oklch(62% 0.13 65)',
	warnBg: 'oklch(96% 0.04 75)',
	warnRule: 'oklch(85% 0.08 70)',

	good: 'oklch(48% 0.10 155)',
	goodBg: 'oklch(96% 0.025 155)',
	goodRule: 'oklch(85% 0.05 155)',

	accent: 'oklch(55% 0.13 70)',
} as const;

export type Tone = 'ink' | 'risk' | 'warn' | 'good';

export const toneColor = (t: Tone) =>
	t === 'risk' ? billingColors.risk
	: t === 'warn' ? billingColors.warn
	: t === 'good' ? billingColors.good
	: billingColors.ink;

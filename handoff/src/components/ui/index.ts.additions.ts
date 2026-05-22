/* APPEND to src/components/ui/index.ts ─────────────────────────────────
   New primitives introduced by the billing module redesign.
   Existing exports (Button, Card, Badge, etc.) stay as-is.
   ──────────────────────────────────────────────────────────────────── */

export { Pill, type PillTone }      from './Pill';
export { AgeDot }                    from './AgeDot';
export { Sparkline }                 from './Sparkline';
export { MicroBars }                 from './MicroBars';
export { ImpactBar }                 from './ImpactBar';
export { KPIInline }                 from './KPIInline';
export { Timeline, type TimelineEvent } from './Timeline';

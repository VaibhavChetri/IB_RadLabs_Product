# handoff/ — Billing Module Redesign

This folder is a **drop-in package** for the IB-Dashboard repo. Files are organized to mirror the destination tree, so the engineer (human or Claude Code) can copy paths verbatim.

## Read first
- [`BILLING_REDESIGN_PLAN.md`](./BILLING_REDESIGN_PLAN.md) — the master plan. Decisions, data flow, component reuse, routing, phased rollout. **Start here.**

## Apply in this order

| Step | Path | Action |
|---|---|---|
| 1 | `src/index.css.additions.css` | **APPEND** to your existing `src/index.css`. Also update the Google Fonts `@import` to include `Instrument+Serif`. |
| 2 | `src/design-system/tokens.billing.ts` | **NEW** file. Exports JS tokens for SVG/recharts use. |
| 3 | `src/utils/billing.ts` | **NEW** file. `fmtINR`, `riskScore`, `daysAgo`, `slug`, etc. |
| 4 | `src/hooks/useClientHealth.ts` | **NEW** hook wrapping existing `ClientHealthApi.list()`. |
| 5 | `src/components/ui/{Pill,AgeDot,Sparkline,MicroBars,ImpactBar,KPIInline,Timeline}.tsx` | **NEW** primitives. |
| 6 | `src/components/ui/index.ts.additions.ts` | **APPEND** new exports to existing barrel. |
| 7 | `src/pages/billing/BillingLayout.tsx` | **NEW** layout wrapper that applies `.billing-module` class. |
| 8 | `src/pages/billing/pulse/` | **NEW** page + 5 sub-components. |
| 9 | `src/pages/billing/clients/` | **NEW** ledger + detail + 3 sub-components. |
| 10 | `src/routes/billing.routes.additions.tsx` | **APPEND** routes to your `AppRoutes`. |
| 11 | `src/data/navigation.additions.ts` | **REPLACE** the existing Invoice section in `navigation.ts`. |

## File tree

```
handoff/
├── BILLING_REDESIGN_PLAN.md
└── src/
    ├── index.css.additions.css
    ├── design-system/
    │   └── tokens.billing.ts
    ├── utils/
    │   └── billing.ts
    ├── hooks/
    │   └── useClientHealth.ts
    ├── components/ui/
    │   ├── AgeDot.tsx
    │   ├── ImpactBar.tsx
    │   ├── KPIInline.tsx
    │   ├── MicroBars.tsx
    │   ├── Pill.tsx
    │   ├── Sparkline.tsx
    │   ├── Timeline.tsx
    │   └── index.ts.additions.ts
    ├── pages/billing/
    │   ├── BillingLayout.tsx
    │   ├── pulse/
    │   │   ├── Pulse.tsx
    │   │   └── components/
    │   │       ├── ActionColumn.tsx
    │   │       ├── ActCard.tsx
    │   │       ├── DecideCard.tsx
    │   │       ├── UntrackedCard.tsx
    │   │       └── BrokenCard.tsx
    │   └── clients/
    │       ├── ClientsLedger.tsx
    │       ├── ClientDetail.tsx
    │       └── components/
    │           ├── LedgerRow.tsx
    │           ├── LedgerRowExpansion.tsx
    │           └── ContextPanel.tsx
    ├── routes/
    │   └── billing.routes.additions.tsx
    └── data/
        └── navigation.additions.ts
```

## Visual reference

See `../Invoice Dashboard Redesign.html` (Sections 01–04) for the wireframes and hi-fi mocks this code implements.

## A note on the existing 5 billing pages

The current files in your repo:
- `src/pages/billing/broken-commitments/BrokenCommitments.tsx`
- `src/pages/billing/ceo-overview/CeoOverview.tsx`
- `src/pages/billing/client-health/ClientHealth.tsx`
- `src/pages/billing/overdue-behaviour/OverdueBehaviourMap.tsx`
- `src/pages/billing/pipeline-gaps/PipelineGaps.tsx`

**Keep them in v1.** Legacy route redirects (in `billing.routes.additions.tsx`) point old URLs to the new ledger filters. Delete the old files only after 2 weeks of low traffic on the legacy routes — see Phase 4 in `BILLING_REDESIGN_PLAN.md`.

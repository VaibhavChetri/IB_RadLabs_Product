# Billing Module Redesign — Integration Handoff

**For:** InfinityBoxTech/IB-Dashboard
**Scope:** Sub-theme the `/billing/*` routes with an editorial-finance aesthetic. Replace the 5 current report pages (BrokenCommitments, ClientHealth, CeoOverview, OverdueBehaviourMap, PipelineGaps) with 3 new client-first views: **Pulse**, **Clients Ledger**, **Client Detail**.

This package contains drop-in TSX files matching your existing folder structure, plus exact integration instructions for every file. Apply in order.

---

## 0 · Why this rewrite, in one paragraph

Your data model already has full linkage: `HealthCustomer → threads → risk_signals + broken_commitments + pending_actions` with quoted evidence, sentiment, payment_intent, ball_in_court, and temporal_context. The current UI flattens that into 5 separate "report" pages where the same client appears 5 times with different cuts. The redesign treats the **client** as the unit and exposes the linkage explicitly. Reports become saved filters on a unified ledger; the killer thread-quote view (currently buried in ClientHealth) is promoted to the home screen.

---

## 1 · Decisions you need to confirm before merging

| Decision | Default in this handoff | Rationale |
|---|---|---|
| **Aesthetic** | Editorial sub-theme: warm-paper bg, Instrument Serif for hero numerals, oklch signal colors. Scoped to `/billing/*` via `.billing-module` class wrapper. | Justified because billing is the densest-data module and benefits most from editorial hierarchy. Other modules untouched. |
| **Routing** | New routes: `/billing/pulse`, `/billing/clients`, `/billing/clients/:customerId`. Old report routes redirect to the corresponding saved filter on `/billing/clients`. | Preserves bookmarks during transition. |
| **Sidebar** | Add "Pulse" as new top-level entry under Invoice. Demote 5 report items to "Saved Views" sub-list. | Frees up nav space; matches the new IA. |
| **Risk score** | Computed client-side from existing fields: `overdue × overdue_age + broken_commits × 5 + sentiment_penalty - response_bonus`. Single number 0–100. | No backend change needed for v1. Move to backend later. |
| **Composite risk threshold** | ≥80 = High (red), 60–79 = Mid (amber), <60 = Low. | Matches the visual scale; tune in tokens. |

If any of these need a different default, change before pulling the code.

---

## 2 · File map — what goes where in your repo

Copy each `handoff/*` file to the matching path in your repo. Paths preserved.

```
handoff/
├── BILLING_REDESIGN_PLAN.md                        ← this file (read-only reference)
│
├── src/index.css.additions.css                     ← APPEND to src/index.css
├── src/design-system/tokens.billing.ts             ← NEW file (billing-specific tokens)
│
├── src/components/ui/Pill.tsx                      ← NEW primitive
├── src/components/ui/AgeDot.tsx                    ← NEW primitive
├── src/components/ui/Sparkline.tsx                 ← NEW primitive
├── src/components/ui/MicroBars.tsx                 ← NEW primitive
├── src/components/ui/ImpactBar.tsx                 ← NEW primitive
├── src/components/ui/KPIInline.tsx                 ← NEW primitive
├── src/components/ui/Timeline.tsx                  ← NEW primitive
├── src/components/ui/index.ts.additions.ts         ← APPEND to src/components/ui/index.ts
│
├── src/hooks/useClientHealth.ts                    ← NEW hook (wraps existing ClientHealthApi)
├── src/utils/billing.ts                            ← NEW helpers (fmtINR, riskScore, etc.)
│
├── src/pages/billing/pulse/Pulse.tsx               ← NEW page
├── src/pages/billing/pulse/components/             ← page-local components
│   ├── ActionColumn.tsx
│   ├── ActCard.tsx
│   ├── DecideCard.tsx
│   ├── UntrackedCard.tsx
│   └── BrokenCard.tsx
│
├── src/pages/billing/clients/ClientsLedger.tsx     ← NEW page
├── src/pages/billing/clients/ClientDetail.tsx      ← NEW page
├── src/pages/billing/clients/components/
│   ├── LedgerRow.tsx
│   ├── LedgerRowExpansion.tsx
│   ├── ContextPanel.tsx
│   └── TimelineEvent.tsx
│
└── src/routes/billing.routes.additions.tsx         ← APPEND to your routes module
```

**OLD files that get deleted (after migration):**
- `src/pages/billing/broken-commitments/BrokenCommitments.tsx` → becomes a saved filter
- `src/pages/billing/ceo-overview/CeoOverview.tsx` → replaced by `Pulse.tsx`
- `src/pages/billing/client-health/ClientHealth.tsx` → replaced by `ClientDetail.tsx` (per client)
- `src/pages/billing/overdue-behaviour/OverdueBehaviourMap.tsx` → saved filter
- `src/pages/billing/pipeline-gaps/PipelineGaps.tsx` → saved filter

Keep them in v1 (parallel routes); delete after v2.

---

## 3 · Data flow — which API powers which screen

Everything flows through your **existing** `ClientHealthApi.list()` — no new endpoints needed for v1.

```ts
// src/services/clientHealthApi.ts  (UNCHANGED, already in repo)
ClientHealthApi.list(params)
  → returns { customers: HealthCustomer[], meta: HealthMeta }
```

### Pulse (home)
```ts
const { data } = useClientHealth();  // wraps ClientHealthApi.list({})

// Derive 3 lists client-side:
const act = data.customers
  .filter(c => c.threads.some(t => t.ball_in_court === 'infinitybox'))
  .sort((a, b) => riskScore(b) - riskScore(a))
  .slice(0, 5);

const decide = data.customers
  .filter(c => c.threads.some(t => t.priority === 'high' && t.broken_commitments.length > 2))
  .slice(0, 3);

const untracked = data.customers
  .filter(c => c.thread_count === 0 && c.total_outstanding > 0);

const brokenThisWeek = data.customers
  .flatMap(c => c.threads.flatMap(t =>
    t.broken_commitments.map(bc => ({ customer: c, thread: t, commitment: bc }))
  ))
  .filter(x => daysAgo(x.thread.last_message_at) <= 7);
```

### Clients Ledger
```ts
const { data } = useClientHealth({ priority: filter });
const ranked = data.customers
  .map(c => ({ ...c, _risk: riskScore(c) }))
  .sort((a, b) => b._risk - a._risk);
```

### Client Detail
```ts
const { customerId } = useParams();
const { data } = useClientHealth();
const customer = data.customers.find(c => slug(c.customer_name) === customerId);

// Build unified timeline from existing fields:
const events = customer.threads.flatMap(t => [
  ...t.risk_signals.map(s => ({ type: 'signal', tone: severityTone(s.severity), date: t.last_message_at, ...s })),
  ...t.broken_commitments.map(bc => ({ type: 'commit_broken', tone: 'risk', date: t.last_message_at, ...bc })),
  ...t.pending_actions.map(pa => ({ type: 'action', tone: pa.status === 'open' ? 'warn' : 'good', date: t.last_message_at, ...pa })),
]).sort((a, b) => +new Date(b.date) - +new Date(a.date));
```

**Future backend work** (post-v1, not required to ship):
- New endpoint `/customers/:id/timeline?limit=30` that returns the merged stream with invoice events + payment events joined in (currently we only have thread-side events client-side).
- New endpoint `/customers/health/aggregate` that returns just the meta KPIs without the full customer list, for snappier Pulse loads.

---

## 4 · Component reuse — what's existing vs new

### REUSED from `src/components/ui/` (already in your repo)
- `Card`, `CardHeader`, `CardContent` — ledger row container, action column wrapper
- `Button` — all CTAs ("Refresh", "Decide", "Send follow-up")
- `Badge` — base for new `Pill` variants
- `Input` — search field on Pulse + Clients
- `Dropdown` — Sort / Filter selectors
- `Pagination` — Clients ledger
- `Skeleton` — loading states
- `Snackbar` — actions feedback
- `Breadcrumb` from `Navigation` — header trail
- `FilterChips` — saved-filter bar on Clients

### NEW primitives (this handoff)
| File | What it does | Used in |
|---|---|---|
| `Pill.tsx` | Tonal badge: risk / warn / good / ink. Wraps existing `Badge` with editorial sizing. | Everywhere |
| `AgeDot.tsx` | Solid (fresh) → hollow (stale) freshness dot driven by days since touch. | Ledger, Pulse cards |
| `Sparkline.tsx` | Tiny inline SVG line chart. | Detail header trend strip |
| `MicroBars.tsx` | Tiny inline SVG bar chart. | Ledger "12W behavior" column |
| `ImpactBar.tsx` | Horizontal share-of-total bar. | Ledger outstanding column |
| `KPIInline.tsx` | Label-above-number stat that lives inline in a sentence-strip, not a card. | Pulse top strip |
| `Timeline.tsx` | Vertical-rail event list. Generic over event type. | Client Detail |

### NEW pages
- `Pulse.tsx` — replaces `CeoOverview.tsx`
- `ClientsLedger.tsx` — replaces 4 of the report pages
- `ClientDetail.tsx` — replaces `ClientHealth.tsx` (per-customer view)

---

## 5 · Token strategy — non-destructive sub-theme

Your existing `:root` tokens (green primary `#00a76f`, error red `#ff5630`, Public Sans) are **left alone**. Billing-only tokens are added under a `.billing-module` class wrapper, applied by the layout for `/billing/*` routes.

```css
/* src/index.css — append from src/index.css.additions.css */
.billing-module {
  --billing-bg: oklch(98% 0.005 80);
  --billing-bg-tinted: oklch(97% 0.008 80);
  --billing-ink: oklch(18% 0.010 60);
  /* …full set in additions file… */
  font-family: 'Public Sans', sans-serif;
}
.billing-module .editorial-num {
  font-family: 'Instrument Serif', serif;
  font-feature-settings: 'liga';
  font-variant-numeric: tabular-nums;
}
.billing-module .ledger-num {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}
```

Load Instrument Serif in `index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&family=Barlow:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
```

---

## 6 · Routing — what to register

```tsx
// src/routes/AppRoutes.tsx (or wherever you have your route table)
import Pulse from '../pages/billing/pulse/Pulse';
import ClientsLedger from '../pages/billing/clients/ClientsLedger';
import ClientDetail from '../pages/billing/clients/ClientDetail';

<Route path="/billing" element={<BillingLayout />}>
  <Route index element={<Navigate to="pulse" replace />} />
  <Route path="pulse" element={<Pulse />} />
  <Route path="clients" element={<ClientsLedger />} />
  <Route path="clients/:customerId" element={<ClientDetail />} />

  {/* Legacy redirects — preserve bookmarks during migration */}
  <Route path="broken-commitments"  element={<Navigate to="/billing/clients?filter=broken" replace />} />
  <Route path="ceo-overview"        element={<Navigate to="/billing/pulse" replace />} />
  <Route path="client-health"       element={<Navigate to="/billing/clients" replace />} />
  <Route path="overdue-behaviour"   element={<Navigate to="/billing/clients?filter=overdue" replace />} />
  <Route path="pipeline-gaps"       element={<Navigate to="/billing/clients?filter=untracked" replace />} />
</Route>
```

`BillingLayout` is a thin wrapper that adds `<div className="billing-module">…<Outlet/></div>` so the sub-theme tokens apply.

---

## 7 · Navigation — sidebar additions

```ts
// src/data/navigation.ts — add to Invoice section
{
  id: 'billing',
  label: 'Invoice',
  icon: 'FileText',
  children: [
    { id: 'pulse',    label: 'Pulse',    path: '/billing/pulse',    icon: 'Zap',   badge: 'NEW' },
    { id: 'clients',  label: 'Clients',  path: '/billing/clients',  icon: 'Users' },
    // Saved-view shortcuts (still hit ClientsLedger with ?filter=...)
    { id: 'broken',   label: 'Broken commits', path: '/billing/clients?filter=broken',   icon: 'AlertTriangle', subItem: true },
    { id: 'overdue',  label: 'Overdue + behaviour', path: '/billing/clients?filter=overdue', icon: 'TrendingDown', subItem: true },
    { id: 'untracked',label: 'Pipeline blindspot',  path: '/billing/clients?filter=untracked', icon: 'EyeOff',    subItem: true },
    // Legacy detail-style (per-customer)
    { id: 'health',   label: 'Client health (per client)', path: '/billing/clients/:hint', icon: 'Activity', subItem: true },
  ],
}
```

---

## 8 · Migration phasing — recommended rollout

| Phase | Days | Deliverable | Risk |
|---|---|---|---|
| **0 · Prep** | 0.5 | Add tokens, fonts, new primitives. No new routes yet. | Zero — additive only. |
| **1 · Pulse alpha** | 2 | Ship `/billing/pulse` behind a feature flag. Old pages untouched. | Low — new route, can disable. |
| **2 · Clients ledger** | 3 | Ship `/billing/clients` and `/billing/clients/:id`. Sidebar gets new entries; old report pages stay accessible. | Low — parallel routes. |
| **3 · Migration** | 1 | Add legacy redirects. Demote old report pages to "Saved Views" sub-items. Banner on old pages: "Try the new view →". | Medium — bookmarks change. |
| **4 · Cleanup** | 0.5 | After 2 weeks of low old-page traffic, delete the 5 old TSX files. | Low. |

Total: ~7 days for one engineer.

---

## 9 · Testing checklist (per page)

- [ ] Loads with skeleton, then data, with no flash
- [ ] Empty state (`customers: []`) renders without crashing
- [ ] Error state from `ClientHealthApi` shows snackbar + retry
- [ ] Sort + filter chips update URL query params (`?filter=broken&sort=risk`)
- [ ] Deep link to a customer detail works on refresh (no Redux dependency for initial render)
- [ ] Keyboard: ⌘K opens search, ↑↓ moves row selection, Enter opens detail
- [ ] All currency rendered via `fmtINR()`, never `toLocaleString` directly (consistency)
- [ ] All dates rendered via `fmtRelativeDate()` (e.g. "7d ago")
- [ ] Cells with no data render `—`, never `null` / `undefined` / `0` (unless 0 is meaningful)

---

## 10 · Open questions to resolve with backend

1. **Invoice + payment events** are not in `ClientHealthApi` today. The Detail timeline currently only shows thread-side events. Do we add `invoice_events: InvoiceEvent[]` to `HealthCustomer`, or fetch separately from an invoice endpoint?
2. **Per-customer risk score**: derive client-side from existing fields (this PR), or move to backend so it's consistent across surfaces?
3. **"Frequent breaker" flag**: which threshold? Suggest `broken_commitment_count >= 10` in last 30 days. Should this be in the API response or computed client-side?
4. **Predicted payment window**: already in `HealthThread.predicted_payment_window`. Surfaced on Detail but not yet on Pulse — add to Pulse Act-today cards?

---

## What Claude Code / your engineer should do

1. Read this file end-to-end.
2. Run the migration in order: tokens & CSS → primitives → hook → pages → routes → navigation.
3. Each file in this handoff has comments at the top noting what it depends on and what it exports.
4. If a prop or import doesn't line up with the repo's actual conventions (e.g. you use `clsx` instead of `cn`), adapt rather than copy verbatim.
5. **Don't redesign**. The visual decisions are intentional — warm-paper background, serif numerals, dense ledger rows. Push back on the requestor (Swati) if changing aesthetic, not on the structure.

---

**Built by:** Claude design exploration
**Source canvas:** see `Invoice Dashboard Redesign.html` for the visual reference (Sections 01–04)

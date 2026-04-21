# Production deployment runbook — Proxy Approvers + First-to-Approve-Wins

## Scope of this release

1. **Bug fix:** Zoho invoices SQL syntax error (dangling `AND` in facet queries).
2. **Feature:** Two-stage vendor invoice approval with **first-to-approve-wins** for finance stage.
3. **Feature:** **Proxy approver** role — Swati & Priyanka can step in for Asha when she's unavailable.
4. **Feature:** Audit trail — records the **proxy clicker** separately from the **approver on record**.

---

## Step 1 — DB migrations (run first, backward compatible)

All of these are safe to run with the old code still live. Run them on prod DB **before** deploying code.

### 1a. Add `superseded` to the decision enum

```sql
ALTER TABLE procurement_vendor_invoice_approvals
MODIFY COLUMN decision
  ENUM('pending','approved','rejected','superseded')
  NOT NULL DEFAULT 'pending';
```

### 1b. Add `procurement_proxy_mode` to `admins`

```sql
ALTER TABLE admins
ADD COLUMN procurement_proxy_mode TINYINT UNSIGNED NOT NULL DEFAULT 0
COMMENT 'When 1 AND admin is in proxy_approver_ids, they see & can act on every pending vendor-invoice approval';
```

### 1c. Add `proxied_by` to `procurement_vendor_invoice_approvals`

```sql
ALTER TABLE procurement_vendor_invoice_approvals
ADD COLUMN proxied_by INT UNSIGNED DEFAULT NULL
  COMMENT 'admin.id of proxy user who actually clicked approve/reject (NULL = real approver acted)',
ADD KEY idx_pvia_proxied_by (proxied_by),
ADD CONSTRAINT fk_pvia_proxied_by
  FOREIGN KEY (proxied_by) REFERENCES admins(id) ON DELETE SET NULL;
```

---

## Step 2 — Create Asha's admin on prod

Asha likely doesn't exist as an admin on prod (verify first). **Recommend UI signup** rather than SQL insert so password is set properly.

- Username: `asha-accounts`
- Email: `asha@getinfinitybox.com`
- `user_type_id = 22` (same as Swati — gives her access to approval screens)

After creation, **note her admin ID** — you need it for Step 3.

---

## Step 3 — Config rows (after Asha's admin exists)

**Look up prod admin IDs first** (they will NOT match local/stage):

```sql
SELECT id, first_name, email FROM admins
WHERE email IN (
  'asha@getinfinitybox.com',
  'swati@getinfinitybox.com',
  'priyaagarwal.2407@gmail.com'    -- Priyanka's email
);
```

Then run (substitute real prod IDs):

```sql
-- Asha becomes sole finance approver
UPDATE procurement_system_config
SET config_value = '<asha_id>', updated_at = NOW()
WHERE config_key = 'finance_approver_ids';

-- Swati + Priyanka as proxies
INSERT INTO procurement_system_config (config_key, config_value, description, updated_at)
VALUES ('proxy_approver_ids', '<swati_id>,<priyanka_id>',
        'Admin IDs allowed to act as approval proxies (see every pending invoice when their proxy mode toggle is ON)',
        NOW())
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  description = VALUES(description),
  updated_at = NOW();

-- Verify
SELECT config_key, config_value
FROM procurement_system_config
WHERE config_key IN ('first_approver_ids', 'finance_approver_ids', 'proxy_approver_ids');
```

---

## Step 4 — Deploy code

Files changed in this release:

| File | What changed |
|---|---|
| `src/services/billing/db/zohoInvoices.db.ops.js` | Zoho invoices facet SQL fix (dangling AND) |
| `src/services/procurement.service.js` | Added proxy helpers; modified `submitVendorApprovalDecision` (stage-2 first-to-approve-wins + proxy support); modified `getPendingMyApproval` (proxy mode expands list + surfaces actable row); modified `getMyApproverStatus` (proxy-eligible users treated as approvers); added `setProxyMode` service; added `proxiedBy` / `proxiedByName` to approval trail responses |
| `src/controllers/procurement/index.js` | Added `setProxyMode` controller |
| `src/validations/procurement.validation.js` | Added `setProxyMode` request schema |
| `src/routes/v1/procurement/index.js` | Added `POST /v1/procurement/approval/proxy-mode` route |

Normal deploy (`git push` → CI → server restart / PM2 restart). **No env var changes required.**

---

## Step 5 — Post-deploy sanity checks

```bash
# On prod, check the config loaded
curl -H "Authorization: Bearer <any-admin-token>" \
  https://<prod-domain>/v1/procurement/me/is-approver
```

Expected response shape:

```json
{
  "isApprover": true,
  "isDirectApprover": false,
  "proxy": { "eligible": true, "active": false }
}
```

Login as each user and verify:

| User | `isApprover` | `proxy.eligible` | Approvals menu |
|---|---|---|---|
| Shashwat | true | false | visible, sees his Stage-1 queue |
| Asha | true | false | visible, sees her Stage-2 queue |
| Swati | true | true | visible, toggle shown, empty until toggle ON |
| Priyanka | true | true | visible, toggle shown, empty until toggle ON |
| Anyone else | false | false | hidden |

---

## Step 6 — Frontend deployment

The FE must ship the **proxy toggle component** in lockstep with (or immediately after) the backend. Spec already sent to the FE team. Without the FE toggle, Swati & Priyanka see the menu but have no way to flip proxy ON.

### Quick FE spec reference

**New endpoint:**

```
POST /v1/procurement/approval/proxy-mode
Body: { "enabled": true | false }
Response: { data: { enabled: boolean } }
403 if caller isn't in proxy_approver_ids
```

**Existing endpoint — new fields returned:**

```
GET /v1/procurement/me/is-approver
Response data:
{
  isApprover: boolean,          // now true if direct OR proxy-eligible
  isDirectApprover: boolean,    // true only if in approver config
  proxy: { eligible, active }
}
```

```
GET /v1/procurement/vendor-invoices/pending-my-approval
Response top-level now includes:
{
  ...,
  proxy: { eligible, active }
}

Each vendor in data[] now also has:
  actingAsProxy: boolean   // true if current act would be a proxy act

Each approval trail row now has:
  proxiedBy: number | null
  proxiedByName: string | null
```

**FE behaviour:**

1. Render "Proxy Mode" toggle on the Approvals page header — **only** if `proxy.eligible === true`.
2. Toggle initial state = `proxy.active`.
3. On flip, call `POST /approval/proxy-mode`, then refetch the approvals list.
4. When `proxy.active === true`, render a subtle banner: "Viewing all pending approvals (proxy mode)".
5. For each approval trail row where `proxiedByName != null`, render the decision line as "Approved by {proxiedByName} (proxy)".

---

## Rollback plan

- **Code:** `git revert` and redeploy.
- **DB:** all migrations are additive — safe to leave the extra columns / config rows in place even if code is rolled back. Old code ignores them. **No DOWN migration required.**

---

## What's NOT in this release

Keep these for future work:

1. **Send approval emails from `procurement@getinfinitybox.com`** — requires code change in `email.service.js` + new env var `IB_PROCUREMENT_GMAIL_APP_PASSWORD`. Emails on prod still send from `kiran@getinfinitybox.com`.
2. **Zoho invoice sort + Excel export** — backend not built yet; spec aligned with FE but not shipped.
3. **FE proxy toggle UI** — handed off to FE team; they build it.

---

## Suggested commit structure

Two commits keep the history clean:

1. `fix(billing): zoho invoices facet SQL dangling AND` — only `src/services/billing/db/zohoInvoices.db.ops.js`.
2. `feat(procurement): proxy approvers + first-to-approve-wins finance stage` — everything else in the table above.

---

## Summary of backend endpoints touched

| Endpoint | Change |
|---|---|
| `GET /v1/procurement/me/is-approver` | New fields: `isDirectApprover`, `proxy: { eligible, active }` |
| `GET /v1/procurement/vendor-invoices/pending-my-approval` | Expanded list in proxy mode; new fields on rows (`actingAsProxy`, `proxiedBy`, `proxiedByName`); top-level `proxy` object |
| `GET /v1/procurement/leads-tracker/:leadId/vendor-invoices/approval-status` | New fields on rows: `proxiedBy`, `proxiedByName` |
| `POST /v1/procurement/approval/proxy-mode` | **New.** Sets caller's `admins.procurement_proxy_mode`. 403 if not eligible. |
| `POST /v1/procurement/leads-tracker/:leadId/vendors/:vendorId/approval-decision` | Now accepts proxy acts: if caller has no direct row but `proxy_mode = 1` and is in `proxy_approver_ids`, picks the earliest pending row on that vendor and records `proxied_by = caller.id` |

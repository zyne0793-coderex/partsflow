# PartsFlow

Spare-parts inventory and maintenance management with private team workspaces.

## Features

- Email/password sign-in, confirmation resend, password reset and session refresh.
- Multiple workspaces with owner, admin, member and viewer roles enforced by PostgreSQL RLS.
- Email-matched invitations, seven-day expiry, revocation and owner-controlled role changes/removal.
- Parts catalog with server-side search, pagination, storage locations, minimum stock and archiving.
- Permanent stock receipts/issues/returns, negative-stock prevention, duplicate-submit protection and optional work-order links.
- Work orders with equipment, priorities, assignees, due dates, status and completion notes.
- Dashboard with low-stock alerts, open jobs and overdue counts.
- Inventory CSV export with spreadsheet formula-injection protection.

## Local setup

Use Node.js 22+ and pnpm 11. Copy `.env.example` to `.env.local` and supply your Supabase URL and **publishable** key. Never use a service-role key in the frontend. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

For a new database, apply `supabase/schema-phase-1.sql` first, then the SQL files in `supabase/migrations/` in order. For the existing Phase 1 database, apply only the migration. It preserves existing parts, places each original catalog in a private workspace, and supports old Phase 1 inserts during rollout. Do not rerun the baseline on an existing database.

## Authentication setup

In Supabase Authentication → URL Configuration:

- Site URL: `https://partsflow-two.vercel.app`
- Allowed redirect URL: `https://partsflow-two.vercel.app/auth/callback`
- For local testing also allow `http://localhost:3000/auth/callback`.

Keep email confirmation enabled. Open confirmation/reset links in the browser that requested them so the PKCE verifier cookie is available. The callback offers either entering the app or setting a new password. If the link fails, sign in if already confirmed, or request a fresh link from **Need help signing in?**

Supabase's default email service restricts recipients and has low sending limits. Configure a custom SMTP sender in Supabase before onboarding teammates outside the Supabase organization. Credentials must be entered privately in the Supabase dashboard. Team invitations are displayed in **Team & workspaces** after the recipient signs in with the matching verified email; PartsFlow does not automatically send invitation emails.

## Roles

| Role | Read inventory and jobs | Edit parts, stock and jobs | Invite/revoke invitations | Change/remove members |
|---|---|---|---|---|
| Owner | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | No |
| Member | Yes | Yes | No | No |
| Viewer | Yes | No | No | No |

The owner cannot be removed or demoted. Removed users lose database access immediately. A user may belong to multiple workspaces and switches between them using the sidebar.

## Operating guide

1. Confirm your email and sign in. Create a workspace or accept an invitation.
2. Add a part with its unit, location and low-stock threshold.
3. Open the part and receive opening stock with a reference/reason.
4. Create a work order and assign a teammate.
5. Issue stock from the part and select the work order. Record returns as stock in.
6. Update the work order's status and notes when finished.
7. Check the overview for replenishment and overdue work.

Stock records are immutable. Correct errors with a compensating movement and a clear explanation. A part's unit cannot change after stock has been recorded. Archived parts retain their history; unarchive before recording another movement. Completed/cancelled work orders reject new movements until reopened.

## Verification

```sh
pnpm test
pnpm lint
pnpm build
pnpm audit --prod
```

Database tests run in an isolated PostgreSQL-compatible PGlite instance. They cover workspace isolation, viewer restrictions, invitation acceptance, membership removal, stock balancing, negative-stock rejection, immutable history, unit consistency and closed-order restrictions. They do not send emails or modify the live database.

Before release, also check the actual deployed app: signed-out route protection, confirmation/reset emails, workspace creation/switching, parts CRUD, stock issue/return, work-order editing, viewer access, CSV download and mobile layout. Email delivery and authenticated browser checks need a verified account.

## Deployment

The existing GitHub/Vercel integration deploys the production branch. Apply the database migration, deploy the application, and verify the public URL. Vercel requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. This repository pins production dependencies and overrides PostCSS to a patched version.

No payment integration or paid service is enabled. Workspaces are a shared operational inventory, not a subscription billing service. Supplier purchasing, invoicing, attachments, automated emails, and external notifications are not included. Work-order selection lists the latest 1,000 open jobs; detail history shows the latest 20 part movements or 100 work-order movements, with full paginated stock history available separately. Dates are displayed in Malaysia time.

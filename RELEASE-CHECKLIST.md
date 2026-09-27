# Release handover

## Verified on 27 September 2026 (Malaysia time)

- Production build and TypeScript checks passed on Next.js 15.5.24 / React 19.3.0.
- 11 isolated PostgreSQL tests passed, including team authorization and stock invariants.
- Production package audit reports no known vulnerabilities.
- The `complete_inventory` migration is applied to Supabase project `yjfxrweyjttdfupibmox`.
- All six public tables have RLS enabled; 13 policies are present; no public security-definer functions exist.
- A live non-member database read returned no parts, workspaces, memberships, orders or stock movements.
- Vercel successfully built the `complete-partsflow` review branch.
- GitHub Actions passed tests, TypeScript, production dependency audit and build for PR #1 at `0831e0a2417f9f56c5f5f91c5e25ae20ad823297`; Vercel reports that deployment Ready.
- The user confirmed their email and signed into the hosted preview.
- A live database transaction verified workspace creation, receipt of 10 units, issue of 3 units, balance 7, and insufficient-stock rejection. The test transaction was rolled back.
- Authenticated preview UI checks passed: workspace creation, part creation, receipt of 10 units, and an assigned work order with high priority, in-progress status and a due date.
- Authenticated UI stock checks passed: issue 3 units linked to the work order, balance 7, and rejection of an 8-unit issue.
- The work order was saved as completed with completion notes and its linked 3-unit issue displayed.
- CSV download succeeded; the downloaded file contained the expected columns and fixture row with quantity 7, minimum stock 8 and archived false.
- Searching for `TEST-BRG` with the Low stock filter returned the expected fixture row.
- Test stock movements, work order and part were removed; database counts for those fixtures are all zero. The workspace was retained.
- An anonymous request to production `/parts` returned the sign-in page (HTTP 200 after redirects).

## Required before production promotion

1. Mark PR #1 ready, merge the reviewed change into `main`, and confirm the production deployment at `https://partsflow-two.vercel.app`.

Only mark pending checks complete when exercised; database transaction tests do not replace browser verification. Keep email verification enabled.

## Limits and operational notes

- Invitations appear in the app; no automatic invitation email is sent.
- Two-account browser checks for invitation acceptance, viewer access, member editing and removal remain unverified. Automated database tests cover the role and isolation rules.
- Custom SMTP and password-reset email delivery remain unverified. Configure custom SMTP before onboarding recipients outside the default sender's permitted organization addresses.
- The live Supabase Site URL and callback allowlist could not be independently read through the available connector. The repository documents `https://partsflow-two.vercel.app` and `https://partsflow-two.vercel.app/auth/callback` as the intended values; confirm them in Supabase Authentication settings before relying on production email redirects.
- No paid service or billing integration was enabled.
- Supabase's existing leaked-password-protection advisory remains. Review availability/configuration in Supabase Authentication settings; no paid upgrade was made.
- Local browser verification was unavailable; authenticated UI verification is being performed in the hosted preview.
- Original project `sources/` was empty and was left unchanged. Working code is in the separate `partsflow/` checkout.

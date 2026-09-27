# Release handover

## Verified on 27 September 2026 (Malaysia time)

- Production build and TypeScript checks passed on Next.js 15.5.24 / React 19.3.0.
- 11 isolated PostgreSQL tests passed, including team authorization and stock invariants.
- Production package audit reports no known vulnerabilities.
- The `complete_inventory` migration is applied to Supabase project `yjfxrweyjttdfupibmox`.
- All six public tables have RLS enabled; 13 policies are present; no public security-definer functions exist.
- A live non-member database read returned no parts, workspaces, memberships, orders or stock movements.
- Vercel successfully built the `complete-partsflow` review branch.

## Required before production promotion

1. Sign in to Vercel to open the protected preview. The connected Vercel integration currently lacks permission to this team.
2. Complete PartsFlow email confirmation. The existing account remained unconfirmed during verification.
3. Confirm Supabase Site URL and allowed callback URL match the production URL (see README).
4. Test authenticated UI flows in the preview: workspace creation, part creation, receiving 10 units, issuing 3 to a work order, balance 7, rejection of an 8-unit issue, order completion, CSV export, and sign-out protection.
5. Test two accounts: invitation acceptance, viewer read-only access, member editing, and access removal. Configure custom SMTP before inviting addresses outside the Supabase default sender's permitted organization recipients.
6. Merge the reviewed change into `main` and confirm the production deployment at `https://partsflow-two.vercel.app`.

Do not mark authenticated browser/email checks complete until exercised with a verified account. Do not disable email verification to bypass the blocker.

## Limits and operational notes

- Invitations appear in the app; no automatic invitation email is sent.
- No paid service or billing integration was enabled.
- Supabase's existing leaked-password-protection advisory remains. Review availability/configuration in Supabase Authentication settings; no paid upgrade was made.
- Automatic approval review rejected starting the local server with “blocked by policy,” so local browser verification was not completed. The protected hosted preview is the remaining verification route.
- Original project `sources/` was empty and was left unchanged. Working code is in the separate `partsflow/` checkout.

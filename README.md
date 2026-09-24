# PartsFlow — Phase 1

PartsFlow is a spare parts catalog for a single signed-in account. This phase includes email/password login, a catalog with search, add/edit/view screens, and database access rules that keep each account's parts private.

Stock quantity, stock movements, work orders, billing, and a separate dashboard are future phases.

## Setup

1. Create a **new** Supabase project for PartsFlow, then apply `supabase/schema-phase-1.sql` to that project's database. Do not apply it to another project.
2. In Supabase **Authentication → URL Configuration**, set the Site URL to your deployed PartsFlow URL and allow `https://YOUR-DEPLOYED-URL/auth/callback` as a redirect URL. Keep email confirmation enabled.
3. In Vercel, import the GitHub repository as a Next.js project. Add the environment variables below for Production (and Preview if you plan to test previews), then deploy:
   - `NEXT_PUBLIC_SUPABASE_URL`: the new project's API URL.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the new project's public/publishable key. Never use a secret or service-role key.
   - `NEXT_PUBLIC_SITE_URL`: the deployed URL including `https://`, without a trailing slash. The current public production URL is already supplied in `.env.production`; update it if the site domain changes.
4. For local development, copy `.env.example` to `.env.local`, use the same Supabase URL and public key, set the site URL to `http://localhost:3000`, and allow `http://localhost:3000/auth/callback` in Supabase. Then run `npm install` and `npm run dev`.

## Test

1. Open the deployed URL; you should see the login screen.
2. Enter an email and password (8+ characters) and select **Create account**. Confirm the email when it arrives. Sign in.
3. Select **Add part**. Enter part number `BRG-6205` and name `Bearing 6205`, then save. See it in the catalog.
4. Search for `6205`, open **View**, select **Edit part**, change its storage location, and save. Reopen the part and confirm the new location appears.
5. Sign out and open `/parts` directly. You should return to login.

## Current scope

- Catalog search covers the 1,000 most recently added parts. Pagination is needed before a catalog grows beyond that.
- Each account has a private catalog; shared factory team access needs a later access model. Do not invite coworkers expecting a shared catalog yet.
- Supabase's default email sender has limits; a custom sender may be needed before onboarding customers at scale.

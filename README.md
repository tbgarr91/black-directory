# For The Record — Black-Owned Business Directory

A Next.js app connected to a live Supabase database: search, self-submission,
review moderation, and an admin approval tool.

## Already done for you
- Live Supabase project ("black-business-directory" in your TBG org):
  full schema, row-level security, sample data, and admin auth applied.
- This app is wired to it via `.env.local`.

## Running it locally
```
npm install
npm run dev
```
Open http://localhost:3000

## Deploying (Vercel)
1. Push this folder to a GitHub repo (see git commands below).
2. Import the repo at vercel.com/new under your TBG team.
3. Add these two environment variables (copied from `.env.local`):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Deploy.

### Pushing to GitHub for the first time
```
cd black-directory
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tbgarr91/black-directory.git
git push -u origin main
```
(Create the empty repo on GitHub first, or tell me the repo name and I can
link it to Vercel directly once it exists.)

## Public pages
- `/` — homepage: search + category browse + top-rated businesses
- `/search?q=...` — searches listings AND reference brands (search
  "Sephora" → surfaces Black-owned alternatives)
- `/search?category=slug` — browse one category
- `/business/[slug]` — listing detail, both verification badges, reviews
- `/submit` — public self-submission form (the on-the-fly signup flow)

## Admin pages (require a granted admin account)
- `/admin/login` — sign up or log in (real Supabase Auth — email/password)
- `/admin` — dashboard with pending counts
- `/admin/businesses` — approve/reject pending listings; verify ownership
  independently from publishing
- `/admin/reviews` — publish/reject pending reviews
- `/admin/qr` — generate a printable QR code pointing at `/submit`, for
  handing out at events (the on-the-fly signup flow)

### Granting yourself admin access
Nobody has admin rights by default — signing up alone grants nothing.
1. Go to `/admin/login`, sign up with your email, confirm it.
2. Tell me (Claude) the email you used, and I'll run one SQL statement
   against Supabase to add you to the `admin_users` table.
   (Alternatively, run this yourself in the Supabase SQL editor:
   `insert into admin_users (user_id) select id from auth.users where email = 'you@example.com';`)

## Security model
- Row Level Security is enabled on every table.
- The public API key can only ever read ACTIVE businesses and PUBLISHED
  reviews — verified independently in this project (anon role literally
  cannot see pending rows or write a pre-verified listing).
- Self-submissions are force-set to `pending`/`unverified` by database
  policy, not app logic — can't be bypassed by editing client code.
- Admin actions (approve, verify ownership, publish reviews) require a
  real logged-in Supabase Auth account that's been explicitly added to
  `admin_users`. There is no shared password and no service_role key
  anywhere in this app's code.

## What's next
- BOM / Black Dollar / RRT sync, using the `external_refs` table already
  in the schema for exactly this purpose.
- Real category taxonomy as you decide scope.
- Optional: email notification to admins when something new is pending.

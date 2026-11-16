# TagMango clone (Next.js)

Marketing site + working creator dashboard.

```bash
npm install
npm run dev        # http://localhost:3000
```

> Don't run `npm run build` while `npm run dev` is running — they share the `.next` folder.

## What works

| Area | Routes |
|---|---|
| Marketing site | `/`, `/pricing`, `/demo` |
| Auth (OTP, phone or email) | `/web/sign-up` → OTP → `/web/sign-up/about`, `/web/login` |
| Dashboard (same URLs as tagmango.com) | `/web/dashboard/<page>` — getstarted, analytics, mango-overview, courses, workshop, events, bookings, earnings, transactions, subscriptions, balance, mango-websites, landing-page, storefront, subscribers, leads-management, campaigns, feed-banners, coupons, unsubscribed-users, path, email-templates, whatsapp-templates, whatsapp-event-mapping, whatsapp-account-management, certificates, integrations, affiliate, points, badges, leaderboard, gamification-settings, platformsettings, restrict-login-devices, reported-content, blocked-users, team-management, cloud, accountsettings, plans, tax-reports |
| Top tabs | `/web/feed`, `/web/workshops`, `/web/courses` (+ learner player), `/web/messages` |
| Public buyer pages | `/web/lite/store/<creatorId>` (storefront), `/p/<slug>` (Mango Page), `/checkout/<mangoId>`, `/book/<eventId>` (1-1 booking), `/site/<slug>` (Website Builder) |

### Plans
New accounts start on **Basic**, so some pages show “This feature is locked!” exactly like TagMango
(Website Builder, Banners, Unsubscribed Users, Path, WhatsApp, Affiliates, Gamification, Team, Security).
Upgrade on **Billing & Plans › Plans** (test mode — no payment) to unlock them; a test invoice appears under Billings.

The Get Started checklist ticks itself off as you create a mango, link a product to it, and add a bank account.
Buying through a Mango Page / checkout records a sale for the creator, applies coupons, and raises a notification.

## Admin panel (`/admin`)

A platform-level control room for whoever runs the marketplace (not for individual creators).

| Page | What you can do |
|---|---|
| Overview | GMV, orders, sign-ups, commission, plan mix, top creators, live activity, items needing attention |
| Creators | Search/filter every account; change plan, verify/revoke KYC, grant Freedom Setup, **suspend/reinstate**, add private notes, message the creator, **delete** (type-the-email confirm) |
| Orders | All orders across creators; **refund / restore**; CSV export |
| Withdrawals | Payout queue with bank details: **mark paid** (with UTR) or **reject** (reason required, balance restored) |
| Plans & Billing | Plan distribution, estimated MRR, all invoices |
| Reports | Moderate reported posts/comments: dismiss or remove |
| Announcements | Broadcast to all creators or one plan (shows in their notification bell); retract anytime |
| Audit log | Every admin action, searchable, exportable |
| Settings | Admin list, environment, database/storage stats |

**Who is an admin?** Anyone whose login email is in `ADMIN_EMAILS` (comma separated) in `.env.local`, then restart the dev server.
There is deliberately no UI to grant admin rights. Every `/api/admin/*` route re-checks this on the server, so hiding a menu isn't the only protection.

```bash
echo 'ADMIN_EMAILS=you@yourcompany.com' >> .env.local
```
Sign up / log in with that email, then open `/admin` (or **Admin panel** in your profile menu).

Suspended creators are signed out everywhere, can't log in, and their checkout, storefront, booking and landing pages go offline.

## Development stand-ins (replace before going live)

- **Database:** `src/lib/db.ts` stores everything in `data/db.json` (git-ignored). Swap it for Postgres/Mongo — serverless hosts don't keep local files.
- **OTP delivery:** no SMS/email provider is connected, so in development the OTP is shown on screen. Send it via MSG91/Twilio/SES in `src/app/api/auth/otp/route.ts` and that note disappears in production builds.
- **File uploads (TagMango Cloud):** stored in `data/uploads/` (git-ignored). Use S3/R2 in production.
- **Payments:** `/api/public/checkout` is test mode — it records a successful sale without charging. Plug Razorpay/Stripe in there.
- **KYC:** only the PAN format is validated; connect a KYC provider in `src/app/web/(app)/dashboard/balance/page.tsx`.
- **Email broadcast:** records the send and recipient count; connect an email service to actually deliver.

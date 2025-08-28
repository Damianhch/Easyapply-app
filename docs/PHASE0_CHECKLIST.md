# Phase 0 — Checklist (minimal)

Use this as the single Phase 0 action list. For full step context, see `SETUP_STEPS.txt`.

### Configure env (.env.local)
Required:
- `DATABASE_URL` (Supabase Postgres; often add `?sslmode=require`)
- `ALLOWED_ORIGINS` (your WordPress origin)
- `WP_JWT_SECRET` or `WP_JWT_PUBLIC_KEY`

Optional (later phases):
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `API_SHARED_SECRET`, `GMAIL_BACKEND_URL`

### Initialize locally
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Verify
- `/api/health` returns `{ ok: true, ts }`
- Tables exist in Supabase
- Typecheck/build succeed: `npm run typecheck`, `npm run build`

### WordPress readiness
- CORS accepts your WP origin
- JWTs from WP validate (HS256 or RS256)

### Move to Phase 1
- Implement `/home`, `/sections/:slug`, `/embed/:slug`
- Test `public/easyapply-embed.js` from WP

Troubleshooting: see README “Quick start” and `docs/ROLLBACK.md`.

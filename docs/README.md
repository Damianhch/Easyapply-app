# EasyApply (Next.js + Vercel + Supabase + WordPress)

Compact overview and single sources of truth for setup and operations.

### 🚀 Quick start
1) Install and run
```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma db push
npm run dev
```

2) Healthcheck: open `/api/health`

3) Set `DATABASE_URL` (Supabase), `ALLOWED_ORIGINS` (WordPress), and JWT secret/key.

### 📚 Docs index
- Phase steps (authoritative): see `SETUP_STEPS.txt`
- Phase 0 checklist (actions + commands): `docs/PHASE0_CHECKLIST.md`
- Phase 0 summary: `PHASE0_COMPLETE.md`
- Rollback guide: `docs/ROLLBACK.md`

### 🔗 Embeds
Use `public/easyapply-embed.js` to inject sections into WordPress (see `SETUP_STEPS.txt` → Phase 1).

### 🧰 Scripts
`dev`, `build`, `start`, `typecheck`, `prisma:*`, `setup:phase0`

### 🧭 Next up (Phase 1)
- `/home`, `/sections/:slug`, `/embed/:slug`
- Test embeds from WordPress origin
- See `SETUP_STEPS.txt` for details

# 06. Cost analysis

Prices are approximate, gathered from third-party sources in October 2026. **Re-verify each on the vendor's own pricing page when implementing**, and update this file.

## Owner's budget

- Vercel Pro: accepted (about $20/month per seat).
- Up to about **$5/month** extra for storage etc.
- Everything else free-tier or avoided.

## Estimate for the current library (about 30 GB of galleries + site assets)

| Item | Choice | Est. monthly |
|---|---|---|
| Hosting + functions + analytics | Vercel Pro | about $20 (accepted) |
| Database | Neon Postgres, free tier (0.5 GB) to start. Metadata for thousands of photos is small. Paid tier only if needed. | $0 |
| Private originals + derivatives | Cloudflare R2: about $0.015/GB/month, 10 GB free, **no egress fees**. 30 GB -> 20 billable GB. | about $0.30 |
| Public site derivatives/media | Vercel Blob (already used in stuyaviators) or R2 public bucket. Keep within the free/included quotas of Pro if possible. | about $0-1 |
| Email | Resend free (3,000/month, 100/day) | $0 |
| Spam protection | Cloudflare Turnstile | $0 |
| Cron / queue | Vercel Cron + `jobs` table | $0 (within Pro) |
| Domain and subdomains | `jerryqiu.com` already owned; `photos.`, `music.`, `flying.` are free DNS records. Two Vercel projects (hub app serving three hostnames; photos app) share the one Pro plan. | existing |
| Google Workspace | already owned | existing |
| Payments | Stripe: no monthly fee; about 2.9% + $0.30 per card charge (same kind of fee ShootProof's payment processing passes through) | per sale |
| **Total recurring beyond Vercel** | | **about $0.30-$2** |

Growth: each additional 100 GB on R2 adds about $1.50/month. At 500 GB it is about $7.50/month, which would exceed the $5 extras cap; the storage meter in admin (Phase 3) should warn at 75% of budget.

## Versus ShootProof

ShootProof bills by photo count/plan (third-party sources list roughly $10-11/month for 1,500 photos, about $20 for 5,000, about $50-60 for unlimited; verify on shootproof.com). The owner currently pays about $15-20/month. Self-hosting saves roughly that amount **only if Vercel Pro is already being paid** for the portfolio; if it is, the marginal cost of the platform is about $0.30-$2/month. Savings come with owner responsibilities: backups, uptime, payment disputes, legal templates, security.

## Cost-control rules for implementers

- Never add a paid service or raise a tier without recording it in [QUESTIONS.md](QUESTIONS.md) and choosing the free path meanwhile.
- Put expensive operations (zip building, derivative generation) behind rate limits and caching.
- Prefer R2 for bulk bytes (no egress charge), keep Vercel bandwidth low with long `Cache-Control` on public derivatives.
- Add a `docs/cost-log.md` entry whenever a dependency's pricing matters.

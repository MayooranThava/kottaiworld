# Deploy KottaiWorld (Cloudflare Pages + Access + GitHub Actions)

Friends open **https://kottai.mayotutors.com** → email login → dashboard.  
**https://www.mayotutors.com/** (tutors site) stays unchanged. This is only a **subdomain**.

The site is a **sanitized copy** (not your Docker volume, not a tunnel into your PC).

```
Your PC (for data updates)          GitHub Actions              Cloudflare
──────────────────────────          ──────────────              ──────────
collector → sanitize-snapshot
  → public/data/snapshot.json
  → git push  ─────────────────────►  build static Next.js
                                      wrangler pages deploy  ──►  Pages project kottaiworld
                                                                custom domain
                                                                kottai.mayotutors.com
                                                                Access email allowlist
```

## One-time setup

### 1. Pages project + GitHub Actions secrets

- Pages project name: **`kottaiworld`** (matches the Action)
- GitHub → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | Token that can edit Workers/Pages |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |

Merge to `main` (or **Actions → Deploy Cloudflare Pages → Run workflow**) so the first deploy exists.

### 2. Attach `kottai.mayotutors.com`

In Cloudflare (same account / zone as **mayotutors.com**):

1. **Workers & Pages** → project **`kottaiworld`** → **Custom domains**  
2. Add **`kottai.mayotutors.com`**  
3. Cloudflare will create the DNS `CNAME` on the `mayotutors.com` zone automatically  

Do **not** change `www` / apex records that point at the tutors site.

### 3. Hide it behind Access (required)

Zero Trust → **Access** → **Applications** → **Add** → **Self-hosted**:

| Field | Value |
|-------|--------|
| Application name | KottaiWorld |
| Application domain | `kottai.mayotutors.com` |
| Policy | **Allow** → **Emails** → you + 4–5 friends |

Optional but recommended: also protect `kottaiworld.pages.dev` the same way (or leave that URL unused) so the raw Pages hostname isn’t an open backdoor.

Until Access is on, treat the URL as not ready for friends.

### 4. What friends get

Share only:

```text
https://kottai.mayotutors.com
```

- Random people hitting the link see Cloudflare’s **login**, not the map  
- Not linked from mayotutors homepage → stays out of the way  
- Tutors site at `www.mayotutors.com` is untouched  

## Publishing world data from your PC

```powershell
cd C:\dragonwilds\kottaiworld
git checkout main
git pull
docker compose up -d

powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\publish-sanitized-snapshot.ps1
```

That pushes a sanitized `apps/web/public/data/snapshot.json` → Actions redeploys Pages.

### What is stripped

- Paths, diagnostics, raw errors  
- Cluster internals  
- Full blueprint GUIDs (shortened)  
- Never `.sav`, never `.env` / join code / admin password  

## Local Docker (unchanged)

```powershell
docker compose up --build -d
```

→ http://localhost:3000 with live collector.  
Cloudflare serves `/data/snapshot.json` only.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Tutors site broke | You changed apex/`www` DNS — restore those; only the `kottai` subdomain should point at Pages |
| `kotta.…` 404 | Pages deploy not done yet, or custom domain still provisioning (wait a few minutes) |
| Friends see login forever | Their email isn’t on the Access allow policy |
| Open without login via `*.pages.dev` | Add Access on that hostname too |

Workflow: [`.github/workflows/deploy-cloudflare-pages.yml`](../.github/workflows/deploy-cloudflare-pages.yml)

# Deploy KottaiWorld (Cloudflare Pages + Access + GitHub Actions)

Friends open a normal link → **email login** → dashboard on phone or PC.  
The site is a **sanitized copy** (not your Docker volume, not a tunnel into your PC).

```
Your PC (for data updates)          GitHub Actions              Cloudflare
──────────────────────────          ──────────────              ──────────
collector → sanitize-snapshot
  → public/data/snapshot.json
  → git push  ─────────────────────►  build static Next.js
                                      wrangler pages deploy  ──►  Pages
                                                                Access allowlist
```

## One-time setup

### 1. Cloudflare account + Pages project name

Use project name **`kottaiworld`** (matches the GitHub Action).  
First successful Action deploy can create it; or create an empty Pages project with that name.

### 2. GitHub Actions secrets

Create an API token: [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)  
(Use a token that can edit Cloudflare Workers / Pages.)

GitHub repo → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | API token |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID (Cloudflare dashboard sidebar) |

Yes — **GitHub Actions deploys the app** on every push to `main` (and via **Run workflow**).

### 3. Access allowlist (email login)

Zero Trust → **Access** → **Applications** → **Self-hosted**:

- Domain: `kottaiworld.pages.dev` (or your custom domain)
- Policy **Allow** → **Emails** → add your 4–5 friends (+ you)

Do this before sharing the link.

### 4. Ship the code

Merge this branch to **`main`**, or run **Actions → Deploy Cloudflare Pages → Run workflow** after secrets are set.

Workflow: [`.github/workflows/deploy-cloudflare-pages.yml`](../.github/workflows/deploy-cloudflare-pages.yml)

## Publishing world data from your PC

```powershell
cd C:\dragonwilds\kottaiworld
git checkout main
git pull
docker compose up -d

powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\publish-sanitized-snapshot.ps1
```

That:

1. Reads live collector `http://127.0.0.1:4100/api/snapshot`  
2. Strips paths / diagnostics / internal keys  
3. Writes `apps/web/public/data/snapshot.json`  
4. Commits + pushes → Actions redeploys Pages  

Schedule it weekly (Task Scheduler) if you want hands-off updates.

### What is stripped

- Filesystem paths, mount diagnostics, raw collector errors  
- Cluster internals (`cellKeys`, full bbox)  
- Full blueprint GUIDs (shortened)  
- Never `.sav`, never `.env` / join code / admin password  

Kept: pieces, bases + map positions, uptime ticks, save file names/sizes, future nickname pins.

## Local Docker (unchanged)

```powershell
docker compose up --build -d
```

→ http://localhost:3000 with live `/api/snapshot`.  
Cloudflare build uses static `/data/snapshot.json` only.

## Cost

- Pages + Access free tier: fine for 4–5 friends  
- Optional custom domain ~$10/year  
- No VPS, no always-on tunnel into your LAN  

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Action auth error | Check `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` |
| Old / empty data | Run `publish-sanitized-snapshot.ps1` on `main` |
| Friends blocked | Add email to Access allow policy |
| `pages.dev` works, custom domain doesn’t | Attach domain in Pages → Custom domains + Access app domain |

## Other options

- [Tailscale Serve](./TAILSCALE.md) — private VPN app on phones  
- Live Docker tunnel — more exposure; PC must stay on (not recommended now that Pages is set up)

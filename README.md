# Kottaiworld

Local dashboard for the **KottaiServer** / **KottaiWorld** RuneScape: Dragonwilds dedicated server.

## Phase A (current)

Read-only observer:

- Mounts your existing Docker volume `dragonwilds_dragonwilds-data` as **read-only**
- Copies `.sav` files out, parses building pieces (`Pces`), clusters bases
- Serves a hearth-style dashboard at http://localhost:3000

**Does not** modify the game container, rename saves, or write to the game volume.

See [docs/PHASE_A.md](docs/PHASE_A.md) for Windows run steps.

### Share with friends (Cloudflare Pages + Access)

Deployed static build via **GitHub Actions** → Cloudflare Pages.  
Friends open **https://kottai.mayo-tutors.com** → **email login** → dashboard.  
(`mayo-tutors.com` tutors site stays separate.)  
Your PC only pushes a **sanitized** `snapshot.json` when you want updates.

See [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md).

## Quick start (Docker, next to your game host)

```powershell
copy .env.example .env
docker compose up --build -d
```

## Monorepo

| Package | Role |
|---------|------|
| `apps/web` | Next.js dashboard (BFF → collector) |
| `apps/collector` | Copy-on-read save scanner + HTTP API |
| `packages/sav-parser` | `.sav` INFO + `Pces` parser + base clustering |

## Dev without Docker (optional)

```bash
pnpm install
pnpm --filter @kottaiworld/sav-parser build
# Point RSDW_DATA_ROOT at a folder that contains RSDragonwilds/Saved/SaveGames
RSDW_DATA_ROOT=/path/to/copy pnpm --filter @kottaiworld/collector dev
COLLECTOR_URL=http://127.0.0.1:4100 pnpm --filter @kottaiworld/web dev
```

## Later

- **Phase B** — RSDWServerAPI for live players / positions
- Nickname pins on the published map (`players` in sanitized snapshot)

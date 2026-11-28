# Phase A — Local holdings observer

Phase A reads your Dragonwilds world **without changing the game container**.

## Safety guarantees

- Game volume `dragonwilds_dragonwilds-data` is mounted **`:ro`**
- Collector **copies** `KottaiWorld.sav` into its own work dir, then parses the copy
- Nothing writes back to `/home/steam/rsdw-dedicated`
- No `LD_PRELOAD`, no RSDWServerAPI yet (that is Phase B)

## Prerequisites (Windows)

1. Fresh backup of `dragonwilds_dragonwilds-data` (you already have ~1.6G)
2. Game container running or stopped — either is fine for Phase A
3. Docker Desktop + this repo cloned next to (or anywhere near) `C:\dragonwilds`

Confirm the volume name:

```powershell
docker inspect dragonwilds --format "{{range .Mounts}}{{.Name}} -> {{.Destination}}{{println}}{{end}}"
```

Expect: `dragonwilds_dragonwilds-data -> /home/steam/rsdw-dedicated`

If the name differs, edit `docker-compose.yml` → `volumes.dragonwilds_data.name`.

## Start the dashboard

From the repo root:

```powershell
copy .env.example .env
docker compose up --build -d
```

Open:

- Dashboard: http://localhost:3000
- Collector API: http://localhost:4100/api/snapshot
- Health: http://localhost:4100/health

### Share with your players

**Recommended:** [Cloudflare Pages + Access + GitHub Actions](./CLOUDFLARE.md) — deployed sanitized copy, email login on phones.

Local Docker remains for live observing and for generating the published snapshot.

## What you should see

- **KottaiServer** hero branding
- Piece count + bases clustered from `Pces` in the save
- Holdings map pins
- List of `.sav` files (`KottaiWorld.sav`, `FriendsWorld.sav`, …)

## If status is Degraded / no saves

```powershell
curl http://localhost:4100/api/snapshot
docker exec kottai-collector ls -la /data/rsdw
docker exec kottai-collector find /data/rsdw -iname "*.sav"
docker inspect kottai-collector --format "{{json .Mounts}}"
```

Confirm the collector mount name is `dragonwilds_dragonwilds-data` (same as the game).

## Tuning

In `.env` / compose env:

| Variable | Default | Meaning |
|----------|---------|---------|
| `PRIMARY_WORLD` | `KottaiWorld` | Which `.sav` to analyze |
| `BASE_MIN_PIECES` | `25` | Min pieces for a “base” |
| `BASE_CELL_CM` | `5000` | Cluster grid (50m) |
| `COLLECT_INTERVAL_SEC` | `120` | Copy+parse interval |

## Stop

```powershell
docker compose down
```

This does **not** stop or remove `dragonwilds`. It never deletes the game volume.

## Rollback / if something looks wrong

1. `docker compose down` in this repo
2. Confirm game still runs: `docker compose -f C:\dragonwilds\docker-compose.yml ps`
3. Your backup tarball remains the restore point

## Phase B (later)

Live players + map dots require **RSDWServerAPI** inside the game process. Do another backup before that change.

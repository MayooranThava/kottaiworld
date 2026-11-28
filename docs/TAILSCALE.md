# Share the dashboard with friends (Tailscale)

For 4–5 players, **Tailscale** is the best low-cost option: the site stays on your PC, never on the public internet, and only people on your private Tailscale network can open it.

```
Your Windows PC (Docker Desktop)
  localhost:3000  →  Tailscale Serve (HTTPS on your tailnet)
                         ↓
              Friends on Tailscale open the link
```

No Cloudflare, no VPS, no public URL.

## 1. On your PC (host)

1. Install [Tailscale](https://tailscale.com/download) and sign in.
2. Keep the Kottai dashboard running:

```powershell
cd C:\dragonwilds\kottaiworld   # or your clone path
docker compose up -d
```

Confirm locally first: http://localhost:3000

3. Expose port 3000 **only to your Tailscale network** (not the whole internet):

```powershell
# Run in an elevated PowerShell if Serve asks for it
tailscale serve --bg 3000
tailscale serve status
```

Tailscale prints a private HTTPS URL, something like:

`https://your-pc-name.your-tailnet.ts.net`

That is the link you give friends.

### Optional helper

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\dragonwilds\kottaiworld\scripts\tailscale-serve-dashboard.ps1
```

### Stop sharing later

```powershell
tailscale serve reset
```

## 2. Invite your 4–5 players

1. Open the [Tailscale admin console](https://login.tailscale.com/admin/users).
2. **Invite users** (their email) — do **not** share your personal Tailscale password.
3. Each friend installs Tailscale, accepts the invite, and stays connected when they want the dashboard.
4. Send them the Serve URL from `tailscale serve status`.

Free personal plan is enough for a small friend group.

## 3. Security checklist

| Do | Don't |
|----|--------|
| Use **Serve** (tailnet only) | Use **Funnel** (that is public internet) |
| Invite each friend as their own user | Share one login / auth key casually |
| Keep game volume `:ro`; dashboard is already a copy-on-read observer | Open Docker ports `3000`/`4100` on your home router |
| Keep admin password / join code in `C:\dragonwilds\.env` only | Put secrets on the dashboard or in git |

Optional hardening in the admin console → **Access controls**:

- Only tagged users (e.g. `group:kottai`) can reach your machine’s Serve port.
- See [Tailscale ACLs](https://tailscale.com/kb/1018/acls).

## 4. What friends will see

Whatever the local dashboard shows (map, bases, uptime, materials).  
This is **not** a separate cloud copy — if your PC or Docker is off, the link will not load.

## 5. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Friend gets connection timeout | They must be logged into Tailscale and on **your** tailnet |
| Works on localhost, not via Tailscale | Re-run `tailscale serve --bg 3000` and check `tailscale serve status` |
| Docker not running | `docker compose up -d` in the kottaiworld folder |
| Wrong machine name in URL | `tailscale status` on the host; use that MagicDNS name |

## Later (optional)

Weekly sanitized nicknames / static export can still land later. Tailscale sharing works with the dashboard you already have today — no cloud host required.

# Share the dashboard with friends (Cloudflare Access)

Goal: friends open a normal link on phone or PC → **email login** → see the dashboard.  
No Tailscale app. No public unauthenticated site.

```
Friend phone/browser
  → https://kottai.yourdomain.com
  → Cloudflare Access (email allowlist / one-time PIN)
  → Cloudflare Tunnel
  → your PC localhost:3000  (live Docker dashboard)
```

Your game volume stays on the PC. Cloudflare only proxies the **already-safe** web UI.

## What you need

1. Free [Cloudflare](https://dash.cloudflare.com) account  
2. A domain on Cloudflare (cheap `.com`/`.xyz` is fine — Access needs a hostname)  
3. Dashboard running locally: http://localhost:3000  
4. [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) on Windows  

Free Zero Trust / Access is enough for ~4–5 friends.

## 1. Start the local dashboard

```powershell
cd C:\dragonwilds\kottaiworld
git pull
docker compose up -d
```

Confirm: http://localhost:3000

## 2. Create a Cloudflare Tunnel

In [Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels** → **Create a tunnel**:

1. Name it `kottai-dashboard`
2. Choose **Cloudflared** → Windows  
3. Copy the install/token command Cloudflare shows (includes a long token)  
4. Run that command on your PC (installs the tunnel as a Windows service — survives reboot)

Or manually:

```powershell
winget install --id Cloudflare.cloudflared -e
cloudflared tunnel login
cloudflared tunnel create kottai-dashboard
```

Point the tunnel at the dashboard:

```powershell
cloudflared tunnel route dns kottai-dashboard kottai.YOURDOMAIN.com
```

Create config `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: kottai-dashboard
credentials-file: C:\Users\YOU\.cloudflared\TUNNEL_ID.json

ingress:
  - hostname: kottai.YOURDOMAIN.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

Run / install service:

```powershell
cloudflared tunnel run kottai-dashboard
# or install as service (recommended):
cloudflared service install
```

Helper (after config exists):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\dragonwilds\kottaiworld\scripts\cloudflare-tunnel-dashboard.ps1
```

## 3. Lock it with Access (the email login)

Zero Trust → **Access** → **Applications** → **Add an application** → **Self-hosted**:

| Field | Value |
|-------|--------|
| Application name | KottaiWorld Dashboard |
| Session duration | 24 hours (or whatever you like) |
| Application domain | `kottai.YOURDOMAIN.com` |

**Policy** (Allow):

- Include → **Emails** → add your 4–5 friends’ emails (and yours)  
  **or** Include → **Email domain** if you all share one (usually don’t)

Save.  

Now anyone hitting the URL gets Cloudflare’s login page (one-time PIN to email, or IdP if you configure one). Only allowlisted emails get through.

## 4. What to send friends

```
https://kottai.YOURDOMAIN.com
```

They:
1. Open the link (phone or PC)  
2. Enter email → get a PIN  
3. Done — dashboard loads  

No VPN app.

## 5. Security checklist

| Do | Don't |
|----|--------|
| Access allowlist of known emails only | Leave the tunnel hostname without Access |
| Tunnel to `127.0.0.1:3000` only | Port-forward 3000/4100 on your router |
| Keep game `.env` / join code off the dashboard | Put admin password in the web UI |
| Prefer Serve/Tunnel over Funnel-style public | Use a temporary `trycloudflare.com` URL for friends long-term |

Optional: do **not** expose collector `:4100` through the tunnel — only the web UI on `:3000`.

## 6. Cost / uptime reality

- Cloudflare Tunnel + Access free tier: fine for this  
- Domain: ~$10/year if you don’t already have one  
- If your **PC or Docker is off**, the site won’t load (same as Tailscale)  

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| 502 / bad gateway | Dashboard not on localhost:3000 — `docker compose up -d` |
| Endless Access login | Email not on the allow policy |
| Works for you, not friends | They must use an allowlisted email; check spam for PIN |
| Tunnel offline after reboot | Install cloudflared as a Windows service |

## Tailscale vs Cloudflare (why this choice)

| | Tailscale | Cloudflare Access + Tunnel |
|--|-----------|----------------------------|
| Phone | Needs Tailscale app | Normal browser link |
| Login | VPN join | Email PIN |
| Cost | Free | Free + domain |

You asked for “hit a link → login → done,” so Cloudflare is the better fit.

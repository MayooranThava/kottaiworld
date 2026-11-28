# Check local dashboard and show Cloudflare tunnel status.
# Full setup steps: docs/CLOUDFLARE.md
# This does NOT create the tunnel for you (needs your Cloudflare account + domain).

$ErrorActionPreference = "Stop"

Write-Host "Checking localhost:3000 ..."
try {
  $null = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 5
  Write-Host "OK - dashboard is up"
} catch {
  Write-Host "Dashboard not reachable on http://127.0.0.1:3000"
  Write-Host "Start it:  cd C:\dragonwilds\kottaiworld ; docker compose up -d"
  exit 1
}

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
  Write-Host ""
  Write-Host "cloudflared not found. Install:"
  Write-Host "  winget install --id Cloudflare.cloudflared -e"
  Write-Host "Then follow docs/CLOUDFLARE.md (tunnel + Access email allowlist)."
  exit 1
}

Write-Host ""
Write-Host "cloudflared version:"
cloudflared --version
Write-Host ""
Write-Host "If the tunnel is installed as a service, check Zero Trust > Tunnels is Healthy."
Write-Host "Friends open your Access-protected URL (email PIN login)."
Write-Host "See docs/CLOUDFLARE.md"

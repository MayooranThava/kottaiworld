# Expose the local Kottai dashboard to your Tailscale network only.
# Does NOT use Funnel (public internet).
# Requires: Tailscale installed, docker compose web on localhost:3000

$ErrorActionPreference = "Stop"

Write-Host "Checking localhost:3000 ..."
try {
  $null = Invoke-WebRequest -Uri "http://127.0.0.1:3000" -UseBasicParsing -TimeoutSec 5
} catch {
  Write-Host "Dashboard not reachable on http://127.0.0.1:3000"
  Write-Host "Start it first:  cd C:\dragonwilds\kottaiworld ; docker compose up -d"
  exit 1
}

Write-Host "Starting Tailscale Serve on port 3000 (tailnet only) ..."
tailscale serve --bg 3000
Write-Host ""
Write-Host "Status:"
tailscale serve status
Write-Host ""
Write-Host "Give friends the https://....ts.net URL above."
Write-Host "They must be on your Tailscale network."
Write-Host "To stop sharing:  tailscale serve reset"

# Export a sanitized snapshot from the local collector and push it so
# GitHub Actions can redeploy Cloudflare Pages.
# Prerequisites: docker compose up (collector on :4100), git remotes configured,
# non-interactive git auth (Git Credential Manager) for scheduled runs.
#
# Manual:  .\scripts\publish-sanitized-snapshot.ps1
# Every 4h: .\scripts\register-snapshot-schedule.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $RepoRoot "apps\web"))) {
  $RepoRoot = "C:\dragonwilds\kottaiworld"
}

$LogDir = Join-Path $RepoRoot "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log = Join-Path $LogDir "publish-snapshot.log"

function Write-Log([string]$Message) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $Log -Value $line
  Write-Host $line
}

Set-Location $RepoRoot
$Out = Join-Path $RepoRoot "apps\web\public\data\snapshot.json"
$Tmp = Join-Path $env:TEMP "kottai-raw-snapshot.json"

Write-Log "Starting publish from $RepoRoot"

git fetch origin main 2>&1 | ForEach-Object { Write-Log $_ }
git checkout main 2>&1 | ForEach-Object { Write-Log $_ }
git pull --ff-only origin main 2>&1 | ForEach-Object { Write-Log $_ }

Write-Log "Fetching collector snapshot ..."
try {
  Invoke-WebRequest -Uri "http://127.0.0.1:4100/api/snapshot" -OutFile $Tmp -UseBasicParsing -TimeoutSec 60
} catch {
  Write-Log "Collector not reachable. Start it: docker compose up -d"
  exit 1
}

Write-Log "Sanitizing ..."
node (Join-Path $RepoRoot "scripts\sanitize-snapshot.mjs") $Tmp $Out

git add -- "apps/web/public/data/snapshot.json"
$status = git status --porcelain -- "apps/web/public/data/snapshot.json"
if (-not $status) {
  Write-Log "No snapshot changes to publish."
  exit 0
}

git commit -m "Publish sanitized KottaiWorld snapshot" 2>&1 | ForEach-Object { Write-Log $_ }
git push origin main 2>&1 | ForEach-Object { Write-Log $_ }
Write-Log "Pushed. GitHub Actions will deploy Cloudflare Pages."

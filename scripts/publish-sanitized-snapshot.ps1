# Export a sanitized snapshot from the local collector and push it so
# GitHub Actions can redeploy Cloudflare Pages.
# Prerequisites: docker compose up (collector on :4100), git remotes configured.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $RepoRoot "apps\web"))) {
  $RepoRoot = "C:\dragonwilds\kottaiworld"
}

Set-Location $RepoRoot
$Out = Join-Path $RepoRoot "apps\web\public\data\snapshot.json"
$Tmp = Join-Path $env:TEMP "kottai-raw-snapshot.json"

Write-Host "Fetching collector snapshot ..."
try {
  Invoke-WebRequest -Uri "http://127.0.0.1:4100/api/snapshot" -OutFile $Tmp -UseBasicParsing -TimeoutSec 30
} catch {
  Write-Host "Collector not reachable. Start it: docker compose up -d"
  exit 1
}

Write-Host "Sanitizing ..."
node (Join-Path $RepoRoot "scripts\sanitize-snapshot.mjs") $Tmp $Out

Write-Host "Committing published snapshot ..."
git add -- "apps/web/public/data/snapshot.json"
$status = git status --porcelain -- "apps/web/public/data/snapshot.json"
if (-not $status) {
  Write-Host "No snapshot changes to publish."
  exit 0
}

git commit -m "Publish sanitized KottaiWorld snapshot"
git push

Write-Host "Pushed. GitHub Actions will deploy Cloudflare Pages (on main)."
Write-Host "If you are on a feature branch, merge to main or run the workflow manually."

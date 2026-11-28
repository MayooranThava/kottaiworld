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

# git writes progress to stderr; with $ErrorActionPreference=Stop that becomes a terminating error
function Invoke-Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $output = & git @GitArgs 2>&1
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prev
  foreach ($line in $output) {
    Write-Log ("{0}" -f $line)
  }
  if ($code -ne 0) {
    throw "git $($GitArgs -join ' ') failed with exit code $code"
  }
}

Set-Location $RepoRoot
$Out = Join-Path $RepoRoot "apps\web\public\data\snapshot.json"
$Tmp = Join-Path $env:TEMP "kottai-raw-snapshot.json"

Write-Log "Starting publish from $RepoRoot"

Invoke-Git fetch origin main
Invoke-Git checkout main
Invoke-Git pull --ff-only origin main

Write-Log "Fetching collector snapshot ..."
try {
  Invoke-WebRequest -Uri "http://127.0.0.1:4100/api/snapshot" -OutFile $Tmp -UseBasicParsing -TimeoutSec 60
} catch {
  Write-Log "Collector not reachable. Start it: docker compose up -d"
  exit 1
}

Write-Log "Sanitizing ..."
node (Join-Path $RepoRoot "scripts\sanitize-snapshot.mjs") $Tmp $Out

Invoke-Git add -- "apps/web/public/data/snapshot.json"
$prev = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$status = & git status --porcelain -- "apps/web/public/data/snapshot.json" 2>&1
$ErrorActionPreference = $prev
if (-not $status) {
  Write-Log "No snapshot changes to publish."
  exit 0
}

Invoke-Git commit -m "Publish sanitized KottaiWorld snapshot"
Invoke-Git push origin main
Write-Log "Pushed. GitHub Actions will deploy Cloudflare Pages."

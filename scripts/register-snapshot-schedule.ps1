# Registers a Windows Scheduled Task that publishes a sanitized snapshot
# every 4 hours (PC must be on; Docker collector must be reachable).
#
# Run once in an elevated PowerShell (right-click → Run as administrator):
#   cd C:\dragonwilds\kottaiworld
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\register-snapshot-schedule.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $RepoRoot "scripts\publish-sanitized-snapshot.ps1"))) {
  $RepoRoot = "C:\dragonwilds\kottaiworld"
}

$PublishScript = Join-Path $RepoRoot "scripts\publish-sanitized-snapshot.ps1"
if (-not (Test-Path $PublishScript)) {
  throw "Missing $PublishScript"
}

$TaskName = "KottaiWorld Publish Snapshot"
$Arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PublishScript`""

$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $Arg -WorkingDirectory $RepoRoot
# Every 4 hours, indefinitely
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddHours([math]::Ceiling((Get-Date).Hour / 4) * 4) -RepetitionInterval (New-TimeSpan -Hours 4) -RepetitionDuration ([TimeSpan]::MaxValue)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force | Out-Null

Write-Host "Registered task: $TaskName"
Write-Host "Runs every 4 hours when this Windows user is logged on."
Write-Host "Manual test:"
Write-Host "  powershell -NoProfile -ExecutionPolicy Bypass -File `"$PublishScript`""
Write-Host "Or: Task Scheduler → $TaskName → Run"
Write-Host "Log: $(Join-Path $RepoRoot 'logs\publish-snapshot.log')"

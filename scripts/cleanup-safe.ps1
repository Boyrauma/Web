param(
  [switch]$ReportOnly,
  [switch]$IncludeBuildOutputs
)

$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
Set-Location $workspaceRoot

$protectedRoots = @(
  (Join-Path $workspaceRoot ".git"),
  (Join-Path $workspaceRoot "DockerDesktopWSL"),
  (Join-Path $workspaceRoot "Image"),
  (Join-Path $workspaceRoot "apps\\backend\\uploads")
)

function Test-ProtectedPath {
  param([string]$Path)

  $normalizedPath = [System.IO.Path]::GetFullPath($Path)

  foreach ($protectedRoot in $protectedRoots) {
    $normalizedRoot = [System.IO.Path]::GetFullPath($protectedRoot)
    if ($normalizedPath.StartsWith($normalizedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }

  return $false
}

function Get-SafeFileTargets {
  $files = @()

  $files += Get-ChildItem -Path (Join-Path $workspaceRoot ".git\\objects") -Recurse -Force -File -Filter "tmp_obj_*" -ErrorAction SilentlyContinue
  $files += Get-ChildItem -Path $workspaceRoot -Recurse -Force -File -Include "*.pyc","*.pyo",".DS_Store","Thumbs.db","desktop.ini","*.tmp","*.temp","*.log" -ErrorAction SilentlyContinue |
    Where-Object { -not (Test-ProtectedPath $_.FullName) }

  return $files | Sort-Object FullName -Unique
}

function Get-SafeDirectoryTargets {
  $targetNames = @("__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache")
  if ($IncludeBuildOutputs) {
    $targetNames += @("dist", ".vite", "coverage", ".turbo")
  }

  return Get-ChildItem -Path $workspaceRoot -Recurse -Force -Directory -ErrorAction SilentlyContinue |
    Where-Object {
      $_.Name -in $targetNames -and -not (Test-ProtectedPath $_.FullName)
    } |
    Sort-Object FullName -Unique
}

function Measure-Targets {
  param([System.Collections.IEnumerable]$Targets)

  $count = 0
  $totalBytes = 0

  foreach ($target in $Targets) {
    $count += 1

    if ($target.PSIsContainer) {
      $size = (Get-ChildItem -LiteralPath $target.FullName -Recurse -Force -File -ErrorAction SilentlyContinue |
        Measure-Object -Property Length -Sum).Sum
      $totalBytes += ($size | ForEach-Object { $_ })
    } else {
      $totalBytes += $target.Length
    }
  }

  return [PSCustomObject]@{
    Count = $count
    SizeMB = [math]::Round($totalBytes / 1MB, 2)
  }
}

$fileTargets = @(Get-SafeFileTargets)
$directoryTargets = @(Get-SafeDirectoryTargets)
$allTargets = @($fileTargets + $directoryTargets)
$summary = Measure-Targets -Targets $allTargets

Write-Host "Workspace: $workspaceRoot"
Write-Host "Targets: $($summary.Count)"
Write-Host "Estimated size: $($summary.SizeMB) MB"
Write-Host "Mode: $(if ($ReportOnly) { 'report-only' } else { 'cleanup' })"
Write-Host "Include build outputs: $IncludeBuildOutputs"

if (-not $summary.Count) {
  Write-Host "No safe cleanup targets found."
  exit 0
}

foreach ($target in $allTargets) {
  Write-Host $target.FullName
}

if ($ReportOnly) {
  exit 0
}

foreach ($file in $fileTargets) {
  Remove-Item -LiteralPath $file.FullName -Force -ErrorAction SilentlyContinue
}

foreach ($directory in $directoryTargets | Sort-Object FullName -Descending) {
  Remove-Item -LiteralPath $directory.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Cleanup completed."

param(
  [string]$SourceDir,
  [string]$DestinationDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path

if ([string]::IsNullOrWhiteSpace($SourceDir)) {
  $SourceDir = Join-Path $repoRoot "server\data"
}

if ([string]::IsNullOrWhiteSpace($DestinationDir)) {
  $DestinationDir = Join-Path $repoRoot "data"
}

$SourceDir = [System.IO.Path]::GetFullPath($SourceDir)
$DestinationDir = [System.IO.Path]::GetFullPath($DestinationDir)

Write-Host "Source      : $SourceDir"
Write-Host "Destination : $DestinationDir"

if (-not (Test-Path -LiteralPath $SourceDir -PathType Container)) {
  Write-Host "Source folder does not exist. Nothing to copy."
  exit 0
}

if (-not (Test-Path -LiteralPath $DestinationDir -PathType Container)) {
  New-Item -ItemType Directory -Path $DestinationDir -Force | Out-Null
}

$sourcePrefix = $SourceDir.TrimEnd("\", "/")
$copiedCount = 0
$skippedCount = 0
$conflicts = [System.Collections.Generic.List[string]]::new()

$files = Get-ChildItem -LiteralPath $SourceDir -Recurse -File

foreach ($file in $files) {
  $relativePath = $file.FullName.Substring($sourcePrefix.Length).TrimStart("\", "/")
  $targetPath = Join-Path $DestinationDir $relativePath
  $targetParent = Split-Path -Parent $targetPath

  if (-not (Test-Path -LiteralPath $targetParent -PathType Container)) {
    New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
  }

  if (Test-Path -LiteralPath $targetPath -PathType Leaf) {
    $skippedCount += 1
    $conflicts.Add($relativePath) | Out-Null
    continue
  }

  Copy-Item -LiteralPath $file.FullName -Destination $targetPath
  $copiedCount += 1
}

Write-Host ""
Write-Host "Copy completed."
Write-Host "Copied files : $copiedCount"
Write-Host "Skipped files: $skippedCount"

if ($conflicts.Count -gt 0) {
  Write-Host ""
  Write-Host "Conflicts (existing target files were not overwritten):"
  foreach ($relative in $conflicts) {
    Write-Host " - $relative"
  }
}

Write-Host ""
Write-Host "Original files in source were not modified or deleted."


param(
  [string]$OutputRoot = "snapshot"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutputRoot)) {
  New-Item -Path $OutputRoot -ItemType Directory | Out-Null
}

$commit = (git rev-parse --short HEAD).Trim()
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$runDirName = "${commit}_${timestamp}"
$runDir = Join-Path $OutputRoot $runDirName
New-Item -Path $runDir -ItemType Directory | Out-Null

$include = @(
  'index.html',
  'privacy.html',
  'terms.html',
  'security.html',
  'accessibility.html',
  '404.html',
  'tsi_internal.html',
  'site.webmanifest',
  'sitemap.xml',
  'robots.txt',
  'CNAME',
  'css',
  'js',
  'assets'
)

foreach ($item in $include) {
  if (Test-Path $item) {
    Copy-Item -Path $item -Destination $runDir -Recurse -Force
  }
}

$metaPath = Join-Path $runDir 'snapshot-meta.txt'
@(
  "created_at_local=$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz'))",
  "source_commit=$commit",
  "branch=$((git rev-parse --abbrev-ref HEAD).Trim())"
) | Set-Content -Path $metaPath -Encoding UTF8

$zipPath = Join-Path $OutputRoot ("{0}.zip" -f $runDirName)
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $runDir '*') -DestinationPath $zipPath -CompressionLevel Optimal

Write-Output "SNAPSHOT_DIR=$runDir"
Write-Output "SNAPSHOT_ZIP=$zipPath"

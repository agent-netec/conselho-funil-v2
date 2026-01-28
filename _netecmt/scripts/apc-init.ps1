# NETECMT APC Initialization Script
# Usage: ./apc-init.ps1

Write-Host "🚀 Initializing APC System Imunológico..." -ForegroundColor Cyan

$directories = @(
    "_netecmt/contracts",
    "_netecmt/packs/stories",
    "_netecmt/templates/story-pack",
    "_netecmt/requests",
    "_netecmt/reports",
    "_netecmt/core",
    "_netecmt/docs"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created: $dir"
    } else {
        Write-Host "ℹ️ Exists: $dir"
    }
}

# Create default contract-map if missing
$mapPath = "_netecmt/core/contract-map.yaml"
if (-not (Test-Path $mapPath)) {
    $mapContent = @"
lanes:
  core:
    paths: ["_netecmt/core/**"]
    contract: "_netecmt/contracts/core.md"
  infrastructure:
    paths: [".github/workflows/**", ".agent/**", ".cursor/**"]
    contract: "_netecmt/contracts/infrastructure.md"
"@
    Set-Content -Path $mapPath -Value $mapContent
    Write-Host "📝 Created default contract-map.yaml"
}

Write-Host "✨ APC Initialization Complete! Ground control is ready." -ForegroundColor Green

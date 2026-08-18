#Requires -Version 5.1
<#
.SYNOPSIS
  Registers this Cursor plugin for local testing and seeds .ai/ in a consumer repo.

.DESCRIPTION
  The plugin source is always the folder that contains this script ($PSScriptRoot).
  If you are in another git repository, .ai/ is initialized there automatically.

.EXAMPLE
  cd C:\tools\ai-engineering-governance
  .\install.ps1

.EXAMPLE
  cd C:\repos\MiApp
  C:\tools\ai-engineering-governance\install.ps1

.EXAMPLE
  .\install.ps1 -Project C:\repos\MiApp
  .\install.ps1 -Uninstall
#>
[CmdletBinding()]
param(
  [string] $Project,
  [switch] $Copy,
  [switch] $Uninstall
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$PluginName = 'ai-engineering-governance'
$PluginRoot = $PSScriptRoot
$LocalPlugins = Join-Path $env:USERPROFILE '.cursor\plugins\local'
$InstallPath = Join-Path $LocalPlugins $PluginName
$Manifest = Join-Path $PluginRoot '.cursor-plugin\plugin.json'

function Write-Step([string] $Message) {
  Write-Host ">> $Message" -ForegroundColor Cyan
}

function Write-Ok([string] $Message) {
  Write-Host "OK  $Message" -ForegroundColor Green
}

function Write-WarnLine([string] $Message) {
  Write-Host "!!  $Message" -ForegroundColor Yellow
}

function Get-FullPath([string] $Path) {
  return [IO.Path]::GetFullPath($Path.TrimEnd('\', '/'))
}

function Test-SamePath([string] $Left, [string] $Right) {
  return (Get-FullPath $Left).ToLowerInvariant() -eq (Get-FullPath $Right).ToLowerInvariant()
}

function Test-ReparsePoint([string] $Path) {
  if (-not (Test-Path -LiteralPath $Path)) { return $false }
  $item = Get-Item -LiteralPath $Path -Force
  return [bool]($item.Attributes -band [IO.FileAttributes]::ReparsePoint)
}

function Test-GitRepo([string] $Path) {
  return (Test-Path -LiteralPath (Join-Path $Path '.git'))
}

function Remove-InstallLink {
  if (-not (Test-Path -LiteralPath $InstallPath)) { return }
  # Never Remove-Item -Recurse on a junction: it can wipe the real clone.
  if (Test-ReparsePoint $InstallPath) {
    cmd.exe /c "rmdir `"$InstallPath`"" | Out-Null
    return
  }
  Remove-Item -LiteralPath $InstallPath -Recurse -Force
}

function Assert-PluginRepo {
  if (-not (Test-Path -LiteralPath $Manifest)) {
    throw "Run this script from the plugin repo. Missing: $Manifest"
  }
}

function Assert-Prereqs {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) { throw 'Node.js is required (18+).' }

  $ver = (& node -p "process.versions.node").Trim()
  $major = [int]($ver.Split('.')[0])
  if ($major -lt 18) { throw "Node.js 18+ required. Found $ver." }
  Write-Ok "Node.js $ver"

  $git = Get-Command git -ErrorAction SilentlyContinue
  if (-not $git) { throw 'git is required in PATH.' }
  Write-Ok 'git found'
}

function Install-Plugin {
  Write-Step "Installing $PluginName into Cursor local plugins"
  New-Item -ItemType Directory -Force -Path $LocalPlugins | Out-Null
  Remove-InstallLink

  if ($Copy) {
    Copy-Item -LiteralPath $PluginRoot -Destination $InstallPath -Recurse -Force
    Write-Ok "Copied to $InstallPath"
    Write-WarnLine 'Copy mode: edits in the clone will not apply until you re-run install.ps1 -Copy'
    return
  }

  try {
    New-Item -ItemType Junction -Path $InstallPath -Target $PluginRoot | Out-Null
    Write-Ok "Junction: $InstallPath -> $PluginRoot"
  }
  catch {
    Write-WarnLine "Junction failed ($($_.Exception.Message)). Falling back to copy."
    Copy-Item -LiteralPath $PluginRoot -Destination $InstallPath -Recurse -Force
    Write-Ok "Copied to $InstallPath"
  }
}

function Install-Project([string] $Target) {
  $root = (Resolve-Path -LiteralPath $Target).Path
  $ai = Join-Path $root '.ai'
  $config = Join-Path $ai 'config.json'

  Write-Step "Seeding governance state in $root"
  New-Item -ItemType Directory -Force -Path $ai | Out-Null

  if (Test-Path -LiteralPath $config) {
    Write-Ok '.ai/config.json already exists (left untouched)'
    return
  }

  $default = @'
{
  "protectedBranches": ["main", "master", "develop", "qa"],
  "planRequiredFileThreshold": 2,
  "stageApprovalMode": "manual",
  "requirePlanApproval": true,
  "qaDeployCommand": null
}
'@
  Set-Content -LiteralPath $config -Value $default.Trim() -Encoding utf8
  Write-Ok "Created $config"
}

function Resolve-ConsumerProject {
  if ($Project) {
    if (-not (Test-Path -LiteralPath $Project)) {
      throw "Project path not found: $Project"
    }
    return (Resolve-Path -LiteralPath $Project).Path
  }

  $cwd = (Get-Location).Path
  if (Test-SamePath $cwd $PluginRoot) { return $null }
  if (-not (Test-GitRepo $cwd)) { return $null }
  return $cwd
}

Assert-PluginRepo

if ($Uninstall) {
  Write-Step 'Removing local Cursor plugin registration'
  Remove-InstallLink
  Write-Ok "Removed $InstallPath"
  Write-WarnLine 'This does not delete .ai/ in consumer repos nor the plugin clone.'
  return
}

Assert-Prereqs
Install-Plugin

$consumer = Resolve-ConsumerProject
if ($consumer) {
  Install-Project $consumer
}
else {
  Write-WarnLine 'No consumer repo detected. Plugin registered in Cursor only.'
  Write-Host "Seed a repo with: $PluginRoot\install.ps1"
  Write-Host 'Run it from that repository, or pass -Project <path>.'
}

Write-Host ''
Write-Host 'Next steps' -ForegroundColor Cyan
Write-Host '  1. In Cursor: Developer: Reload Window'
Write-Host '  2. Trust the workspace (hooks do not run otherwise)'
Write-Host '  3. Enable third-party plugins/skills if rules or commands do not appear'
Write-Host "  4. Check Customize / Plugins for $PluginName"
Write-Host ''
Write-Host 'Local plugins load for your user (all windows). Per-repo state lives in .ai/'

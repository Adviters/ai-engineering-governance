#Requires -Version 5.1
<#
.SYNOPSIS
  Registers this Cursor plugin for local testing and seeds .ai/ in a consumer repo.
#>
[CmdletBinding()]
param(
  [string] $Project,
  [switch] $Uninstall
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$PluginName = 'ai-engineering-governance'
$PluginRoot = $PSScriptRoot
$LocalPlugins = Join-Path $env:USERPROFILE '.cursor\plugins\local'
$InstallPath = Join-Path $LocalPlugins $PluginName
$Manifest = Join-Path $PluginRoot '.cursor-plugin\plugin.json'

function Write-Step([string] $Message) { Write-Host ">> $Message" -ForegroundColor Cyan }
function Write-Ok([string] $Message) { Write-Host "OK  $Message" -ForegroundColor Green }
function Write-WarnLine([string] $Message) { Write-Host "!!  $Message" -ForegroundColor Yellow }

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
  if ([int]($ver.Split('.')[0]) -lt 18) { throw "Node.js 18+ required. Found $ver." }
  Write-Ok "Node.js $ver"

  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'git is required in PATH.' }
  Write-Ok 'git found'

  if (-not (Get-Command robocopy -ErrorAction SilentlyContinue)) { throw 'robocopy is required.' }
  Write-Ok 'robocopy found'
}

function Copy-PluginFiles {
  & robocopy $PluginRoot $InstallPath /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
}

function Install-Plugin {
  Write-Step "Installing $PluginName into Cursor local plugins"
  New-Item -ItemType Directory -Force -Path $LocalPlugins | Out-Null

  if (Test-SamePath $PluginRoot $InstallPath) {
    Write-Ok "Plugin already lives at $InstallPath"
    return
  }

  Remove-InstallLink
  Copy-PluginFiles
  Write-Ok "Copied to $InstallPath"
  Write-WarnLine 'Copy install: re-run install.ps1 after you change the clone.'
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

  @"
{
  "protectedBranches": ["main", "master", "develop", "qa"],
  "planRequiredFileThreshold": 2,
  "stageApprovalMode": "manual",
  "requirePlanApproval": true,
  "qaDeployCommand": null
}
"@ | Set-Content -LiteralPath $config -Encoding utf8
  Write-Ok "Created $config"
}

function Resolve-ConsumerProject {
  if ($Project) {
    if (-not (Test-Path -LiteralPath $Project)) { throw "Project path not found: $Project" }
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
  return
}

Assert-Prereqs
Install-Plugin

$consumer = Resolve-ConsumerProject
if ($consumer) { Install-Project $consumer }
else {
  Write-WarnLine 'No consumer repo detected. Plugin registered in Cursor only.'
}

Write-Host ''
Write-Host 'Next: Developer: Reload Window, Trusted workspace, third-party plugins on.'
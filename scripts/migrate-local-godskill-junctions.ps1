param(
  [Parameter(Mandatory=$true)][ValidateSet('Archive','Restore')][string]$Mode,
  [Parameter(Mandatory=$true)][string]$SkillsDirectory,
  [Parameter(Mandatory=$true)][string]$LegacyRepositorySkills,
  [Parameter(Mandatory=$true)][string]$ArchiveDirectory
)
$ErrorActionPreference = 'Stop'
$ids = @('eternities-aegis','eternities-architect','eternities-forge','eternities-mnemosyne','eternities-muse','eternities-oracle','sovereign-skill-refinery')
$skillRoot = [IO.Path]::GetFullPath($SkillsDirectory).TrimEnd('\')
$legacyRoot = [IO.Path]::GetFullPath($LegacyRepositorySkills).TrimEnd('\')
$archiveRoot = [IO.Path]::GetFullPath($ArchiveDirectory).TrimEnd('\')
if ($skillRoot -eq $archiveRoot -or $archiveRoot.StartsWith($skillRoot + '\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Archive must be outside the skill root' }
$records = foreach ($id in $ids) {
  $installed = [IO.Path]::GetFullPath((Join-Path $skillRoot $id))
  $backup = [IO.Path]::GetFullPath((Join-Path $archiveRoot $id))
  $expectedTarget = [IO.Path]::GetFullPath((Join-Path $legacyRoot $id))
  if (!$installed.StartsWith($skillRoot + '\',[StringComparison]::OrdinalIgnoreCase) -or !$backup.StartsWith($archiveRoot + '\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Path escaped exact roots' }
  [pscustomobject]@{Id=$id;Installed=$installed;Backup=$backup;Target=$expectedTarget}
}
foreach ($record in $records) {
  $source = if ($Mode -eq 'Archive') { $record.Installed } else { $record.Backup }
  $destination = if ($Mode -eq 'Archive') { $record.Backup } else { $record.Installed }
  $item = Get-Item -LiteralPath $source -Force
  if ($item.LinkType -ne 'Junction') { throw "Not a junction: $source" }
  $actualTarget = [IO.Path]::GetFullPath(@($item.Target)[0]).TrimEnd('\')
  if (!$actualTarget.Equals($record.Target,[StringComparison]::OrdinalIgnoreCase)) { throw "Unexpected junction target: $source" }
  if (Test-Path -LiteralPath $destination) { throw "Destination already exists: $destination" }
}
if ($Mode -eq 'Archive') {
  if (Test-Path -LiteralPath $archiveRoot) { throw 'Archive already exists' }
  New-Item -ItemType Directory -Path $archiveRoot | Out-Null
  $records | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $archiveRoot 'junctions.json') -Encoding UTF8
}
foreach ($record in $records) {
  $source = if ($Mode -eq 'Archive') { $record.Installed } else { $record.Backup }
  $destination = if ($Mode -eq 'Archive') { $record.Backup } else { $record.Installed }
  # Same-volume native rename moves the reparse point itself, never its contents.
  Move-Item -LiteralPath $source -Destination $destination
  $moved = Get-Item -LiteralPath $destination -Force
  if ($moved.LinkType -ne 'Junction' -or !([IO.Path]::GetFullPath(@($moved.Target)[0]).TrimEnd('\')).Equals($record.Target,[StringComparison]::OrdinalIgnoreCase)) { throw 'Moved junction verification failed' }
}
[pscustomobject]@{Status=$Mode;Count=$records.Count;Archive=$archiveRoot} | ConvertTo-Json

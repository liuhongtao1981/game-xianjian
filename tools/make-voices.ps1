param([switch]$Force, [string[]]$Only)
$ErrorActionPreference = 'Stop'
# Version 2 uses fresh neural synthesis; the retained SAPI files are never overwritten.
$taskScript = Join-Path $PSScriptRoot 'make-voices-v2.py'
$taskArguments = @($taskScript)
if ($Force) { $taskArguments += '--force' }
if ($Only) { $taskArguments += '--only'; $taskArguments += $Only }
& python @taskArguments
if ($LASTEXITCODE -ne 0) { throw 'Neural voice generation failed. Install edge-tts==7.3.1 and ensure ffmpeg/ffprobe are on PATH.' }

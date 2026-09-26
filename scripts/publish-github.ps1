$ErrorActionPreference = 'Stop'
# Read the existing Git credential only in memory; never log or persist it.
$credentialLines = "protocol=https`nhost=github.com`n`n" | git credential fill
if ($LASTEXITCODE -ne 0) { throw 'GitHub credential lookup failed.' }
$credential = @{}
foreach ($line in $credentialLines) { if ($line -match '^([^=]+)=(.*)$') { $credential[$Matches[1]] = $Matches[2] } }
if (-not $credential.password) { throw 'No GitHub credential available.' }
$headers = @{Authorization = 'Bearer ' + $credential.password; Accept = 'application/vnd.github+json'; 'User-Agent' = 'Seaside-Shakedown-Publisher'; 'X-GitHub-Api-Version' = '2022-11-28'}
$repo = $null
try { $repo = Invoke-RestMethod -Uri 'https://api.github.com/repos/cravo/seaside-shakedown' -Headers $headers }
catch { if ([int]$_.Exception.Response.StatusCode -ne 404) { throw 'Could not inspect the target GitHub repository.' } }
if (-not $repo) {
  $body = @{name='seaside-shakedown';description='A little luck by the sea: a mobile fruit machine with holds, nudges and a hungry seagull. Fictional credits only.';private=$false;auto_init=$false} | ConvertTo-Json
  try { $repo = Invoke-RestMethod -Method Post -Uri 'https://api.github.com/user/repos' -Headers $headers -ContentType 'application/json' -Body $body }
  catch { throw 'Could not create the GitHub repository.' }
}
Write-Output ('Repository ready: ' + $repo.html_url)
$credential.Clear()
$headers.Clear()

# Starts the backend in a new process so the current terminal doesn't keep running it.
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Starting backend (uvicorn) from $scriptDir"
# Prefer running from the `algo-backend` subfolder where `app/` package lives
$backendDir = Join-Path $scriptDir 'algo-backend'
if (-not (Test-Path $backendDir)) {
	Write-Host "Could not find 'algo-backend' subfolder, falling back to $scriptDir"
	$backendDir = $scriptDir
} else {
	Write-Host "Using working directory: $backendDir"
}

Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8001" -WorkingDirectory $backendDir
Write-Host "Backend start requested (process started)." 
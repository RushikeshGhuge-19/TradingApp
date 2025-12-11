# Stops any running uvicorn processes started for the backend (searches command line)
$procs = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -match 'uvicorn' }
if (!$procs) { Write-Host "No uvicorn processes found."; exit 0 }
foreach ($p in $procs) {
    Write-Host "Stopping PID $($p.ProcessId) - $($p.CommandLine)"
    Stop-Process -Id $p.ProcessId -Force
}
Write-Host "Stopped uvicorn processes."
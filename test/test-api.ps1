# PowerShell API Test Script for Fitness Forecast
# Usage: .\test-api.ps1 -UserId "YOUR_USER_ID"

param(
    [Parameter(Mandatory=$true)]
    [string]$UserId,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3001"
)

Write-Host "🧪 Testing Fitness Forecast API" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "User ID: $UserId"
Write-Host "Base URL: $BaseUrl"
Write-Host ""

$url = "$BaseUrl/api/fitness/forecast?userId=$UserId"
Write-Host "📡 Calling API: GET $url" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method GET -ErrorAction Stop
    $statusCode = $response.StatusCode
    $body = $response.Content | ConvertFrom-Json
    
    Write-Host "Status: $statusCode" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ""
    
    # Pretty print JSON
    Write-Host "Response:" -ForegroundColor Cyan
    $body | ConvertTo-Json -Depth 10
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "📊 Summary:" -ForegroundColor Cyan
    
    if ($body.current) {
        Write-Host "  Current CTL: $($body.current.ctl)" -ForegroundColor White
        Write-Host "  Current ATL: $($body.current.atl)" -ForegroundColor White
        Write-Host "  Current TSB: $($body.current.tsb)" -ForegroundColor White
    }
    
    if ($body.stats) {
        Write-Host ""
        Write-Host "  Past Activities: $($body.stats.pastActivities)" -ForegroundColor White
        Write-Host "  Planned Sessions: $($body.stats.plannedSessions)" -ForegroundColor White
        Write-Host "  Forecast Days: $($body.stats.forecastDays)" -ForegroundColor White
    }
    
    if ($body.forecast -and $body.forecast.Count -gt 0) {
        Write-Host ""
        Write-Host "  First Forecast Day:" -ForegroundColor Yellow
        $first = $body.forecast[0]
        Write-Host "    Date: $($first.date)"
        Write-Host "    CTL: $($first.ctl)"
        Write-Host "    ATL: $($first.atl)"
        Write-Host "    TSB: $($first.tsb)"
        
        Write-Host ""
        Write-Host "  Last Forecast Day:" -ForegroundColor Yellow
        $last = $body.forecast[-1]
        Write-Host "    Date: $($last.date)"
        Write-Host "    CTL: $($last.ctl)"
        Write-Host "    ATL: $($last.atl)"
        Write-Host "    TSB: $($last.tsb)"
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Red
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Smoke Test - NETECMT Release Verification
# Verifica se as rotas criticas das Sprints 10-29 estao acessiveis em producao
#
# Uso: .\_netecmt\scripts\smoke-test.ps1 [-BaseUrl "https://seu-dominio.vercel.app"]

param(
    [string]$BaseUrl = "https://app-rho-flax-25.vercel.app"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " NETECMT Smoke Test - Sprints 10-29" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Lista de rotas criticas por Sprint
$routes = @(
    @{ Sprint = "S10"; Route = "/assets"; Description = "Assets Dashboard" },
    @{ Sprint = "S13"; Route = "/intelligence"; Description = "Intelligence Base" },
    @{ Sprint = "S17"; Route = "/social"; Description = "Social Command" },
    @{ Sprint = "S20"; Route = "/automation"; Description = "Automation Center" },
    @{ Sprint = "S21"; Route = "/intelligence/ltv"; Description = "LTV Dashboard" },
    @{ Sprint = "S22"; Route = "/intelligence/predictive"; Description = "ROI Forecaster" },
    @{ Sprint = "S25"; Route = "/intelligence/attribution"; Description = "Attribution" },
    @{ Sprint = "S26"; Route = "/intelligence/creative"; Description = "Creative Lab" },
    @{ Sprint = "S28"; Route = "/performance/cross-channel"; Description = "Cross-Channel" },
    @{ Sprint = "S29"; Route = "/intelligence/personalization"; Description = "Personalization" }
)

$passed = 0
$failed = 0
$results = @()

foreach ($item in $routes) {
    $url = "$BaseUrl$($item.Route)"
    $sprint = $item.Sprint
    $desc = $item.Description
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq 200 -or $statusCode -eq 308 -or $statusCode -eq 307) {
            Write-Host "[PASS] " -ForegroundColor Green -NoNewline
            Write-Host "$sprint - $desc ($($item.Route)) - Status: $statusCode"
            $passed++
            $results += @{ Sprint = $sprint; Route = $item.Route; Status = "PASS"; Code = $statusCode }
        } else {
            Write-Host "[FAIL] " -ForegroundColor Red -NoNewline
            Write-Host "$sprint - $desc ($($item.Route)) - Status: $statusCode"
            $failed++
            $results += @{ Sprint = $sprint; Route = $item.Route; Status = "FAIL"; Code = $statusCode }
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -match "404") {
            Write-Host "[FAIL] " -ForegroundColor Red -NoNewline
            Write-Host "$sprint - $desc ($($item.Route)) - Status: 404 NOT FOUND"
            $failed++
            $results += @{ Sprint = $sprint; Route = $item.Route; Status = "FAIL"; Code = 404 }
        }
        elseif ($errorMsg -match "401|403") {
            Write-Host "[AUTH] " -ForegroundColor Yellow -NoNewline
            Write-Host "$sprint - $desc ($($item.Route)) - Requires authentication"
            $passed++ # Auth redirect is expected for protected routes
            $results += @{ Sprint = $sprint; Route = $item.Route; Status = "AUTH"; Code = "Auth Required" }
        }
        else {
            Write-Host "[ERROR] " -ForegroundColor Red -NoNewline
            Write-Host "$sprint - $desc ($($item.Route)) - Error: $errorMsg"
            $failed++
            $results += @{ Sprint = $sprint; Route = $item.Route; Status = "ERROR"; Code = $errorMsg }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($failed -gt 0) {
    Write-Host "ATENCAO: Algumas rotas falharam!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possiveis causas:" -ForegroundColor Yellow
    Write-Host "  1. Root Directory nao configurado como 'app' na Vercel"
    Write-Host "  2. Build falhou ou nao incluiu as rotas"
    Write-Host "  3. Deploy ainda nao foi concluido"
    Write-Host ""
    Write-Host "Acoes recomendadas:" -ForegroundColor Yellow
    Write-Host "  1. Verificar Settings > General > Root Directory na Vercel"
    Write-Host "  2. Verificar logs do ultimo build na Vercel"
    Write-Host "  3. Executar 'npm run build' localmente em app/"
    Write-Host ""
    exit 1
} else {
    Write-Host "SUCESSO: Todas as rotas criticas estao acessiveis!" -ForegroundColor Green
    exit 0
}

# run_demo.ps1
# Use alternate ports (9080-9085, 4319, 9091) if another test is using defaults: $env:CODEPULSE_ALT_PORTS = "1"
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
$altPorts = [string]::Equals($env:CODEPULSE_ALT_PORTS, "1", [StringComparison]::OrdinalIgnoreCase)
if ($altPorts) {
    $gatewayPort = 9080; $authPort = 9081; $productPort = 9082; $orderPort = 9083; $paymentPort = 9084; $shippingPort = 9085
    Write-Host "[Demo] Using ALTERNATE ports (9080-9085) to avoid conflicts."
} else {
    $gatewayPort = 8080; $authPort = 8081; $productPort = 8082; $orderPort = 8083; $paymentPort = 8084; $shippingPort = 8085
}
Write-Host "[Demo] Starting Micro-Commerce Mesh (CodePulse)..."
Write-Host "Using JAVA_HOME: $env:JAVA_HOME"

# 1. Build Phase
$services = @("gateway", "auth", "product", "order", "payment", "shipping")
Write-Host "`n[1/4] Building 6 Microservices (Maven)..."
foreach ($svc in $services) {
    Write-Host "  -> Building $svc..."
    $path = "playground/repo-$svc"
    Push-Location $path
    
    cmd /c "mvn clean package -DskipTests > build.log 2>&1"
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "Build failed for $svc"
        Get-Content build.log | Write-Host
        Pop-Location; exit 1 
    }
    Remove-Item build.log -ErrorAction SilentlyContinue

    # Prepare Context
    $jar = Get-ChildItem "target/*.jar" -Exclude "*.original" | Select-Object -First 1
    Copy-Item $jar.FullName -Destination "app.jar" -Force
    
    Pop-Location
}

# 2. Docker Phase
Write-Host "`n[2/4] Orchestrating Infrastructure (Docker)..."
docker-compose down --remove-orphans
if ($altPorts) {
    docker-compose -f docker-compose.yml -f docker-compose.alt-ports.yml up -d --build
} else {
    docker-compose up -d --build
}
if ($LASTEXITCODE -ne 0) { Write-Error "Docker Start Failed"; exit 1 }

Write-Host "`n[2.1/4] Waiting 90s for services to start (Java is slow)..."
Start-Sleep -Seconds 90

Write-Host "Verifying mesh health (All services)..."
$endpoints = @(
    "http://localhost:$gatewayPort/health",
    "http://localhost:$authPort/health",
    "http://localhost:$productPort/health",
    "http://localhost:$orderPort/health",
    "http://localhost:$paymentPort/health",
    "http://localhost:$shippingPort/health"
)

$maxRetries = 15
$retryCount = 0
$allHealthy = $false

while (-not $allHealthy -and $retryCount -lt $maxRetries) {
    $allHealthy = $true
    foreach ($url in $endpoints) {
        try {
            $resp = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
            if ($resp.StatusCode -ne 200) { $allHealthy = $false }
        } catch {
            $allHealthy = $false
        }
    }
    
    if (-not $allHealthy) {
        $retryCount++
        Write-Host "  -> Mesh not ready yet ($retryCount/$maxRetries)..."
        Start-Sleep -Seconds 10
    }
}

if ($allHealthy) {
    Write-Host "  -> Full Mesh is UP and HEALTHY!" -ForegroundColor Green
} else {
    Write-Warning "Mesh not fully ready, but proceeding with traffic burst..."
}

# 3. Traffic Phase (Complex User Journey)
Write-Host "`n[3/4] Simulating Traffic Flow (Burst)..."

for ($i = 1; $i -le 10; $i++) { # Increased to 10 batches for more data
    Write-Host "  -> Request Batch $i/10..."
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$gatewayPort/api/order" -Method Post -Body '{"item":"Laptop"}' -ContentType "application/json"
        Write-Host "     Response: $response"
    } catch {
        Write-Host "     Warning: Batch $i failed (Chaos active or timeout)" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2
}

# B. Zombie Path (NEVER CALLED)
# Write-Host "  -> (Skipping) Auth.resetPassword to test Zombie Detection"

Write-Host "`n[4/4] Demo Complete. Traces captured in temp/traces/."
# docker-compose down --remove-orphans

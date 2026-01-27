# run_demo.ps1
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
Write-Host "[Demo] Starting Micro-Commerce Mesh (CodePulse V1.2)..."
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
docker-compose up -d --build
if ($LASTEXITCODE -ne 0) { Write-Error "Docker Start Failed"; exit 1 }

Write-Host "`n[2.1/4] Waiting 90s for services to start (Java is slow)..."
Start-Sleep -Seconds 90

Write-Host "Verifying mesh health (All services)..."
$endpoints = @(
    "http://localhost:8080/health", # gateway
    "http://localhost:8081/health", # auth
    "http://localhost:8082/health", # product
    "http://localhost:8083/health", # order
    "http://localhost:8084/health", # payment
    "http://localhost:8085/health"  # shipping
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
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/order" -Method Post -Body '{"item":"Laptop"}' -ContentType "application/json"
        Write-Host "     Response: $response"
    } catch {
        Write-Host "     Warning: Batch $i failed (Chaos active or timeout)" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2
}

# B. Zombie Path (NEVER CALLED)
# Write-Host "  -> (Skipping) Auth.resetPassword to test Zombie Detection"

Write-Host "`n[4/4] Demo Complete. [SUCCESS]"
Write-Host "Generating tech docs now?"
Read-Host "Press Enter to Stop Services..."
docker-compose down

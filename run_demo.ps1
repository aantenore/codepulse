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

Write-Host "`n[2.1/4] Waiting 60s for services to start..."
Start-Sleep -Seconds 60

Write-Host "Verifying service health..."
$maxRetries = 10
$retryCount = 0
$healthy = $false

while (-not $healthy -and $retryCount -lt $maxRetries) {
    try {
        $check = Invoke-WebRequest -Uri "http://localhost:8080/api/order" -Method Post -Body '{}' -ContentType "application/json" -ErrorAction SilentlyContinue
        if ($check.StatusCode -eq 200 -or $check.StatusCode -eq 500) {
            $healthy = $true
            Write-Host "  -> Gateway is UP!" -ForegroundColor Green
        }
    } catch {
        $retryCount++
        Write-Host "  -> Waiting for Gateway... ($retryCount/$maxRetries)"
        Start-Sleep -Seconds 5
    }
}

if (-not $healthy) {
    Write-Warning "Gateway not fully ready, but proceeding with traffic burst..."
}

# 3. Traffic Phase (Complex User Journey)
Write-Host "`n[3/4] Simulating Traffic Flow (Burst)..."

for ($i = 1; $i -le 5; $i++) {
    Write-Host "  -> Request Batch $i/5..."
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/order" -Method Post -Body '{"item":"Laptop"}' -ContentType "application/json"
        Write-Host "     Response: $response"
    } catch {
        Write-Host "     Warning: Batch $i failed (Chaos active)" -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 1
}

# B. Zombie Path (NEVER CALLED)
# Write-Host "  -> (Skipping) Auth.resetPassword to test Zombie Detection"

Write-Host "`n[4/4] Demo Complete. [SUCCESS]"
Write-Host "Generating tech docs now?"
Read-Host "Press Enter to Stop Services..."
docker-compose down

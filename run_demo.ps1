# run_demo.ps1
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21'
Write-Host "[Demo] Starting CodePulse V1.1.0 (Chaos Mode)..."
Write-Host "Using JAVA_HOME: $env:JAVA_HOME"

# 1. Build Phase
Write-Host "`n[1/4] Building Services (Maven)..."
$services = @("playground/repo-inventory-service", "playground/repo-payment-service", "playground/repo-order-service")

foreach ($svc in $services) {
    Write-Host "  -> Building $svc..."
    Push-Location $svc
    cmd /c "mvn clean package -DskipTests > build.log 2>&1"
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "Build failed for $svc"
        Get-Content build.log | Write-Host
        Pop-Location; exit 1 
    }
    Remove-Item build.log -ErrorAction SilentlyContinue
    
    # Copy JAR to root for Docker context stability
    $jar = Get-ChildItem "target/*.jar" -Exclude "*.original" | Select-Object -First 1
    if ($jar) {
        Copy-Item $jar.FullName -Destination "app.jar" -Force
        Write-Host "  -> Prepared app.jar"
    }
    else {
        Write-Error "JAR not found in $svc/target"
        Pop-Location; exit 1
    }
    Pop-Location
}

# 2. Docker Phase
Write-Host "`n[2/4] Orchestrating Infrastructure (Docker)..."
docker-compose down
docker-compose up -d --build

# 3. Wait Strategy
Write-Host "`n[3/4] Waiting for Service Mesh (20s)..."
Start-Sleep -Seconds 20

# 4. Traffic Generation
Write-Host "`n[4/4] Sending Traffic (Chaos Test)..."
try {
    $body = @{ id = "123"; item = "Laptop"; quantity = 1 } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://localhost:8080/create" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "`n[SUCCESS] Response: $response"
}
catch {
    Write-Host "`n[FAILURE] Request failed. Is the Chaos Monkey active? Check logs."
    Write-Host $_
}

Write-Host "`n[INFO] View Traces: http://localhost:8080 or check temp/traces/"
Write-Host "Press Enter to stop services..."
Read-Host
docker-compose down

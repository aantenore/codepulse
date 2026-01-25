# run_demo.ps1

Write-Host "[Demo] Starting Infrastructure..."
New-Item -ItemType Directory -Force -Path "temp/traces" | Out-Null
docker-compose up -d

Write-Host "[Demo] Checking OTel Agent..."
if (-not (Test-Path "opentelemetry-javaagent.jar")) {
    Write-Host "[Demo] Downloading Agent..."
    Invoke-WebRequest -Uri "https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar" -OutFile "opentelemetry-javaagent.jar"
}

Write-Host "[Demo] Building Services..."
Push-Location "playground/repo-inventory-service"
cmd /c "mvn clean package -DskipTests"
Pop-Location

Push-Location "playground/repo-order-service"
cmd /c "mvn clean package -DskipTests"
Pop-Location

Write-Host "[Demo] Services Built. Starting..."

# Inventory Service
$InventoryProcess = Start-Process -FilePath "java" -ArgumentList "-javaagent:opentelemetry-javaagent.jar", "-Dserver.port=8081", "-DTOEL_SERVICE_NAME=inventory-service", "-Dotel.exporter.otlp.endpoint=http://localhost:4317", "-jar", "playground/repo-inventory-service/target/inventory-service-1.0.0.jar" -PassThru -NoNewWindow

Start-Sleep -Seconds 5

# Order Service
$OrderProcess = Start-Process -FilePath "java" -ArgumentList "-javaagent:opentelemetry-javaagent.jar", "-Dserver.port=8080", "-DTOEL_SERVICE_NAME=order-service", "-Dotel.exporter.otlp.endpoint=http://localhost:4317", "-jar", "playground/repo-order-service/target/order-service-1.0.0.jar" -PassThru -NoNewWindow

Write-Host "[Demo] Waiting for startup (15s)..."
Start-Sleep -Seconds 15

Write-Host "[Demo] Sending Request..."
Invoke-RestMethod -Uri "http://localhost:8080/create" -Method Post -Body '{"id":"123"}' -ContentType "application/json"

Write-Host "`n[Demo] Success! Traces should be in temp/traces/trace-dump.json"
Write-Host "Press Enter to stop services..."
Read-Host

Stop-Process -Id $InventoryProcess.Id -Force
Stop-Process -Id $OrderProcess.Id -Force

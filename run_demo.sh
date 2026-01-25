#!/bin/bash

# 1. Setup Infrastructure
echo "[Demo] Starting Infrastructure..."
mkdir -p temp/traces
docker-compose up -d

# 2. Get Agent
if [ ! -f opentelemetry-javaagent.jar ]; then
    echo "[Demo] Downloading OTel Java Agent..."
    curl -L -o opentelemetry-javaagent.jar https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar
fi

# 3. Build Apps
echo "[Demo] Building Services..."
(cd playground/repo-inventory-service && mvn clean package -DskipTests)
(cd playground/repo-order-service && mvn clean package -DskipTests)

# 4. Run Inventory Service (Port 8081)
echo "[Demo] Starting Inventory Service (8081)..."
export OTEL_SERVICE_NAME=inventory-service
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
# Run in background
java -javaagent:opentelemetry-javaagent.jar \
     -Dserver.port=8081 \
     -jar playground/repo-inventory-service/target/inventory-service-1.0.0.jar &
INVENTORY_PID=$!

sleep 5

# 5. Run Order Service (Port 8080)
echo "[Demo] Starting Order Service (8080)..."
export OTEL_SERVICE_NAME=order-service
java -javaagent:opentelemetry-javaagent.jar \
     -Dserver.port=8080 \
     -jar playground/repo-order-service/target/order-service-1.0.0.jar &
ORDER_PID=$!

echo "[Demo] Waiting for startup..."
sleep 15

# 6. Trigger Flow
echo "[Demo] Triggering Flow..."
curl -X POST -H "Content-Type: application/json" -d '{"id":"123"}' http://localhost:8080/create

echo ""
echo "[Demo] Done! Check temp/traces/trace-dump.json"

# Cleanup
kill $INVENTORY_PID
kill $ORDER_PID

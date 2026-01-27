$services = @("gateway", "auth", "product", "order", "payment", "shipping")
$baseDir = "playground"

Write-Host "Cleaning playground..."
if (Test-Path "$baseDir") { Remove-Item "$baseDir/repo-*" -Recurse -Force -ErrorAction SilentlyContinue }

foreach ($svc in $services) {
    $repoName = "repo-$svc"
    $pkgPath = "$baseDir/$repoName/src/main/java/com/microcommerce/$svc"
    Write-Host "Scaffolding $svc..."
    New-Item -ItemType Directory -Path $pkgPath -Force | Out-Null
    
    # POM.XML (Standard)
    $pomContent = @"
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.microcommerce</groupId>
    <artifactId>$svc-service</artifactId>
    <version>1.0.0</version>
    <parent><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-parent</artifactId><version>3.1.2</version></parent>
    <properties><maven.compiler.release>17</maven.compiler.release></properties>
    <dependencies>
        <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
        <dependency><groupId>io.opentelemetry</groupId><artifactId>opentelemetry-api</artifactId><version>1.32.0</version></dependency>
    </dependencies>
    <build><plugins><plugin><groupId>org.springframework.boot</groupId><artifactId>spring-boot-maven-plugin</artifactId></plugin></plugins></build>
</project>
"@
    Set-Content -Path "$baseDir/$repoName/pom.xml" -Value $pomContent

    # Dockerfile
    Set-Content -Path "$baseDir/$repoName/Dockerfile" -Value "FROM eclipse-temurin:21-jre`nWORKDIR /app`nCOPY target/*.jar app.jar`nCMD [`"java`", `"-jar`", `"app.jar`"]"

    # Main App
    $className = (Get-Culture).TextInfo.ToTitleCase($svc) + "ServiceApplication"
    Set-Content -Path "$pkgPath/$className.java" -Value "package com.microcommerce.$svc;`nimport org.springframework.boot.SpringApplication;`nimport org.springframework.boot.autoconfigure.SpringBootApplication;`n@SpringBootApplication`npublic class $className { public static void main(String[] args) { SpringApplication.run($className.class, args); } }"

    # Controller (THE FIX: ALL PORTS 8080)
    $ctrlName = (Get-Culture).TextInfo.ToTitleCase($svc) + "Controller"
    $ctrlContent = ""
    if ($svc -eq "gateway") {
        $ctrlContent = @"
package com.microcommerce.gateway;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
@RestController
public class GatewayController {
    private RestTemplate restTemplate = new RestTemplate();
    @GetMapping("/health") public String health() { return "OK"; }
    @PostMapping("/api/login") public String login() { return restTemplate.postForObject("http://auth-service:8080/login", null, String.class); }
    @PostMapping("/api/order") public String createOrder() { return restTemplate.postForObject("http://order-service:8080/create", null, String.class); }
}
"@
    } elseif ($svc -eq "order") {
        $ctrlContent = @"
package com.microcommerce.order;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
@RestController
public class OrderController {
    private RestTemplate restTemplate = new RestTemplate();
    @GetMapping("/health") public String health() { return "OK"; }
    @PostMapping("/create") public String create() {
        String prod = restTemplate.getForObject("http://product-service:8080/products", String.class);
        String pay = restTemplate.postForObject("http://payment-service:8080/pay", null, String.class);
        String ship = restTemplate.postForObject("http://shipping-service:8080/ship", null, String.class);
        return "Order Created: " + prod + " | " + pay + " | " + ship;
    }
}
"@
    } elseif ($svc -eq "payment") {
        $ctrlContent = @"
package com.microcommerce.payment;
import org.springframework.web.bind.annotation.*;
import java.util.Random;
@RestController
public class PaymentController {
    private Random random = new Random();
    @GetMapping("/health") public String health() { return "OK"; }
    @PostMapping("/pay") public String pay() {
        try { Thread.sleep(random.nextInt(100)); } catch (Exception e) {}
        if (random.nextInt(10) > 8) throw new RuntimeException("Payment Failed");
        return "Payment Processed";
    }
}
"@
    } elseif ($svc -eq "auth") {
        $ctrlContent = "package com.microcommerce.auth; import org.springframework.web.bind.annotation.*; @RestController public class AuthController { @GetMapping(`"/health`") public String health() { return `"OK`"; } @PostMapping(`"/login`") public String login() { return `"Login Success`"; } @PostMapping(`"/reset-password`") public String resetPassword() { return `"Zombie`"; } }"
    } elseif ($svc -eq "product") {
        $ctrlContent = "package com.microcommerce.product; import org.springframework.web.bind.annotation.*; @RestController public class ProductController { @GetMapping(`"/health`") public String health() { return `"OK`"; } @GetMapping(`"/products`") public String getProducts() { return `"Product List`"; } }"
    } elseif ($svc -eq "shipping") {
        $ctrlContent = "package com.microcommerce.shipping; import org.springframework.web.bind.annotation.*; @RestController public class ShippingController { @GetMapping(`"/health`") public String health() { return `"OK`"; } @PostMapping(`"/ship`") public String ship() { return `"Shipped`"; } }"
    }
    Set-Content -Path "$pkgPath/$ctrlName.java" -Value $ctrlContent
}
Write-Host "Scaffolding Complete. All services on port 8080."

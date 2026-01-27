# setup_microcommerce.ps1
$services = @("gateway", "auth", "product", "order", "payment", "shipping")
$baseDir = "playground"

# Clean old
Write-Host "Cleaning playground..."
if (Test-Path "$baseDir") { Remove-Item "$baseDir/repo-*" -Recurse -Force -ErrorAction SilentlyContinue }

foreach ($svc in $services) {
    $repoName = "repo-$svc"
    $pkgPath = "$baseDir/$repoName/src/main/java/com/microcommerce/$svc"
    
    Write-Host "Scaffolding $svc..."
    New-Item -ItemType Directory -Path $pkgPath -Force | Out-Null
    
    # 1. POM.XML
    $pomContent = @"
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.microcommerce</groupId>
    <artifactId>$svc-service</artifactId>
    <version>1.0.0</version>
    
    <properties>
        <maven.compiler.release>17</maven.compiler.release>
    </properties>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.2</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>io.opentelemetry</groupId>
            <artifactId>opentelemetry-api</artifactId>
            <version>1.32.0</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
"@
    Set-Content -Path "$baseDir/$repoName/pom.xml" -Value $pomContent

    # 2. Dockerfile
    $dockerContent = @"
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY app.jar app.jar
CMD ["java", "-jar", "app.jar"]
"@
    Set-Content -Path "$baseDir/$repoName/Dockerfile" -Value $dockerContent

    # 3. Application Class
    $className = (Get-Culture).TextInfo.ToTitleCase($svc) + "ServiceApplication"
    $appContent = @"
package com.microcommerce.$svc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class $className {
    public static void main(String[] args) {
        SpringApplication.run($className.class, args);
    }
}
"@
    Set-Content -Path "$pkgPath/$className.java" -Value $appContent
    
    # 4. Controller Class (Specifics)
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

    @PostMapping("/api/login")
    public String login() {
        return restTemplate.postForObject("http://auth-service:8081/login", null, String.class);
    }

    @PostMapping("/api/order")
    public String createOrder() {
        return restTemplate.postForObject("http://order-service:8083/create", null, String.class);
    }
}
"@
    } elseif ($svc -eq "auth") {
        $ctrlContent = @"
package com.microcommerce.auth;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {
    @PostMapping("/login")
    public String login() { return "Login Success"; }

    @PostMapping("/reset-password") // Zombie
    public String resetPassword() { return "Password Reset"; }
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

    @PostMapping("/create")
    public String create() {
        String prod = restTemplate.getForObject("http://product-service:8082/products", String.class);
        String pay = restTemplate.postForObject("http://payment-service:8084/pay", null, String.class);
        String ship = restTemplate.postForObject("http://shipping-service:8085/ship", null, String.class);
        return "Order Created: " + prod + " | " + pay + " | " + ship;
    }
}
"@
    } elseif ($svc -eq "product") {
         $ctrlContent = @"
package com.microcommerce.product;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProductController {
    @GetMapping("/products")
    public String getProducts() { return "Product List"; }
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

    @PostMapping("/pay")
    public String pay() {
        try { Thread.sleep(random.nextInt(100)); } catch (Exception e) {}
        if (random.nextInt(10) > 8) throw new RuntimeException("Payment Failed");
        return "Payment Processed";
    }
}
"@
    } elseif ($svc -eq "shipping") {
         $ctrlContent = @"
package com.microcommerce.shipping;
import org.springframework.web.bind.annotation.*;

@RestController
public class ShippingController {
    @PostMapping("/ship")
    public String ship() { return "Shipped"; }
}
"@
    }

    if ($ctrlContent -ne "") {
        Set-Content -Path "$pkgPath/$ctrlName.java" -Value $ctrlContent
    }
}
Write-Host "Scaffolding Complete."

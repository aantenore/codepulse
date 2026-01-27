#!/bin/bash
mkdir -p playground/repo-order-service/src/main/java/com/codepulse/order
mkdir -p playground/repo-inventory-service/src/main/java/com/codepulse/inventory

# Order Service (Caller)
cat <<EOF > playground/repo-order-service/src/main/java/com/codepulse/order/OrderController.java
package com.codepulse.order;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@RestController
public class OrderController {
    
    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/order")
    public String placeOrder() {
        // Call Payment Service
        try {
            String paymentResponse = restTemplate.postForObject("http://localhost:8081/payment", null, String.class);
            
            // Call Inventory Service
            String inventoryResponse = restTemplate.getForObject("http://localhost:8082/inventory", String.class);
            
            return "Order Placed! " + paymentResponse + " " + inventoryResponse;
        } catch (Exception e) {
             return "Order Failed: " + e.getMessage();
        }
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
EOF

# Inventory Service (Callee)
cat <<EOF > playground/repo-inventory-service/src/main/java/com/codepulse/inventory/InventoryController.java
package com.codepulse.inventory;

import org.springframework.web.bind.annotation.*;

@RestController
public class InventoryController {

    @PostMapping("/check")
    public String check(@RequestBody Object item) {
        // DB Call
        return "OK";
    }
}
EOF

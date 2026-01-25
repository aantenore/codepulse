#!/bin/bash
mkdir -p playground/repo-order-service/src/main/java/com/prada/order
mkdir -p playground/repo-inventory-service/src/main/java/com/prada/inventory

# Order Service (Caller)
cat <<EOF > playground/repo-order-service/src/main/java/com/prada/order/OrderController.java
package com.prada.order;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
public class OrderController {

    private OrderRepository repo;
    private RestTemplate restTemplate;

    @PostMapping("/create")
    public Order create(@RequestBody Order o) {
        System.out.println("Checking Inventory...");
        // External Call
        String status = restTemplate.postForObject("http://inventory-service/check", o, String.class);
        
        if ("OK".equals(status)) {
            // DB Call
            return repo.save(o);
        }
        throw new RuntimeException("Out of Stock");
    }
}
EOF

# Inventory Service (Callee)
cat <<EOF > playground/repo-inventory-service/src/main/java/com/prada/inventory/InventoryController.java
package com.prada.inventory;

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

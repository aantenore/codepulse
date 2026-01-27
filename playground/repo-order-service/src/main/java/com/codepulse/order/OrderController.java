package com.codepulse.order;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
public class OrderController {

    private OrderRepository repo = new OrderRepository(); // Mock
    private RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/create")
    public Order create(@RequestBody Order o) {
        System.out.println("Checking Inventory...");
        // Call Inventory Service (Port 8082)
        String status = restTemplate.getForObject("http://localhost:8082/inventory", String.class);

        if ("OK".equals(status)) {
            System.out.println("Processing Payment...");
            // Call Payment Service (Port 8081) - CHAOS ENABLED
            String payStatus = restTemplate.postForObject("http://localhost:8081/payment", o.getId(), String.class);
            System.out.println("Payment Status: " + payStatus);

            return repo.save(o);
        }
        throw new RuntimeException("Out of Stock");
    }
}

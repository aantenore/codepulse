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

package com.microcommerce.product;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
public class ProductController {
    private RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @GetMapping("/products")
    public String getProducts() {
        String legacy = restTemplate.getForObject("http://legacy-warehouse:80/inventory.json", String.class);
        return "Product List (Stock: " + legacy + ")";
    }
}

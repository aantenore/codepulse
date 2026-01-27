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

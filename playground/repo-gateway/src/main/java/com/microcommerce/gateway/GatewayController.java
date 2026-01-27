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

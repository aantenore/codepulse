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

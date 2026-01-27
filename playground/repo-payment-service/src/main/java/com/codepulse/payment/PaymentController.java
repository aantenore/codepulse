package com.codepulse.payment;

import org.springframework.web.bind.annotation.*;
import java.util.Random;

@RestController
public class PaymentController {

    private final Random random = new Random();

    @PostMapping("/payment")
    public String processPayment(@RequestBody String orderId) throws InterruptedException {
        // CHAOS: Random Latency (100ms - 2000ms)
        int latency = 100 + random.nextInt(1900);
        System.out.println("Processing payment for " + orderId + " with latency " + latency + "ms");
        Thread.sleep(latency);

        // CHAOS: Random Error (20%)
        if (random.nextInt(100) < 20) {
            System.err.println("Payment FAILED for " + orderId);
            throw new RuntimeException("Payment Gateway Timeout (Simulated)");
        }

        System.out.println("Payment SUCCESS for " + orderId);
        return "{\"status\":\"PAID\", \"txnId\":\"" + Math.abs(random.nextLong()) + "\"}";
    }
}

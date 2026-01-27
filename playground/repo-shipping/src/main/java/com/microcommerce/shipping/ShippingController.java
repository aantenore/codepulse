package com.microcommerce.shipping;
import org.springframework.web.bind.annotation.*;

@RestController
public class ShippingController {
    @PostMapping("/ship")
    public String ship() { return "Shipped"; }
}

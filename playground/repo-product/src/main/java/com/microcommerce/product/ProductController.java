package com.microcommerce.product;
import org.springframework.web.bind.annotation.*;

@RestController
public class ProductController {
    @GetMapping("/products")
    public String getProducts() { return "Product List"; }
}

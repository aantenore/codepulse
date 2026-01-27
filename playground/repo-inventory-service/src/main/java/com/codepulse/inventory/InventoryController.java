package com.codepulse.inventory;

import org.springframework.web.bind.annotation.*;

@RestController
public class InventoryController {

    @GetMapping("/inventory")
    public String check() {
        // DB Call
        return "OK";
    }
}

package com.prada.inventory;

import org.springframework.web.bind.annotation.*;

@RestController
public class InventoryController {

    @PostMapping("/check")
    public String check(@RequestBody Object item) {
        // DB Call
        return "OK";
    }
}

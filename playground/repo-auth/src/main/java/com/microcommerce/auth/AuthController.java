package com.microcommerce.auth;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {
    @PostMapping("/login")
    public String login() { return "Login Success"; }

    @PostMapping("/reset-password") // Zombie
    public String resetPassword() { return "Password Reset"; }
}

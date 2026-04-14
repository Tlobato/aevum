package com.aevum.api.controller;

import com.aevum.api.domain.User;
import com.aevum.api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public record AuthRequest(String email) {}
    public record AuthResponse(String id, String email) {}

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<User> existingUser = userRepository.findByEmail(request.email().toLowerCase());
        
        if (existingUser.isPresent()) {
            return ResponseEntity.ok(new AuthResponse(existingUser.get().getId(), existingUser.get().getEmail()));
        }

        // Auto-Register se não existir
        User newUser = new User();
        newUser.setId(UUID.randomUUID().toString());
        newUser.setEmail(request.email().toLowerCase());
        userRepository.save(newUser);

        return ResponseEntity.ok(new AuthResponse(newUser.getId(), newUser.getEmail()));
    }
}

package com.example.demospace;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final String demoEmail;
    private final String demoPassword;

    public AuthService(
        @Value("${demo.login.email:demo@example.com}") String demoEmail,
        @Value("${demo.login.password:Demo@123}") String demoPassword
    ) {
        this.demoEmail = demoEmail;
        this.demoPassword = demoPassword;
    }

    public Map<String, Object> authenticate(LoginRequest request) {
        if (!demoEmail.equals(request.email()) || !demoPassword.equals(request.password())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        return Map.of(
            "success", true,
            "message", "Login successful",
            "user", Map.of("name", "Demo User", "email", demoEmail)
        );
    }
}

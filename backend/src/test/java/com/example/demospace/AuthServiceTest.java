package com.example.demospace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import org.junit.jupiter.api.Test;

class AuthServiceTest {
    private final AuthService authService = new AuthService("demo@example.com", "Demo@123");

    @Test
    void authenticatesWithValidCredentials() {
        Map<String, Object> result = authService.authenticate(new LoginRequest("demo@example.com", "Demo@123"));

        assertThat(result).containsEntry("success", true).containsEntry("message", "Login successful");
        assertThat(result.get("user")).isEqualTo(Map.of("name", "Demo User", "email", "demo@example.com"));
    }

    @Test
    void rejectsWrongPassword() {
        assertThatThrownBy(() -> authService.authenticate(new LoginRequest("demo@example.com", "wrong")))
            .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void rejectsUnknownEmail() {
        assertThatThrownBy(() -> authService.authenticate(new LoginRequest("nobody@example.com", "Demo@123")))
            .isInstanceOf(InvalidCredentialsException.class);
    }
}

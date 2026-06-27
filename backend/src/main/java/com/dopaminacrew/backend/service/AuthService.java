package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.dto.AuthResponse;
import com.dopaminacrew.backend.dto.LoginRequest;
import com.dopaminacrew.backend.dto.RegisterRequest;

/**
 * Service interface handling user registration and login business rules.
 */
public interface AuthService {
    
    void register(RegisterRequest registerRequest);
    
    AuthResponse login(LoginRequest loginRequest, String ipAddress);

    AuthResponse loginWithGoogle(com.dopaminacrew.backend.dto.GoogleLoginRequest googleRequest, String ipAddress);
}

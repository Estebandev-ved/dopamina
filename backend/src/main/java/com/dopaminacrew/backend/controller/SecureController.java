package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.dto.MessageResponse;
import com.dopaminacrew.backend.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Protected controller to verify routing security and JWT verification.
 * Security Note: Endpoint requires user to be authenticated and have a valid bearer token.
 */
@RestController
@RequestMapping("/api/events")
public class SecureController {

    @PostMapping("/buy-ticket")
    public ResponseEntity<?> buyTicket(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(new MessageResponse("No autorizado."));
        }
        
        String responseMessage = String.format("¡Hola %s! Tu boleta para el evento 'Borrachos pero nunca fachos' ha sido reservada con éxito. Recibirás las instrucciones de pago en tu email: %s.",
                currentUser.getNombre(), currentUser.getEmail());
                
        return ResponseEntity.ok(new MessageResponse(responseMessage));
    }
}

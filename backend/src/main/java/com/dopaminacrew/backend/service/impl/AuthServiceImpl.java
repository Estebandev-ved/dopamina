package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.dto.AuthResponse;
import com.dopaminacrew.backend.dto.LoginRequest;
import com.dopaminacrew.backend.dto.RegisterRequest;
import com.dopaminacrew.backend.model.Role;
import com.dopaminacrew.backend.model.RoleName;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.RoleRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.security.JwtTokenProvider;
import com.dopaminacrew.backend.security.UserPrincipal;
import com.dopaminacrew.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.dopaminacrew.backend.model.LoginAudit;
import com.dopaminacrew.backend.repository.LoginAuditRepository;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Service implementation for user credentials authentication and registration.
 * Security Note:
 * - Validates emails are unique.
 * - Password hashing using BCrypt is performed before saving to database.
 */
@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private LoginAuditRepository loginAuditRepository;

    @Override
    @Transactional
    public void register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Error: El email ya está registrado.");
        }

        // Create user
        User user = new User();
        user.setNombre(registerRequest.getNombre());
        user.setEmail(registerRequest.getEmail());
        user.setTelefono(registerRequest.getTelefono());
        
        // Securely hash the password using BCrypt
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        // Assign default role (USER)
        Role userRole = roleRepository.findByNombre(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(new Role(null, RoleName.ROLE_USER)));
        user.setRol(userRole);
        user.setBanned(false);

        userRepository.save(user);
    }

    private void checkLockout(String email, String ipAddress) {
        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);

        // 1. IP Blacklist check (automated defense against brute force attacks across multiple accounts)
        List<LoginAudit> ipAudits = loginAuditRepository.findByIpAddressAndTimestampAfterOrderByTimestampDesc(ipAddress, fifteenMinutesAgo);
        int ipFailures = 0;
        for (LoginAudit audit : ipAudits) {
            if (!audit.isExitoso()) {
                ipFailures++;
            }
        }
        if (ipFailures >= 15) {
            throw new RuntimeException("Acceso bloqueado temporalmente para esta dirección IP por comportamiento sospechoso.");
        }

        // 2. User Lockout & Auto-Ban check
        List<LoginAudit> audits = loginAuditRepository.findByEmailAndTimestampAfterOrderByTimestampDesc(email, fifteenMinutesAgo);
        
        int consecutiveFailures = 0;
        for (LoginAudit audit : audits) {
            if (audit.isExitoso()) {
                break;
            } else {
                consecutiveFailures++;
            }
        }
        
        if (consecutiveFailures >= 5) {
            // Count previous lockouts in the last 24 hours
            LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
            List<LoginAudit> lockouts = loginAuditRepository.findByEmailAndDetallesContainingAndTimestampAfter(
                email, "Cuenta bloqueada temporalmente", oneDayAgo
            );

            // If they have triggered lockout 3 or more times in 24 hours, automatically ban the user
            if (lockouts.size() >= 3) {
                userRepository.findByEmail(email).ifPresent(user -> {
                    if (user.getRol() == null || !"ROLE_ADMIN".equals(user.getRol().getNombre().name())) {
                        user.setBanned(true);
                        userRepository.save(user);
                        
                        LoginAudit autoBanAudit = new LoginAudit(
                            null, email, ipAddress, false, LocalDateTime.now(), 
                            "Baneo automático: Múltiples bloqueos de seguridad por fuerza bruta acumulados"
                        );
                        loginAuditRepository.save(autoBanAudit);
                    }
                });
                throw new RuntimeException("La cuenta ha sido suspendida automáticamente por comportamiento sospechoso de fuerza bruta.");
            }

            throw new RuntimeException("Cuenta bloqueada temporalmente por 15 minutos debido a múltiples intentos fallidos.");
        }
    }

    @Override
    public AuthResponse login(LoginRequest loginRequest, String ipAddress) {
        String email = loginRequest.getEmail();
        
        // Check lockout
        checkLockout(email, ipAddress);

        try {
            // Authenticate credentials
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate token
            String jwt = tokenProvider.generateToken(authentication);
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            // Get user role
            String rol = userPrincipal.getAuthorities().iterator().next().getAuthority();

            // Log successful attempt
            LoginAudit audit = new LoginAudit(null, email, ipAddress, true, LocalDateTime.now(), "Inicio de sesión exitoso");
            loginAuditRepository.save(audit);

            return new AuthResponse(
                    jwt,
                    userPrincipal.getId(),
                    userPrincipal.getNombre(),
                    userPrincipal.getEmail(),
                    rol
            );
        } catch (org.springframework.security.authentication.DisabledException ex) {
            LoginAudit audit = new LoginAudit(null, email, ipAddress, false, LocalDateTime.now(), "Cuenta suspendida");
            loginAuditRepository.save(audit);
            throw new RuntimeException("La cuenta ha sido suspendida por el administrador.");
        } catch (org.springframework.security.core.AuthenticationException ex) {
            LoginAudit audit = new LoginAudit(null, email, ipAddress, false, LocalDateTime.now(), "Credenciales incorrectas");
            loginAuditRepository.save(audit);
            throw new RuntimeException("Credenciales incorrectas o inválidas.");
        } catch (Exception ex) {
            LoginAudit audit = new LoginAudit(null, email, ipAddress, false, LocalDateTime.now(), "Error: " + ex.getMessage());
            loginAuditRepository.save(audit);
            throw ex;
        }
    }

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(com.dopaminacrew.backend.dto.GoogleLoginRequest googleRequest, String ipAddress) {
        User user = userRepository.findByEmail(googleRequest.getEmail())
                .orElseGet(() -> {
                    // Create new user automatically if not registered yet
                    User newUser = new User();
                    newUser.setNombre(googleRequest.getNombre());
                    newUser.setEmail(googleRequest.getEmail());
                    newUser.setTelefono("GOOGLE-AUTH");
                    // Generate secure random hashed password
                    newUser.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
                    
                    Role userRole = roleRepository.findByNombre(RoleName.ROLE_USER)
                            .orElseGet(() -> roleRepository.save(new Role(null, RoleName.ROLE_USER)));
                    newUser.setRol(userRole);
                    newUser.setBanned(false);
                    
                    return userRepository.save(newUser);
                });

        if (user.getBanned() != null && user.getBanned()) {
            LoginAudit audit = new LoginAudit(null, googleRequest.getEmail(), ipAddress, false, LocalDateTime.now(), "Google login: Cuenta suspendida");
            loginAuditRepository.save(audit);
            throw new RuntimeException("La cuenta ha sido suspendida por el administrador.");
        }

        // Authenticate programmatically in security context
        UserPrincipal userPrincipal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userPrincipal, null, userPrincipal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        String rol = userPrincipal.getAuthorities().iterator().next().getAuthority();

        // Log successful attempt
        LoginAudit audit = new LoginAudit(null, googleRequest.getEmail(), ipAddress, true, LocalDateTime.now(), "Inicio de sesión con Google exitoso");
        loginAuditRepository.save(audit);

        return new AuthResponse(
                jwt,
                userPrincipal.getId(),
                userPrincipal.getNombre(),
                userPrincipal.getEmail(),
                rol
        );
    }
}

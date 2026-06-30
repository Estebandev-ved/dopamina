package com.dopaminacrew.backend.config;

import com.dopaminacrew.backend.model.Role;
import com.dopaminacrew.backend.model.RoleName;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.repository.RoleRepository;
import com.dopaminacrew.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Automáticamente verifica y crea los roles por defecto y la cuenta inicial del administrador
 * en el arranque de la aplicación (útil para despliegues limpios en producción).
 */
@Component
public class AdminSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${ADMIN_EMAIL:admin@dopaminacrew.com}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:dopamina_secure_admin_2026}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("====== INICIANDO SIEMBRA DE ROLES Y ADMINISTRADOR EN BD ======");

        // 1. Sembrar roles de seguridad si no existen
        roleRepository.findByNombre(RoleName.ROLE_USER)
                .orElseGet(() -> {
                    System.out.println("Sembrando rol por defecto: ROLE_USER");
                    return roleRepository.save(new Role(null, RoleName.ROLE_USER));
                });

        Role adminRole = roleRepository.findByNombre(RoleName.ROLE_ADMIN)
                .orElseGet(() -> {
                    System.out.println("Sembrando rol por defecto: ROLE_ADMIN");
                    return roleRepository.save(new Role(null, RoleName.ROLE_ADMIN));
                });

        Role subAdminRole = roleRepository.findByNombre(RoleName.ROLE_SUBADMIN)
                .orElseGet(() -> {
                    System.out.println("Sembrando rol por defecto: ROLE_SUBADMIN");
                    return roleRepository.save(new Role(null, RoleName.ROLE_SUBADMIN));
                });

        // 2. Sembrar cuenta inicial del Administrador si no existe en BD
        if (!userRepository.existsByEmail(adminEmail)) {
            System.out.println("No se encontró la cuenta de administrador principal. Creando cuenta de semilla...");
            User admin = new User();
            admin.setNombre("Administrador Principal");
            admin.setEmail(adminEmail);
            admin.setTelefono("3000000000");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRol(adminRole);
            admin.setBanned(false);

            userRepository.save(admin);
            System.out.println("✔ Cuenta de administrador creada con éxito.");
            System.out.println("  → Email: " + adminEmail);
            System.out.println("  → Password: [Configurado en variables de entorno o valor de semilla por defecto]");
        } else {
            System.out.println("✔ La cuenta de administrador principal ya existe en la base de datos.");
        }

        System.out.println("====== SIEMBRA DE ROLES Y ADMINISTRADOR FINALIZADA ======");
    }
}

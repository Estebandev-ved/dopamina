package com.dopaminacrew.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application entry point for the Dopamina Crew Backend.
 * Security Note: CORS configuration and CSRF prevention are set up in the SecurityConfig class.
 */
@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        // Load environment variables from .env file into System properties
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory("./")
                    .ignoreIfMissing()
                    .load();
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
        } catch (Exception e) {
            System.err.println("No se pudo cargar el archivo .env: " + e.getMessage());
        }

        SpringApplication.run(BackendApplication.class, args);
    }
}

package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity mapping representing the 'usuarios' table.
 * Security Note: Passwords stored here must always be encrypted using BCrypt.
 */
@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 20)
    private String telefono;

    @Column(nullable = false, length = 255)
    private String password;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rol_id", nullable = false)
    private Role rol;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean banned = false;

    // ── Datos bancarios para giros a promotores ──────────────────────────────
    // Security Note: Solo se almacena info de cuenta, no datos sensibles de tarjetas.
    @Column(name = "cuenta_bancaria", length = 30)
    private String cuentaBancaria;

    @Column(name = "banco", length = 80)
    private String banco;

    @Column(name = "titular_cuenta", length = 100)
    private String titularCuenta;

    @Column(name = "tipo_cuenta", length = 20)
    private String tipoCuenta; // "AHORROS" o "CORRIENTE"
}

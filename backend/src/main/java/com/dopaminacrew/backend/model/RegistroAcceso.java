package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity mapping representing scan check-in logs in the 'registro_acceso' table.
 */
@Entity
@Table(name = "registro_acceso")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_qr", nullable = false, length = 255)
    private String codigoQr;

    @Column(name = "usuario_nombre", length = 100)
    private String usuarioNombre;

    @Column(name = "evento_nombre", length = 100)
    private String eventoNombre;

    @Column(nullable = false, length = 20)
    private String estado; // SUCCESS or DENIED

    @Column(length = 255)
    private String mensaje;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}

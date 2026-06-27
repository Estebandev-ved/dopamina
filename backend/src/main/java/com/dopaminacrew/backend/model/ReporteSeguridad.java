package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity mapping representing real-time security reports from the 'Safe Space' module.
 */
@Entity
@Table(name = "reportes_seguridad")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReporteSeguridad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id") // Nullable for anonymous reports
    private User usuario;

    @Column(nullable = false, length = 100)
    private String tipo; // e.g., Acoso, Emergencia Médica, Consumo Peligroso, Infraestructura, Otro

    @Column(nullable = false, length = 255)
    private String ubicacion;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, length = 50)
    private String estado = "PENDIENTE"; // PENDIENTE, EN_PROCESO, RESUELTO

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

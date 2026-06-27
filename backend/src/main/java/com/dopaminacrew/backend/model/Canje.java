package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity mapping representing the 'canjes' table for user reward redemptions.
 * Security Note:
 * - Data is associated with a specific User via a foreign key relationship.
 * - Auto-generated ID prevents enumeration exploits.
 */
@Entity
@Table(name = "canjes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Canje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    @Column(name = "premio_id", nullable = false, length = 100)
    private String premioId;

    @Column(name = "premio_titulo", nullable = false, length = 255)
    private String premioTitulo;

    @Column(name = "codigo_canje", nullable = false, unique = true, length = 100)
    private String codigoCanje;

    @Column(name = "costo_puntos", nullable = false)
    private Integer costoPuntos;

    @Column(nullable = false, length = 50)
    private String estado = "PENDIENTE"; // PENDIENTE, ENTREGADO

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}

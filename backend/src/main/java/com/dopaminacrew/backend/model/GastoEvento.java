package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity mapping for the 'gastos_evento' table.
 * Each gasto belongs to a specific Evento.
 */
@Entity
@Table(name = "gastos_evento")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GastoEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "evento_id", nullable = false)
    private Long eventoId;

    @Column(nullable = false, length = 200)
    private String item;

    @Column(name = "valor_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pagado = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String estado = "Pendiente";

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}

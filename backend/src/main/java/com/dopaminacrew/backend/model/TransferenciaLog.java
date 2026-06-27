package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity mapping representing audit logs for ticket transfers.
 */
@Entity
@Table(name = "transferencia_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferenciaLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boleta_id", nullable = false)
    private Boleta boleta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_origen_id", nullable = false)
    private User usuarioOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_destino_id", nullable = false)
    private User usuarioDestino;

    @Column(name = "codigo_qr_anterior", nullable = false, length = 255)
    private String codigoQrAnterior;

    @Column(name = "codigo_qr_nuevo", nullable = false, length = 255)
    private String codigoQrNuevo;

    @Column(name = "fecha_transferencia", nullable = false)
    private LocalDateTime fechaTransferencia = LocalDateTime.now();
}

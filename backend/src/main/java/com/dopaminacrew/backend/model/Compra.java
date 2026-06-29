package com.dopaminacrew.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity mapping representing the 'compras' table.
 */
@Entity
@Table(name = "compras")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Compra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evento_id")
    private Evento evento;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false)
    private Double subtotal;

    @Column(nullable = false)
    private Double descuento;

    @Column(nullable = false)
    private Double total;

    @Column(name = "codigo_cupon", length = 50)
    private String codigoCupon;

    @Column(nullable = false, length = 50)
    private String estado = "PENDIENTE"; // PENDIENTE, PAGADO, RECHAZADO

    // true si esta compra aplicó la promo de "10% por 4+ boletas".
    // Sirve para que la promo sea de un solo uso por usuario.
    @Column(name = "promo_parche_aplicada", nullable = false)
    private Boolean promoParcheAplicada = false;

    @Column(name = "codigo_qr", nullable = false, unique = true, length = 255)
    private String codigoQr;

    @Column(name = "efipay_payment_id", length = 100)
    private String efipayPaymentId;

    @Column(name = "efipay_status", length = 50)
    private String efipayStatus;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

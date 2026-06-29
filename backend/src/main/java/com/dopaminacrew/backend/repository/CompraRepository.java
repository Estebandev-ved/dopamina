package com.dopaminacrew.backend.repository;

import com.dopaminacrew.backend.model.Compra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Data access layer for Compra entity.
 */
@Repository
public interface CompraRepository extends JpaRepository<Compra, Long> {

    // Ventana de reserva: una compra PENDIENTE retiene su cupo durante este tiempo
    // mientras el usuario completa el pago. Pasado el plazo, el cupo se libera para
    // que carritos abandonados no bloqueen entradas (ni de aforo ni de preventa).
    long MINUTOS_RESERVA = 30;

    List<Compra> findByUsuarioIdOrderByCreatedAtDesc(Long usuarioId);

    /**
     * Entradas "ocupadas" de un evento = compras PAGADAS + compras PENDIENTES recientes
     * (dentro de la ventana de reserva). Es la cifra correcta para decidir aforo y
     * cupo de preventa: evita sobreventa mientras alguien paga, pero libera los
     * carritos abandonados. COALESCE garantiza 0 cuando no hay filas.
     */
    @Query("SELECT COALESCE(SUM(c.cantidad), 0) FROM Compra c WHERE c.evento.id = :eventoId "
            + "AND (c.estado = 'PAGADO' OR (c.estado = 'PENDIENTE' AND c.createdAt >= :limiteReserva))")
    int sumEntradasOcupadas(@Param("eventoId") Long eventoId, @Param("limiteReserva") LocalDateTime limiteReserva);

    /** Conveniencia: cuenta entradas ocupadas usando la ventana de reserva estándar. */
    default int contarEntradasOcupadas(Long eventoId) {
        return sumEntradasOcupadas(eventoId, LocalDateTime.now().minusMinutes(MINUTOS_RESERVA));
    }

    Compra findByEfipayPaymentId(String efipayPaymentId);

    @Query("SELECT COUNT(c) FROM Compra c WHERE c.usuario.id = :usuarioId AND c.codigoCupon = :cupon")
    long countByUsuarioIdAndCodigoCupon(@Param("usuarioId") Long usuarioId, @Param("cupon") String cupon);

    /**
     * ¿El usuario ya consumió la promo de "10% por 4+ boletas"? Cuenta como consumida
     * si tiene una compra PAGADA con la promo, o una PENDIENTE con reserva vigente
     * (para que no se use dos veces a la vez, pero un carrito abandonado la libere).
     */
    @Query("SELECT COUNT(c) > 0 FROM Compra c WHERE c.usuario.id = :usuarioId AND c.promoParcheAplicada = true "
            + "AND (c.estado = 'PAGADO' OR (c.estado = 'PENDIENTE' AND c.createdAt >= :limiteReserva))")
    boolean existePromoParcheUsada(@Param("usuarioId") Long usuarioId, @Param("limiteReserva") LocalDateTime limiteReserva);

    /** Conveniencia: ¿el usuario ya usó la promo (con la ventana de reserva estándar)? */
    default boolean usuarioYaUsoPromoParche(Long usuarioId) {
        return existePromoParcheUsada(usuarioId, LocalDateTime.now().minusMinutes(MINUTOS_RESERVA));
    }
}

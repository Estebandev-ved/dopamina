package com.dopaminacrew.backend.scheduler;

import com.dopaminacrew.backend.repository.CompraRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Tarea programada que libera las compras pendientes abandonadas.
 *
 * Cuando un usuario inicia el pago pero se sale de la pasarela, la compra queda
 * en estado PENDIENTE. Pasada la ventana de reserva (CompraRepository.MINUTOS_RESERVA),
 * esa compra ya no debe retener cupo ni aparecer como activa: se marca como EXPIRADO.
 *
 * Esto mantiene el aforo y el cupo de preventa exactos y evita acumular pendientes
 * "fantasma" en el listado de administración.
 */
@Component
public class CompraCleanupScheduler {

    private final CompraRepository compraRepository;

    public CompraCleanupScheduler(CompraRepository compraRepository) {
        this.compraRepository = compraRepository;
    }

    /**
     * Se ejecuta cada 10 minutos. Marca como EXPIRADO las compras que llevan
     * PENDIENTE más tiempo que la ventana de reserva.
     */
    @Scheduled(fixedRate = 600_000L)
    @Transactional
    public void expirarComprasPendientes() {
        LocalDateTime limite = LocalDateTime.now().minusMinutes(CompraRepository.MINUTOS_RESERVA);
        int expiradas = compraRepository.expirarPendientesAntiguas(limite);
        if (expiradas > 0) {
            System.out.println("[CompraCleanup] Compras pendientes expiradas: " + expiradas);
        }
    }
}

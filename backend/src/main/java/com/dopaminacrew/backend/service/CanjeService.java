package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.model.Canje;
import java.util.List;

/**
 * Service interface for handling reward redemption logic.
 * Security Note:
 * - Ensures inputs are authenticated before allowing redemption state updates or user-specific retrieval.
 */
public interface CanjeService {

    Canje registrarCanje(Long usuarioId, String premioId, String premioTitulo, Integer costoPuntos);

    List<Canje> getCanjesUsuario(Long usuarioId);

    List<Canje> getTodosCanjes();

    Canje actualizarEstadoCanje(Long canjeId, String estado);

    Integer getPuntosDisponibles(Long usuarioId);
}

package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.dto.GastoEventoRequest;
import com.dopaminacrew.backend.dto.GastoEventoResponse;
import java.util.List;

public interface GastoEventoService {
    List<GastoEventoResponse> getGastosByEvento(Long eventoId);
    GastoEventoResponse crearGasto(Long eventoId, GastoEventoRequest req);
    GastoEventoResponse actualizarGasto(Long eventoId, Long gastoId, GastoEventoRequest req);
    void eliminarGasto(Long eventoId, Long gastoId);
    void copiarGastos(Long eventoOrigenId, Long eventoDestinoId);
}

package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.dto.GastoEventoRequest;
import com.dopaminacrew.backend.dto.GastoEventoResponse;
import com.dopaminacrew.backend.model.GastoEvento;
import com.dopaminacrew.backend.repository.GastoEventoRepository;
import com.dopaminacrew.backend.service.GastoEventoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GastoEventoServiceImpl implements GastoEventoService {

    @Autowired
    private GastoEventoRepository gastoEventoRepository;

    @Override
    public List<GastoEventoResponse> getGastosByEvento(Long eventoId) {
        return gastoEventoRepository.findByEventoIdOrderByCreatedAtAsc(eventoId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public GastoEventoResponse crearGasto(Long eventoId, GastoEventoRequest req) {
        GastoEvento g = new GastoEvento();
        g.setEventoId(eventoId);
        mapFromRequest(req, g);
        return toResponse(gastoEventoRepository.save(g));
    }

    @Override
    public GastoEventoResponse actualizarGasto(Long eventoId, Long gastoId, GastoEventoRequest req) {
        GastoEvento g = gastoEventoRepository.findById(gastoId)
                .orElseThrow(() -> new RuntimeException("Gasto no encontrado con id: " + gastoId));
        if (!g.getEventoId().equals(eventoId)) {
            throw new RuntimeException("El gasto no pertenece a este evento");
        }
        mapFromRequest(req, g);
        return toResponse(gastoEventoRepository.save(g));
    }

    @Override
    @Transactional
    public void eliminarGasto(Long eventoId, Long gastoId) {
        GastoEvento g = gastoEventoRepository.findById(gastoId)
                .orElseThrow(() -> new RuntimeException("Gasto no encontrado con id: " + gastoId));
        if (!g.getEventoId().equals(eventoId)) {
            throw new RuntimeException("El gasto no pertenece a este evento");
        }
        gastoEventoRepository.deleteById(gastoId);
    }

    @Override
    @Transactional
    public void copiarGastos(Long eventoOrigenId, Long eventoDestinoId) {
        List<GastoEvento> gastosOrigen = gastoEventoRepository.findByEventoIdOrderByCreatedAtAsc(eventoOrigenId);
        for (GastoEvento g : gastosOrigen) {
            GastoEvento copia = new GastoEvento();
            copia.setEventoId(eventoDestinoId);
            copia.setItem(g.getItem());
            copia.setValorTotal(g.getValorTotal());
            copia.setPagado(BigDecimal.ZERO);
            copia.setEstado("Pendiente");
            gastoEventoRepository.save(copia);
        }
    }

    // ── Helpers ──

    private void mapFromRequest(GastoEventoRequest req, GastoEvento g) {
        g.setItem(req.getItem());
        g.setValorTotal(req.getValorTotal() != null ? req.getValorTotal() : BigDecimal.ZERO);
        g.setPagado(req.getPagado() != null ? req.getPagado() : BigDecimal.ZERO);
        g.setEstado(req.getEstado() != null ? req.getEstado() : "Pendiente");
    }

    private GastoEventoResponse toResponse(GastoEvento g) {
        return new GastoEventoResponse(
                g.getId(),
                g.getEventoId(),
                g.getItem(),
                g.getValorTotal(),
                g.getPagado(),
                g.getEstado(),
                g.getCreatedAt() != null ? g.getCreatedAt().toString() : null
        );
    }
}

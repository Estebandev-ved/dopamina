package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.dto.EventoRequest;
import com.dopaminacrew.backend.dto.EventoResponse;
import com.dopaminacrew.backend.model.Evento;
import com.dopaminacrew.backend.repository.EventoRepository;
import com.dopaminacrew.backend.repository.CompraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * EventoService implementation.
 * Security Notes:
 * - All DB access via JPA parameterized queries (no raw SQL).
 * - Public endpoints only expose active/upcoming events.
 * - Create/Update/Delete restricted to ROLE_ADMIN at controller layer.
 */
@Service
public class EventoServiceImpl {

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private CompraRepository compraRepository;

    // ── Public ────────────────────────────────────────────────────────────────

    public List<EventoResponse> getProximosEventos() {
        return eventoRepository
                .findByActivoTrueAndFechaGreaterThanEqualOrderByFechaAsc(LocalDate.now())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<EventoResponse> getEventosDestacados() {
        return eventoRepository
                .findByActivoTrueAndDestacadoTrueOrderByFechaAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public EventoResponse getEventoById(Long id) {
        Evento e = eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado con id: " + id));
        return toResponse(e);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    public List<EventoResponse> getAllEventosAdmin() {
        return eventoRepository.findAllByOrderByFechaAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public EventoResponse crearEvento(EventoRequest req) {
        Evento e = new Evento();
        mapFromRequest(req, e);
        return toResponse(eventoRepository.save(e));
    }

    public EventoResponse actualizarEvento(Long id, EventoRequest req) {
        Evento e = eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado con id: " + id));
        mapFromRequest(req, e);
        return toResponse(eventoRepository.save(e));
    }

    public void eliminarEvento(Long id) {
        eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado con id: " + id));
        eventoRepository.deleteById(id);
    }

    public EventoResponse toggleActivo(Long id) {
        Evento e = eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado con id: " + id));
        e.setActivo(!e.getActivo());
        return toResponse(eventoRepository.save(e));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void mapFromRequest(EventoRequest req, Evento e) {
        e.setNombre(req.getNombre());
        e.setDescripcion(req.getDescripcion());
        e.setFecha(LocalDate.parse(req.getFecha()));
        e.setHora(LocalTime.parse(req.getHora()));
        e.setLugar(req.getLugar());
        e.setCiudad(req.getCiudad() != null ? req.getCiudad() : "Medellín");
        e.setPrecio(req.getPrecio() != null ? req.getPrecio() : BigDecimal.ZERO);
        // Preventa: solo se activa si hay precio y cantidad (> 0); si no, se limpia.
        if (req.getPrecioPreventa() != null && req.getCantidadPreventa() != null
                && req.getCantidadPreventa() > 0) {
            e.setPrecioPreventa(req.getPrecioPreventa());
            e.setCantidadPreventa(req.getCantidadPreventa());
        } else {
            e.setPrecioPreventa(null);
            e.setCantidadPreventa(null);
        }
        e.setCapacidad(req.getCapacidad() != null ? req.getCapacidad() : 100);
        e.setImagenUrl(req.getImagenUrl());
        e.setLineup(req.getLineup());
        e.setActivo(req.getActivo() != null ? req.getActivo() : true);
        e.setDestacado(req.getDestacado() != null ? req.getDestacado() : false);
    }

    private EventoResponse toResponse(Evento e) {
        // Entradas ocupadas (pagadas + reservas vigentes): cifra usada para el cupo de preventa.
        int vendidas = compraRepository.contarEntradasOcupadas(e.getId());
        return new EventoResponse(
                e.getId(),
                e.getNombre(),
                e.getDescripcion(),
                e.getFecha() != null ? e.getFecha().toString() : null,
                e.getHora() != null ? e.getHora().toString() : null,
                e.getLugar(),
                e.getCiudad(),
                e.getPrecio() != null ? e.getPrecio().doubleValue() : 0.0,
                e.getPrecioPreventa() != null ? e.getPrecioPreventa().doubleValue() : null,
                e.getCantidadPreventa(),
                vendidas,
                e.getCapacidad(),
                e.getImagenUrl(),
                e.getLineup(),
                e.getActivo(),
                e.getDestacado(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null
        );
    }
}

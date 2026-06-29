package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.dto.SugerenciaResponse;
import com.dopaminacrew.backend.model.Sugerencia;
import com.dopaminacrew.backend.repository.SugerenciaRepository;
import com.dopaminacrew.backend.service.SugerenciaService;
import com.dopaminacrew.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SugerenciaServiceImpl implements SugerenciaService {

    @Autowired
    private SugerenciaRepository sugerenciaRepository;

    @Autowired
    private EmailService emailService;

    @Override
    @Transactional
    public SugerenciaResponse crearSugerencia(String contenido, String nombre, String email) {
        Sugerencia sugerencia = new Sugerencia();
        sugerencia.setContenido(contenido);
        sugerencia.setNombre(nombre);
        sugerencia.setEmail(email);
        sugerencia.setEstado("PENDIENTE");
        Sugerencia saved = sugerenciaRepository.save(sugerencia);
        emailService.sendSuggestionReceived(nombre, email, contenido);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SugerenciaResponse> getTodasSugerencias() {
        return sugerenciaRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SugerenciaResponse actualizarEstado(Long id, String estado) {
        Sugerencia sugerencia = sugerenciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sugerencia no encontrada con id: " + id));
        sugerencia.setEstado(estado);
        return toResponse(sugerenciaRepository.save(sugerencia));
    }

    private SugerenciaResponse toResponse(Sugerencia s) {
        return new SugerenciaResponse(
                s.getId(),
                s.getContenido(),
                s.getNombre(),
                s.getEmail(),
                s.getEstado(),
                s.getCreatedAt() != null ? s.getCreatedAt().toString() : null
        );
    }
}

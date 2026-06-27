package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.dto.ArtistaRequest;
import com.dopaminacrew.backend.dto.ArtistaResponse;
import com.dopaminacrew.backend.model.Artista;
import com.dopaminacrew.backend.repository.ArtistaRepository;
import com.dopaminacrew.backend.service.ArtistaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for handling Artist database CRUD operations and mappings.
 */
@Service
public class ArtistaServiceImpl implements ArtistaService {

    @Autowired
    private ArtistaRepository artistaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ArtistaResponse> getArtistasPublicos() {
        return artistaRepository.findAllByOrderByNombreAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArtistaResponse> getAllArtistasAdmin() {
        return artistaRepository.findAllByOrderByNombreAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ArtistaResponse crearArtista(ArtistaRequest request) {
        Artista artista = new Artista();
        mapFromRequest(request, artista);
        return toResponse(artistaRepository.save(artista));
    }

    @Override
    @Transactional
    public ArtistaResponse actualizarArtista(Long id, ArtistaRequest request) {
        Artista artista = artistaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artista no encontrado con id: " + id));
        mapFromRequest(request, artista);
        return toResponse(artistaRepository.save(artista));
    }

    @Override
    @Transactional
    public void eliminarArtista(Long id) {
        Artista artista = artistaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artista no encontrado con id: " + id));
        artistaRepository.delete(artista);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void mapFromRequest(ArtistaRequest req, Artista e) {
        e.setNombre(req.getNombre());
        e.setGenero(req.getGenero());
        e.setBio(req.getBio());
        e.setImagenUrl(req.getImagenUrl());
        e.setInstagramUrl(req.getInstagramUrl());
        e.setSoundcloudUrl(req.getSoundcloudUrl());
        e.setLocal(req.getLocal() != null ? req.getLocal() : true);
    }

    private ArtistaResponse toResponse(Artista e) {
        return new ArtistaResponse(
                e.getId(),
                e.getNombre(),
                e.getGenero(),
                e.getBio(),
                e.getImagenUrl(),
                e.getInstagramUrl(),
                e.getSoundcloudUrl(),
                e.getLocal(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}

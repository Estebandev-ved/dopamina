package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.dto.ArtistaRequest;
import com.dopaminacrew.backend.dto.ArtistaResponse;
import java.util.List;

/**
 * Service interface for handling Artist CRUD operations.
 */
public interface ArtistaService {

    List<ArtistaResponse> getArtistasPublicos();

    List<ArtistaResponse> getAllArtistasAdmin();

    ArtistaResponse crearArtista(ArtistaRequest request);

    ArtistaResponse actualizarArtista(Long id, ArtistaRequest request);

    void eliminarArtista(Long id);
}

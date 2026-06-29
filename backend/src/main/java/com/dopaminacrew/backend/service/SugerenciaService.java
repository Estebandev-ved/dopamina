package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.dto.SugerenciaResponse;
import java.util.List;

public interface SugerenciaService {

    SugerenciaResponse crearSugerencia(String contenido, String nombre, String email);

    List<SugerenciaResponse> getTodasSugerencias();

    SugerenciaResponse actualizarEstado(Long id, String estado);
}

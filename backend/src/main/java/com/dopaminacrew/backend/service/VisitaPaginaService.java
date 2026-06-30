package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.model.VisitaPagina;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

public interface VisitaPaginaService {

    VisitaPagina registrarVisita(String pagina, String titulo, Long usuarioId, HttpServletRequest request);

    List<VisitaPagina> obtenerTodas();

    long contarVisitasHoy();

    long contarVisitasTotales();

    long contarAutenticados();

    long contarAnonimos();

    List<Object[]> contarPorPagina();

    List<Object[]> contarPorDia();
}

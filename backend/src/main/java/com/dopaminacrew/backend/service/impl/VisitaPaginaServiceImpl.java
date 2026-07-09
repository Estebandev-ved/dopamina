package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.model.VisitaPagina;
import com.dopaminacrew.backend.repository.UserRepository;
import com.dopaminacrew.backend.repository.VisitaPaginaRepository;
import com.dopaminacrew.backend.service.VisitaPaginaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class VisitaPaginaServiceImpl implements VisitaPaginaService {

    @Autowired
    private VisitaPaginaRepository visitaPaginaRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public VisitaPagina registrarVisita(String pagina, String titulo, Long usuarioId, HttpServletRequest request) {
        VisitaPagina visita = new VisitaPagina();
        visita.setPagina(pagina);
        visita.setTitulo(titulo);

        if (usuarioId != null) {
            userRepository.findById(usuarioId).ifPresent(visita::setUsuario);
        }

        if (request != null) {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank()) {
                ip = request.getRemoteAddr();
            }
            visita.setIpAddress(ip);
            
            String ua = request.getHeader("User-Agent");
            if (ua != null && ua.length() > 500) {
                ua = ua.substring(0, 500);
            }
            visita.setUserAgent(ua);
            
            String ref = request.getHeader("Referer");
            if (ref != null && ref.length() > 500) {
                ref = ref.substring(0, 500);
            }
            visita.setReferrer(ref);
        }

        return visitaPaginaRepository.save(visita);
    }

    @Override
    public List<VisitaPagina> obtenerTodas() {
        return visitaPaginaRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public long contarVisitasHoy() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
        return visitaPaginaRepository.countByCreatedAtAfter(startOfDay);
    }

    @Override
    public long contarVisitasTotales() {
        return visitaPaginaRepository.count();
    }

    @Override
    public long contarAutenticados() {
        return visitaPaginaRepository.countAuthenticated();
    }

    @Override
    public long contarAnonimos() {
        return visitaPaginaRepository.countAnonymous();
    }

    @Override
    public List<Object[]> contarPorPagina() {
        return visitaPaginaRepository.countByPagina();
    }

    @Override
    public List<Object[]> contarPorDia() {
        return visitaPaginaRepository.countByDay();
    }
}

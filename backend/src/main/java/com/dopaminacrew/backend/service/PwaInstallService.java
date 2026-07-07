package com.dopaminacrew.backend.service;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

public interface PwaInstallService {

    void registrarInstall(String platform, HttpServletRequest request);

    long contarInstallsTotales();

    long contarInstallsHoy();

    long contarInstallsUltimos30Dias();

    Map<String, Long> contarPorPlataforma();
}

package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.model.PwaInstall;
import com.dopaminacrew.backend.repository.PwaInstallRepository;
import com.dopaminacrew.backend.service.PwaInstallService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class PwaInstallServiceImpl implements PwaInstallService {

    @Autowired
    private PwaInstallRepository pwaInstallRepository;

    @Override
    public void registrarInstall(String platform, HttpServletRequest request) {
        PwaInstall install = new PwaInstall();
        install.setPlatform(platform != null ? platform : "unknown");

        if (request != null) {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank()) {
                ip = request.getRemoteAddr();
            }
            install.setIpAddress(ip);
            install.setUserAgent(request.getHeader("User-Agent"));
        }

        pwaInstallRepository.save(install);
    }

    @Override
    public long contarInstallsTotales() {
        return pwaInstallRepository.count();
    }

    @Override
    public long contarInstallsHoy() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
        return pwaInstallRepository.countByCreatedAtAfter(startOfDay);
    }

    @Override
    public long contarInstallsUltimos30Dias() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return pwaInstallRepository.countByCreatedAtAfter(thirtyDaysAgo);
    }

    @Override
    public Map<String, Long> contarPorPlataforma() {
        Map<String, Long> result = new HashMap<>();
        for (Object[] row : pwaInstallRepository.countByPlatform()) {
            result.put((String) row[0], (Long) row[1]);
        }
        return result;
    }
}

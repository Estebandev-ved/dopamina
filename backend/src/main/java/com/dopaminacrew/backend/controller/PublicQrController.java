package com.dopaminacrew.backend.controller;

import com.dopaminacrew.backend.repository.BoletaRepository;
import com.dopaminacrew.backend.util.QrCodeGenerator;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/**
 * Endpoint público que devuelve el código QR de una boleta como imagen PNG.
 * Se usa para incrustar el QR (<img src>) en el correo de confirmación, de
 * modo que el cliente vea su boleta directamente en el correo.
 *
 * Seguridad: solo genera la imagen si el código corresponde a una boleta real.
 * El código QR ya es el "secreto" de la boleta (mismo valor que se muestra en
 * la cuenta), así que no expone información nueva.
 */
@RestController
@RequestMapping("/api/public")
public class PublicQrController {

    private final BoletaRepository boletaRepository;

    public PublicQrController(BoletaRepository boletaRepository) {
        this.boletaRepository = boletaRepository;
    }

    @GetMapping("/qr")
    public ResponseEntity<byte[]> getQrImage(@RequestParam("code") String code) {
        if (code == null || code.isBlank() || boletaRepository.findByCodigoQr(code.trim()).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        byte[] png = QrCodeGenerator.generatePng(code.trim(), 480);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                .body(png);
    }
}

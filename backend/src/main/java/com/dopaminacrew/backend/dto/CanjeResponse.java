package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for sending redemption details to the client.
 * Security Note:
 * - Sanitizes response to avoid leaking raw database columns or sensitive user properties.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CanjeResponse {
    private Long id;
    private String usuarioNombre;
    private String usuarioEmail;
    private String premioId;
    private String premioTitulo;
    private String codigoCanje;
    private Integer costoPuntos;
    private String estado;
    private String createdAt;
}

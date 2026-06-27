package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO representing a transfer audit log response.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferenciaLogResponse {
    private Long id;
    private Long boletaId;
    private String eventoNombre;
    private String usuarioOrigenNombre;
    private String usuarioOrigenEmail;
    private String usuarioDestinoNombre;
    private String usuarioDestinoEmail;
    private String codigoQrAnterior;
    private String codigoQrNuevo;
    private LocalDateTime fechaTransferencia;
}

package com.dopaminacrew.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO representing checkout ticket booking payload.
 * Security Note: Quantity validation ensures no buffer overflows or invalid values are processed.
 */
@Data
public class CheckoutRequest {

    @NotNull(message = "La cantidad es requerida")
    @Min(value = 1, message = "La cantidad mínima a comprar es 1 boleta")
    private Integer cantidad;

    private String codigoCupon;

    private Long eventoId;
}

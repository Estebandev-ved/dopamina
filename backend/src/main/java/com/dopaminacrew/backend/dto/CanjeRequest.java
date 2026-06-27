package com.dopaminacrew.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing a user request to redeem a loyalty reward.
 * Security Note:
 * - Employs Jakarta Validation annotations to prevent empty/negative parameters.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CanjeRequest {

    @NotBlank(message = "El ID del premio es obligatorio.")
    private String premioId;

    @NotBlank(message = "El título del premio es obligatorio.")
    private String premioTitulo;

    @NotNull(message = "El costo en puntos es obligatorio.")
    @Min(value = 1, message = "El costo en puntos debe ser al menos 1.")
    private Integer costoPuntos;
}

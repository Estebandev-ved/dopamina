package com.dopaminacrew.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
public class GastoEventoRequest {

    @NotBlank(message = "El nombre del item es obligatorio")
    @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
    private String item;

    @NotNull(message = "El valor total es obligatorio")
    @DecimalMin(value = "0.0", message = "El valor total no puede ser negativo")
    private BigDecimal valorTotal;

    @DecimalMin(value = "0.0", message = "El pagado no puede ser negativo")
    private BigDecimal pagado;

    @Size(max = 20, message = "El estado no puede exceder 20 caracteres")
    private String estado;
}

package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GastoEventoResponse {
    private Long id;
    private Long eventoId;
    private String item;
    private BigDecimal valorTotal;
    private BigDecimal pagado;
    private String estado;
    private String createdAt;
}

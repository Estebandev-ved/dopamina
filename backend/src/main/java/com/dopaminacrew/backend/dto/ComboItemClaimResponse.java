package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComboItemClaimResponse {
    private Long id;
    private String itemNombre;
    private Boolean reclamado;
    private String reclamadoPorNombre;
    private LocalDateTime reclamadoAt;
}

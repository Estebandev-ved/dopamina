package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SugerenciaResponse {
    private Long id;
    private String contenido;
    private String nombre;
    private String email;
    private String estado;
    private String createdAt;
}

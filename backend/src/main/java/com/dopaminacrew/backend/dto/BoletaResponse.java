package com.dopaminacrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class BoletaResponse {
    private Long id;
    private Long compraId;
    private String eventoNombre;
    private String eventoFecha;
    private String eventoHora;
    private String eventoLugar;
    private String eventoCiudad;
    private String codigoQr;
    private String estado;
    private LocalDateTime createdAt;
    private String usuarioNombre;
    private Integer numeroSorteo;
    private String comboNombre;
    private String comboItems;
    private Boolean requiereVerificacionCumple = false;
    private List<ComboItemClaimResponse> comboItemClaims = new ArrayList<>();

    public BoletaResponse(Long id, String eventoNombre, String eventoFecha, String eventoHora,
                          String eventoLugar, String eventoCiudad, String codigoQr, String estado,
                          LocalDateTime createdAt, String usuarioNombre, Integer numeroSorteo,
                          String comboNombre, String comboItems, Boolean requiereVerificacionCumple) {
        this.id = id;
        this.eventoNombre = eventoNombre;
        this.eventoFecha = eventoFecha;
        this.eventoHora = eventoHora;
        this.eventoLugar = eventoLugar;
        this.eventoCiudad = eventoCiudad;
        this.codigoQr = codigoQr;
        this.estado = estado;
        this.createdAt = createdAt;
        this.usuarioNombre = usuarioNombre;
        this.numeroSorteo = numeroSorteo;
        this.comboNombre = comboNombre;
        this.comboItems = comboItems;
        this.requiereVerificacionCumple = requiereVerificacionCumple;
        this.comboItemClaims = new ArrayList<>();
    }
}

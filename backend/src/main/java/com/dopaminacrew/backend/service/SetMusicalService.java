package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.dto.SetMusicalRequest;
import com.dopaminacrew.backend.dto.SetMusicalResponse;
import java.util.List;

public interface SetMusicalService {
    List<SetMusicalResponse> getSetsPublicos();
    List<SetMusicalResponse> getSetsPorGenero(String genero);
    List<SetMusicalResponse> getAllSetsAdmin();
    SetMusicalResponse crearSet(SetMusicalRequest request);
    SetMusicalResponse actualizarSet(Long id, SetMusicalRequest request);
    void eliminarSet(Long id);
}

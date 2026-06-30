package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.dto.SetMusicalRequest;
import com.dopaminacrew.backend.dto.SetMusicalResponse;
import com.dopaminacrew.backend.model.SetMusical;
import com.dopaminacrew.backend.repository.SetMusicalRepository;
import com.dopaminacrew.backend.service.SetMusicalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SetMusicalServiceImpl implements SetMusicalService {

    @Autowired
    private SetMusicalRepository setMusicalRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SetMusicalResponse> getSetsPublicos() {
        return setMusicalRepository.findByActivoTrueOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SetMusicalResponse> getSetsPorGenero(String genero) {
        return setMusicalRepository.findByActivoTrueAndGeneroIgnoreCaseOrderByCreatedAtDesc(genero)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SetMusicalResponse> getAllSetsAdmin() {
        return setMusicalRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SetMusicalResponse crearSet(SetMusicalRequest request) {
        SetMusical set = new SetMusical();
        mapFromRequest(request, set);
        return toResponse(setMusicalRepository.save(set));
    }

    @Override
    @Transactional
    public SetMusicalResponse actualizarSet(Long id, SetMusicalRequest request) {
        SetMusical set = setMusicalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Set musical no encontrado con id: " + id));
        mapFromRequest(request, set);
        return toResponse(setMusicalRepository.save(set));
    }

    @Override
    @Transactional
    public void eliminarSet(Long id) {
        SetMusical set = setMusicalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Set musical no encontrado con id: " + id));
        setMusicalRepository.delete(set);
    }

    private void mapFromRequest(SetMusicalRequest req, SetMusical e) {
        e.setTitulo(req.getTitulo());
        e.setArtista(req.getArtista());
        e.setYoutubeUrl(req.getYoutubeUrl());
        e.setGenero(req.getGenero());
        e.setDescripcion(req.getDescripcion());
        e.setImagenUrl(req.getImagenUrl());
        e.setActivo(req.getActivo() != null ? req.getActivo() : true);
    }

    private SetMusicalResponse toResponse(SetMusical e) {
        return new SetMusicalResponse(
                e.getId(),
                e.getTitulo(),
                e.getArtista(),
                e.getYoutubeUrl(),
                e.getGenero(),
                e.getDescripcion(),
                e.getImagenUrl(),
                e.getActivo(),
                e.getCreatedAt()
        );
    }
}

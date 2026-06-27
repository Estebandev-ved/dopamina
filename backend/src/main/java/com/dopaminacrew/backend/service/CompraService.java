package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.dto.CheckoutRequest;
import com.dopaminacrew.backend.model.Compra;
import java.util.List;

/**
 * Service interface handling ticket checkout business rules.
 */
public interface CompraService {
    
    Compra processCheckout(CheckoutRequest request, Long userId);
    
    List<Compra> getMisBoletas(Long userId);
}

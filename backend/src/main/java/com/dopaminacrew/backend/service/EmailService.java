package com.dopaminacrew.backend.service;

import com.dopaminacrew.backend.model.Boleta;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.ReporteSeguridad;
import com.dopaminacrew.backend.model.User;

import java.util.List;

public interface EmailService {

    void sendWelcomeEmail(User user);

    void sendPurchaseConfirmation(Compra compra, List<Boleta> boletas);

    void sendSecurityAlert(ReporteSeguridad reporte);

    void sendRewardConfirmation(User user, String premioTitulo, String codigoCanje);

    void sendTicketTransferNotification(User origen, User destino, String boletaRef, String eventoNombre);

    void sendSuggestionReceived(String nombre, String email, String contenido);

    void sendManualCustomEmail(String to, String subject, String bodyText);
}

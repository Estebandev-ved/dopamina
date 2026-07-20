package com.dopaminacrew.backend.service.impl;

import com.dopaminacrew.backend.model.Boleta;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.Evento;
import com.dopaminacrew.backend.model.ReporteSeguridad;
import com.dopaminacrew.backend.model.User;
import com.dopaminacrew.backend.service.EmailService;
import com.dopaminacrew.backend.util.TicketPdfGenerator;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.Attachment;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

@Service
public class EmailServiceImpl implements EmailService {

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.admin-email}")
    private String adminEmail;

    @Value("${resend.from.general}")
    private String fromGeneral;

    @Value("${resend.from.facturas}")
    private String fromFacturas;

    @Value("${resend.from.seguridad}")
    private String fromSeguridad;

    @Value("${resend.test-mode}")
    private boolean testMode;

    @Value("${resend.test-email}")
    private String testEmail;

    @Value("${efipay.redirect-base-url}")
    private String frontendUrl;

    @Value("${efipay.backend-base-url}")
    private String backendBaseUrl;

    private static final Locale ES = new Locale("es", "CO");
    private static final DateTimeFormatter FECHA_FMT =
            DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", ES);
    private static final DateTimeFormatter HORA_FMT =
            DateTimeFormatter.ofPattern("h:mm a", ES);

    private Resend resend;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isBlank() && !apiKey.equals("YOUR_RESEND_API_KEY")) {
            this.resend = new Resend(apiKey);
        } else {
            this.resend = null;
        }
    }

    private boolean isAvailable() {
        return resend != null;
    }

    private void sendSafe(String from, String to, String subject, String html) {
        sendSafe(from, to, subject, html, null);
    }

    private void sendSafe(String from, String to, String subject, String html, List<Attachment> attachments) {
        if (!isAvailable()) return;
        String recipient = testMode ? testEmail : to;
        String tag = testMode ? "[PRUEBA → " + to + "] " : "";
        try {
            CreateEmailOptions.Builder builder = CreateEmailOptions.builder()
                    .from(from)
                    .to(recipient)
                    .subject(tag + subject)
                    .html(html);
            if (attachments != null && !attachments.isEmpty()) {
                builder.attachments(attachments);
            }
            CreateEmailResponse response = resend.emails().send(builder.build());
            System.out.println("Email sent to " + recipient + (testMode ? " (redirected from " + to + ")" : "") + " | ID: " + response.getId());
        } catch (ResendException e) {
            System.err.println("Failed to send email to " + recipient + ": " + e.getMessage());
        }
    }

    @Override
    public void sendWelcomeEmail(User user) {
        String html = """
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; padding: 40px; border-radius: 16px; border: 1px solid #222;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #B14EFF; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: 2px;">DOPAMINA</h1>
                    <p style="color: #666; font-size: 12px; letter-spacing: 1px;">CREW</p>
                </div>
                <h2 style="color: #F2F0F5; font-size: 20px; margin-bottom: 16px;">¡Bienvenido a la familia, %s!</h2>
                <p style="color: #9A9A9A; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                    Tu cuenta ha sido creada con éxito. Ya puedes adquirir tus boletas para los próximos eventos, acumular puntos y canjear premios exclusivos.
                </p>
                <div style="background: #18181F; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #9A9A9A; font-size: 13px; margin: 0 0 8px;">Tu correo registrado:</p>
                    <p style="color: #F2F0F5; font-size: 15px; font-weight: 700; margin: 0;">%s</p>
                </div>
                <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #222;">
                    <p style="color: #555; font-size: 12px;">Dopamina Crew — Underground Music & Culture</p>
                </div>
            </div>
        """.formatted(user.getNombre(), user.getEmail());

        sendSafe(fromGeneral, user.getEmail(), "Bienvenido a Dopamina Crew", html);
    }

    @Override
    public void sendPurchaseConfirmation(Compra compra, List<Boleta> boletas) {
        User user = compra.getUsuario();
        Evento ev = compra.getEvento();
        String eventoNombre = ev != null ? ev.getNombre() : "Evento Dopamina Crew";
        String fecha = ev != null && ev.getFecha() != null
                ? capitalize(ev.getFecha().format(FECHA_FMT)) : "Por confirmar";
        String hora = ev != null && ev.getHora() != null
                ? ev.getHora().format(HORA_FMT).toUpperCase(ES) : "Por confirmar";
        String lugar = ev != null
                ? safe(ev.getLugar()) + (ev.getCiudad() != null ? ", " + ev.getCiudad() : "")
                : "Por confirmar";

        // Tarjeta-boleta por cada entrada, con su QR incrustado (imagen remota servida
        // por el endpoint público /api/public/qr). Así el cliente ve la boleta en el correo.
        StringBuilder ticketsHtml = new StringBuilder();
        int total = boletas != null ? boletas.size() : 0;
        for (int i = 0; boletas != null && i < total; i++) {
            Boleta b = boletas.get(i);
            String qrUrl = backendBaseUrl + "/api/public/qr?code="
                    + URLEncoder.encode(b.getCodigoQr(), StandardCharsets.UTF_8);
            String sorteo = b.getNumeroSorteo() != null ? " · N° sorteo " + b.getNumeroSorteo() : "";
            ticketsHtml.append("""
                <div style="background:#111118;border:1px solid #2A2A38;border-radius:14px;padding:24px;margin-bottom:16px;text-align:center;">
                    <p style="color:#B14EFF;font-size:12px;font-weight:800;letter-spacing:1px;margin:0 0 4px;">ENTRADA %d DE %d%s</p>
                    <p style="color:#F2F0F5;font-size:15px;font-weight:700;margin:0 0 16px;">%s</p>
                    <img src="%s" alt="Código QR de tu boleta" width="200" height="200" style="width:200px;height:200px;background:#fff;padding:10px;border-radius:12px;" />
                    <p style="color:#666;font-size:11px;font-family:monospace;margin:12px 0 0;word-break:break-all;">%s</p>
                </div>
            """.formatted(i + 1, total, sorteo, eventoNombre, qrUrl, b.getCodigoQr()));
        }

        String html = """
            <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0A0A0F;padding:40px;border-radius:16px;border:1px solid #222;">
                <div style="text-align:center;margin-bottom:28px;">
                    <h1 style="color:#B14EFF;font-size:28px;font-weight:900;margin:0;letter-spacing:2px;">DOPAMINA</h1>
                    <p style="color:#666;font-size:12px;letter-spacing:1px;margin:2px 0 0;">CREW</p>
                </div>
                <h2 style="color:#F2F0F5;font-size:20px;margin:0 0 12px;text-align:center;">🎟️ ¡Tu boleta está lista!</h2>
                <p style="color:#9A9A9A;font-size:14px;line-height:1.6;margin:0 0 24px;text-align:center;">
                    Hola <strong style="color:#F2F0F5;">%s</strong>, tu compra fue confirmada. Aquí tienes tu %s. También la adjuntamos en PDF para que la descargues o imprimas.
                </p>
                <div style="background:#18181F;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:24px;">
                    <table style="width:100%%;border-collapse:collapse;">
                        <tr><td style="color:#666;font-size:12px;padding:6px 0;">Evento</td><td style="color:#F2F0F5;font-size:14px;font-weight:700;text-align:right;">%s</td></tr>
                        <tr><td style="color:#666;font-size:12px;padding:6px 0;">Fecha</td><td style="color:#F2F0F5;font-size:14px;font-weight:700;text-align:right;">%s</td></tr>
                        <tr><td style="color:#666;font-size:12px;padding:6px 0;">Hora</td><td style="color:#F2F0F5;font-size:14px;font-weight:700;text-align:right;">%s</td></tr>
                        <tr><td style="color:#666;font-size:12px;padding:6px 0;">Lugar</td><td style="color:#F2F0F5;font-size:14px;font-weight:700;text-align:right;">%s</td></tr>
                        <tr><td style="color:#666;font-size:12px;padding:6px 0;">Total</td><td style="color:#4ade80;font-size:14px;font-weight:700;text-align:right;">$%,.0f COP</td></tr>
                    </table>
                </div>
                %s
                <p style="color:#9A9A9A;font-size:13px;line-height:1.5;text-align:center;">
                    Presenta el código QR en la entrada del evento. Si no ves las imágenes, abre el PDF adjunto o revisa tus boletas en tu cuenta.
                </p>
                <div style="text-align:center;margin-top:24px;">
                    <a href="%s/dashboard" style="display:inline-block;background:#B14EFF;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:14px;">Ver mis boletas</a>
                </div>
                <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #222;">
                    <p style="color:#555;font-size:12px;">Dopamina Crew — Boletería oficial</p>
                </div>
            </div>
        """.formatted(
                user.getNombre(),
                total == 1 ? "boleta" : "boletas (" + total + ")",
                eventoNombre, fecha, hora, lugar, compra.getTotal(),
                ticketsHtml.toString(), frontendUrl);

        // PDF adjunto con todas las boletas
        List<Attachment> attachments = null;
        try {
            if (boletas != null && !boletas.isEmpty()) {
                byte[] pdf = TicketPdfGenerator.generate(compra, boletas);
                Attachment pdfAtt = Attachment.builder()
                        .fileName("Boletas-Dopamina.pdf")
                        .content(Base64.getEncoder().encodeToString(pdf))
                        .build();
                attachments = List.of(pdfAtt);
            }
        } catch (Exception e) {
            System.err.println("No se pudo generar el PDF de boleta, se envía correo sin adjunto: " + e.getMessage());
        }

        sendSafe(fromFacturas, user.getEmail(), "🎟️ Tu boleta — Dopamina Crew", html, attachments);
    }

    private static String safe(String s) {
        return s != null ? s : "";
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase(ES) + s.substring(1);
    }

    @Override
    public void sendSecurityAlert(ReporteSeguridad reporte) {
        String usuario = reporte.getUsuario() != null ? reporte.getUsuario().getNombre() : "Anónimo";
        String html = """
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; padding: 40px; border-radius: 16px; border: 1px solid #ef4444;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <span style="font-size: 48px;">🚨</span>
                </div>
                <h2 style="color: #ef4444; font-size: 20px; margin-bottom: 8px; text-align: center;">Alerta de Seguridad</h2>
                <p style="color: #9A9A9A; font-size: 14px; text-align: center; margin-bottom: 24px;">
                    Se ha reportado un incidente en el evento.
                </p>
                <div style="background: #18181F; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <table style="width: 100%%; border-collapse: collapse;">
                        <tr><td style="color: #666; font-size: 12px; padding: 6px 0;">Tipo</td><td style="color: #F2F0F5; font-size: 14px; font-weight: 700; text-align: right;">%s</td></tr>
                        <tr><td style="color: #666; font-size: 12px; padding: 6px 0;">Ubicación</td><td style="color: #F2F0F5; font-size: 14px; font-weight: 700; text-align: right;">%s</td></tr>
                        <tr><td style="color: #666; font-size: 12px; padding: 6px 0;">Reportado por</td><td style="color: #F2F0F5; font-size: 14px; font-weight: 700; text-align: right;">%s</td></tr>
                    </table>
                </div>
                <div style="background: #0A0A0F; border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #9A9A9A; font-size: 12px; margin: 0 0 8px; font-weight: 600;">DESCRIPCIÓN</p>
                    <p style="color: #F2F0F5; font-size: 14px; margin: 0; line-height: 1.5;">%s</p>
                </div>
                <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #222;">
                    <p style="color: #555; font-size: 12px;">Tribu Seguridad — Dopamina Crew</p>
                </div>
            </div>
        """.formatted(reporte.getTipo(), reporte.getUbicacion(), usuario, reporte.getDescripcion());

        sendSafe(fromSeguridad, adminEmail, "🚨 Alerta de Seguridad — Dopamina Crew", html);
    }

    @Override
    public void sendRewardConfirmation(User user, String premioTitulo, String codigoCanje) {
        String html = """
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; padding: 40px; border-radius: 16px; border: 1px solid #222;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <span style="font-size: 48px;">🎁</span>
                </div>
                <h2 style="color: #F2F0F5; font-size: 20px; margin-bottom: 8px; text-align: center;">¡Premio Reclamado!</h2>
                <p style="color: #9A9A9A; font-size: 14px; text-align: center; margin-bottom: 24px;">
                    Hola <strong style="color: #F2F0F5;">%s</strong>, has canjeado tus puntos con éxito.
                </p>
                <div style="background: #18181F; border: 1px solid #222; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <table style="width: 100%%; border-collapse: collapse;">
                        <tr><td style="color: #666; font-size: 12px; padding: 6px 0;">Premio</td><td style="color: #F2F0F5; font-size: 14px; font-weight: 700; text-align: right;">%s</td></tr>
                        <tr><td style="color: #666; font-size: 12px; padding: 6px 0;">Código de Canje</td><td style="color: #B14EFF; font-size: 14px; font-weight: 700; text-align: right; font-family: monospace;">%s</td></tr>
                    </table>
                </div>
                <p style="color: #9A9A9A; font-size: 13px; text-align: center;">
                    Presenta este código en la barra de canje del evento para recibir tu premio.
                </p>
                <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #222;">
                    <p style="color: #555; font-size: 12px;">Dopamina Crew — Underground Music & Culture</p>
                </div>
            </div>
        """.formatted(user.getNombre(), premioTitulo, codigoCanje);

        sendSafe(fromGeneral, user.getEmail(), "🎁 Premio canjeado — Dopamina Crew", html);
    }

    @Override
    public void sendTicketTransferNotification(User origen, User destino, String boletaRef, String eventoNombre) {
        String htmlOrigen = """
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; padding: 40px; border-radius: 16px; border: 1px solid #222;">
                <h2 style="color: #F2F0F5; font-size: 20px; text-align: center;">📤 Transferencia Enviada</h2>
                <p style="color: #9A9A9A; font-size: 14px; text-align: center;">
                    Has transferido la boleta <strong style="color: #B14EFF;">%s</strong> del evento <strong style="color: #F2F0F5;">%s</strong> a <strong style="color: #F2F0F5;">%s</strong>.
                </p>
                <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #222;">
                    <p style="color: #555; font-size: 12px;">Dopamina Crew</p>
                </div>
            </div>
        """.formatted(boletaRef, eventoNombre, destino.getEmail());

        String htmlDestino = """
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; padding: 40px; border-radius: 16px; border: 1px solid #4ade80;">
                <h2 style="color: #4ade80; font-size: 20px; text-align: center;">🎫 ¡Recibiste una Boleta!</h2>
                <p style="color: #9A9A9A; font-size: 14px; text-align: center;">
                    <strong style="color: #F2F0F5;">%s</strong> te ha transferido una boleta para <strong style="color: #F2F0F5;">%s</strong>.
                </p>
                <p style="color: #9A9A9A; font-size: 13px; text-align: center;">
                    Ya puedes verla en tu perfil de Dopamina Crew.
                </p>
                <div style="text-align: center; margin-top: 24px;">
                    <a href="%s/dashboard" style="display: inline-block; background: #B14EFF; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 14px;">Ver mis boletas</a>
                </div>
                <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #222;">
                    <p style="color: #555; font-size: 12px;">Dopamina Crew</p>
                </div>
            </div>
        """.formatted(origen.getNombre(), eventoNombre, frontendUrl);

        sendSafe(fromGeneral, origen.getEmail(), "📤 Transferencia enviada — Dopamina Crew", htmlOrigen);
        sendSafe(fromGeneral, destino.getEmail(), "🎫 Has recibido una boleta — Dopamina Crew", htmlDestino);
    }

    @Override
    public void sendSuggestionReceived(String nombre, String email, String contenido) {
        if (email == null || email.isBlank()) return;
        String name = (nombre != null && !nombre.isBlank()) ? nombre : "Amante de la música";
        String html = """
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; padding: 40px; border-radius: 16px; border: 1px solid #222;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 48px;">🎵</span>
                </div>
                <h2 style="color: #F2F0F5; font-size: 20px; text-align: center; margin-bottom: 16px;">¡Gracias por tu sugerencia, %s!</h2>
                <p style="color: #9A9A9A; font-size: 14px; text-align: center; line-height: 1.6;">
                    Hemos recibido tu sugerencia y la tendremos muy en cuenta para armar la mejor experiencia musical.
                </p>
                <div style="background: #18181F; border: 1px solid #222; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <p style="color: #9A9A9A; font-size: 12px; margin: 0 0 8px; font-weight: 600;">TU SUGERENCIA</p>
                    <p style="color: #F2F0F5; font-size: 14px; margin: 0; font-style: italic; line-height: 1.5;">"%s"</p>
                </div>
                <p style="color: #666; font-size: 13px; text-align: center;">
                    Esta fiesta la hacemos entre todos. ¡Te esperamos!
                </p>
                <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #222;">
                    <p style="color: #555; font-size: 12px;">Dopamina Crew — Underground Music & Culture</p>
                </div>
            </div>
        """.formatted(name, contenido);

        sendSafe(fromGeneral, email, "🎵 Gracias por tu sugerencia — Dopamina Crew", html);
    }

    @Override
    public void sendManualCustomEmail(String to, String subject, String bodyText) {
        String html = """
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background: #0A0A0F; padding: 40px; border-radius: 16px; border: 1px solid #222;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #B14EFF; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: 2px;">DOPAMINA</h1>
                    <p style="color: #666; font-size: 12px; letter-spacing: 1px;">CREW</p>
                </div>
                <div style="color: #F2F0F5; font-size: 15px; line-height: 1.6; white-space: pre-line; margin-bottom: 24px;">
                    %s
                </div>
                <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #222;">
                    <p style="color: #555; font-size: 12px;">Dopamina Crew — Underground Music & Culture</p>
                </div>
            </div>
        """.formatted(bodyText);

        sendSafe(fromGeneral, to, subject, html);
    }
}

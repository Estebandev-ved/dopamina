package com.dopaminacrew.backend.util;

import com.dopaminacrew.backend.model.Boleta;
import com.dopaminacrew.backend.model.Compra;
import com.dopaminacrew.backend.model.Evento;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Genera un PDF con las boletas de una compra (una página por entrada),
 * cada una con su código QR, la info del evento y la referencia única.
 * Se adjunta al correo de confirmación para que el cliente reciba la boleta
 * "tal cual" sin depender de entrar a su cuenta.
 */
public final class TicketPdfGenerator {

    private static final Color PURPLE = new Color(177, 78, 255);
    private static final Color DARK = new Color(20, 20, 28);
    private static final Color GRAY = new Color(120, 120, 130);
    private static final Locale ES = new Locale("es", "CO");
    private static final DateTimeFormatter FECHA_FMT =
            DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", ES);
    private static final DateTimeFormatter HORA_FMT =
            DateTimeFormatter.ofPattern("h:mm a", ES);

    private TicketPdfGenerator() {
    }

    public static byte[] generate(Compra compra, List<Boleta> boletas) {
        Evento evento = compra.getEvento();
        String eventoNombre = evento != null ? evento.getNombre() : "Evento Dopamina Crew";
        String fecha = evento != null && evento.getFecha() != null
                ? capitalize(evento.getFecha().format(FECHA_FMT)) : "Por confirmar";
        String hora = evento != null && evento.getHora() != null
                ? evento.getHora().format(HORA_FMT).toUpperCase(ES) : "Por confirmar";
        String lugar = evento != null
                ? (safe(evento.getLugar()) + (evento.getCiudad() != null ? ", " + evento.getCiudad() : ""))
                : "Por confirmar";

        Document document = new Document(PageSize.A5, 36, 36, 40, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            int total = boletas.size();
            for (int i = 0; i < total; i++) {
                Boleta boleta = boletas.get(i);
                if (i > 0) {
                    document.newPage();
                }

                Paragraph brand = new Paragraph("DOPAMINA CREW",
                        FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, PURPLE));
                brand.setAlignment(Element.ALIGN_CENTER);
                brand.setSpacingAfter(2);
                document.add(brand);

                Paragraph sub = new Paragraph("BOLETA DIGITAL",
                        FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, GRAY));
                sub.setAlignment(Element.ALIGN_CENTER);
                sub.setSpacingAfter(18);
                document.add(sub);

                Paragraph nombre = new Paragraph(eventoNombre,
                        FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, DARK));
                nombre.setAlignment(Element.ALIGN_CENTER);
                nombre.setSpacingAfter(14);
                document.add(nombre);

                document.add(infoLine("FECHA", fecha));
                document.add(infoLine("HORA", hora));
                document.add(infoLine("LUGAR", lugar));

                Paragraph spacer = new Paragraph(" ");
                spacer.setSpacingAfter(10);
                document.add(spacer);

                byte[] qrPng = QrCodeGenerator.generatePng(boleta.getCodigoQr(), 600);
                Image qr = Image.getInstance(qrPng);
                qr.scaleAbsolute(190, 190);
                qr.setAlignment(Image.ALIGN_CENTER);
                document.add(qr);

                Paragraph ref = new Paragraph(boleta.getCodigoQr(),
                        FontFactory.getFont(FontFactory.COURIER, 9, GRAY));
                ref.setAlignment(Element.ALIGN_CENTER);
                ref.setSpacingBefore(8);
                document.add(ref);

                String entradaLabel = "Entrada " + (i + 1) + " de " + total;
                if (boleta.getNumeroSorteo() != null) {
                    entradaLabel += "  ·  N° de sorteo: " + boleta.getNumeroSorteo();
                }
                Paragraph entrada = new Paragraph(entradaLabel,
                        FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, PURPLE));
                entrada.setAlignment(Element.ALIGN_CENTER);
                entrada.setSpacingBefore(6);
                entrada.setSpacingAfter(18);
                document.add(entrada);

                Paragraph nota = new Paragraph(
                        "Presenta este código QR en la entrada del evento. Válido para un solo ingreso. "
                        + "Esta boletería es la oficial del evento Dopamina Crew.",
                        FontFactory.getFont(FontFactory.HELVETICA, 8, GRAY));
                nota.setAlignment(Element.ALIGN_CENTER);
                document.add(nota);
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el PDF de la boleta", e);
        }
    }

    private static Paragraph infoLine(String label, String value) {
        Paragraph p = new Paragraph();
        p.add(new com.lowagie.text.Chunk(label + ":  ",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, GRAY)));
        p.add(new com.lowagie.text.Chunk(value,
                FontFactory.getFont(FontFactory.HELVETICA, 10, DARK)));
        p.setAlignment(Element.ALIGN_CENTER);
        p.setSpacingAfter(4);
        return p;
    }

    private static String safe(String s) {
        return s != null ? s : "";
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase(ES) + s.substring(1);
    }
}

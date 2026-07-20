package com.dopaminacrew.backend.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.EnumMap;
import java.util.Map;

/**
 * Utilidad para generar códigos QR como imagen PNG a partir del texto del
 * código de una boleta. Se usa tanto para el QR incrustado en el correo
 * (endpoint público) como para el QR dentro del PDF adjunto.
 */
public final class QrCodeGenerator {

    private QrCodeGenerator() {
    }

    /**
     * Genera un QR PNG con el contenido dado.
     *
     * @param content texto a codificar (el código único de la boleta)
     * @param size    ancho/alto del QR en píxeles
     * @return bytes del PNG
     */
    public static byte[] generatePng(String content, int size) {
        try {
            Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            BitMatrix matrix = new MultiFormatWriter()
                    .encode(content, BarcodeFormat.QR_CODE, size, size, hints);
            BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el QR para: " + content, e);
        }
    }
}

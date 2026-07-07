package com.dopaminacrew.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

/**
 * Parche de desarrollo que ajusta columnas al arrancar.
 * IMPORTANTE: NO se ejecuta en producción (@Profile("!prod")). En prod el esquema
 * se gestiona con database/schema.sql y ddl-auto: validate.
 */
@Component
@Profile("!prod")
public class DatabaseFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("====== INICIANDO REPARACION DE BASE DE DATOS Y COLUMNAS ======");
        try {
            jdbcTemplate.execute("ALTER TABLE compras MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
            System.out.println("✔ Schema compras.created_at modificado.");
        } catch (Exception e) {
            System.err.println("Info: No se pudo alterar compras: " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE boletas MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
            System.out.println("✔ Schema boletas.created_at modificado.");
        } catch (Exception e) {
            System.err.println("Info: No se pudo alterar boletas: " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE boletas ADD COLUMN numero_sorteo INT DEFAULT NULL;");
            System.out.println("✔ Schema boletas.numero_sorteo agregado.");
        } catch (Exception e) {
            System.out.println("Info: La columna numero_sorteo ya existe o no se pudo agregar: " + e.getMessage());
        }

        try {
            // Obtener todos los eventos que tienen boletas
            List<Long> eventoIds = jdbcTemplate.queryForList(
                "SELECT DISTINCT c.evento_id FROM boletas b JOIN compras c ON b.compra_id = c.id WHERE c.evento_id IS NOT NULL",
                Long.class
            );
            for (Long evId : eventoIds) {
                // Obtener las boletas del evento ordenadas por id
                List<Long> boletaIds = jdbcTemplate.queryForList(
                    "SELECT b.id FROM boletas b JOIN compras c ON b.compra_id = c.id WHERE c.evento_id = ? ORDER BY b.id ASC",
                    Long.class,
                    evId
                );
                int count = 1;
                for (Long bId : boletaIds) {
                    jdbcTemplate.update(
                        "UPDATE boletas SET numero_sorteo = ? WHERE id = ? AND numero_sorteo IS NULL",
                        count, bId
                    );
                    count++;
                }
            }
            System.out.println("✔ Números de sorteo de boletas existentes inicializados.");
        } catch (Exception e) {
            System.err.println("Error inicializando numero_sorteo para boletas existentes: " + e.getMessage());
        }

        try {
            // Imprimir datos actuales de boletas para depuración
            List<Map<String, Object>> boletasData = jdbcTemplate.queryForList("SELECT id, compra_id, codigo_qr, estado, created_at FROM boletas LIMIT 10");
            System.out.println("--- DATOS EN TABLA BOLETAS ---");
            for (Map<String, Object> boletaRow : boletasData) {
                System.out.println("Boleta ID: " + boletaRow.get("id") + 
                                   ", compra_id: " + boletaRow.get("compra_id") + 
                                   ", created_at: " + boletaRow.get("created_at") + 
                                   " (Type: " + (boletaRow.get("created_at") != null ? boletaRow.get("created_at").getClass().getName() : "null") + ")");
            }
        } catch (Exception e) {
            System.err.println("Error consultando boletas: " + e.getMessage());
        }

        try {
            int updatedCompras = jdbcTemplate.update("UPDATE compras SET created_at = NOW() WHERE created_at IS NULL;");
            System.out.println("✔ Compras sin fecha actualizadas: " + updatedCompras);
        } catch (Exception e) {
            System.err.println("Error actualizando fechas de compras NULL: " + e.getMessage());
        }

        try {
            int updatedBoletas = jdbcTemplate.update(
                "UPDATE boletas b " +
                "INNER JOIN compras c ON b.compra_id = c.id " +
                "SET b.created_at = c.created_at " +
                "WHERE b.created_at IS NULL;"
            );
            System.out.println("✔ Boletas sin fecha actualizadas con fecha de compra: " + updatedBoletas);
        } catch (Exception e) {
            System.err.println("Error actualizando fechas de boletas NULL: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS `cupones` (" +
                "    `id` BIGINT AUTO_INCREMENT PRIMARY KEY," +
                "    `codigo` VARCHAR(50) NOT NULL UNIQUE," +
                "    `descuento_porcentaje` DOUBLE NOT NULL," +
                "    `activo` BOOLEAN NOT NULL DEFAULT TRUE," +
                "    `descripcion` VARCHAR(255)," +
                "    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;"
            );
            System.out.println("✔ Tabla cupones verificada / creada.");

            // Siembra de cupones por defecto con INSERT IGNORE
            jdbcTemplate.update("INSERT IGNORE INTO cupones (codigo, descuento_porcentaje, activo, descripcion) VALUES (?, ?, ?, ?)", "DOPAMINA10", 10.0, true, "Descuento general del 10%");
            jdbcTemplate.update("INSERT IGNORE INTO cupones (codigo, descuento_porcentaje, activo, descripcion) VALUES (?, ?, ?, ?)", "REGALO15", 15.0, true, "Cupón regalo sorpresa del 15%");
            jdbcTemplate.update("INSERT IGNORE INTO cupones (codigo, descuento_porcentaje, activo, descripcion) VALUES (?, ?, ?, ?)", "DOPA-ARCADE-10", 10.0, true, "Descuento por superar la Zona Arcade (10%)");
            System.out.println("✔ Cupones por defecto DOPAMINA10, REGALO15 y DOPA-ARCADE-10 insertados.");
        } catch (Exception e) {
            System.err.println("Error creando o sembrando la tabla cupones: " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE cupones ADD COLUMN promotor_id BIGINT DEFAULT NULL;");
            jdbcTemplate.execute("ALTER TABLE cupones ADD CONSTRAINT fk_cupones_promotor FOREIGN KEY (promotor_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE;");
            System.out.println("✔ Columna promotor_id y FK agregadas a cupones.");
        } catch (Exception e) {
            System.out.println("Info: Columna promotor_id en cupones ya existe o no se pudo agregar: " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE compras ADD COLUMN cantidad_preventa INT DEFAULT 0;");
            System.out.println("✔ Columna cantidad_preventa agregada a compras.");
        } catch (Exception e) {
            System.out.println("Info: Columna cantidad_preventa en compras ya existe o no se pudo agregar: " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE compras ADD COLUMN cantidad_regular INT DEFAULT 0;");
            System.out.println("✔ Columna cantidad_regular agregada a compras.");
        } catch (Exception e) {
            System.out.println("Info: Columna cantidad_regular en compras ya existe o no se pudo agregar: " + e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE compras ADD COLUMN comision_promotor DECIMAL(10,2) DEFAULT 0.00;");
            System.out.println("✔ Columna comision_promotor agregada a compras.");
        } catch (Exception e) {
            System.out.println("Info: Columna comision_promotor en compras ya existe o no se pudo agregar: " + e.getMessage());
        }

        // Datos bancarios para giros a promotores
        try {
            jdbcTemplate.execute("ALTER TABLE usuarios ADD COLUMN cuenta_bancaria VARCHAR(30) DEFAULT NULL;");
            System.out.println("✔ Columna cuenta_bancaria agregada a usuarios.");
        } catch (Exception e) {
            System.out.println("Info: Columna cuenta_bancaria ya existe: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE usuarios ADD COLUMN banco VARCHAR(80) DEFAULT NULL;");
            System.out.println("✔ Columna banco agregada a usuarios.");
        } catch (Exception e) {
            System.out.println("Info: Columna banco ya existe: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE usuarios ADD COLUMN titular_cuenta VARCHAR(100) DEFAULT NULL;");
            System.out.println("✔ Columna titular_cuenta agregada a usuarios.");
        } catch (Exception e) {
            System.out.println("Info: Columna titular_cuenta ya existe: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE usuarios ADD COLUMN tipo_cuenta VARCHAR(20) DEFAULT NULL;");
            System.out.println("✔ Columna tipo_cuenta agregada a usuarios.");
        } catch (Exception e) {
            System.out.println("Info: Columna tipo_cuenta ya existe: " + e.getMessage());
        }

        System.out.println("====== REPARACION DE BASE DE DATOS FINALIZADA ======");
    }
}

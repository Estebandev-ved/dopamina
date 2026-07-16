-- =====================================================================
-- Dopamina Crew — Agregar tabla de Combos y campos en Compras
-- =====================================================================

USE `dopamina_crew_db`;

CREATE TABLE IF NOT EXISTS `combos` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT,
    `precio` DECIMAL(10,2) NOT NULL,
    `cantidad_boletas` INT NOT NULL DEFAULT 1,
    `activo` TINYINT(1) NOT NULL DEFAULT 1,
    `imagen_url` VARCHAR(500),
    `items_adicionales` VARCHAR(255), -- Ej. "1 Botella de Ron", "1 Vape"
    `es_cumpleanero` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modificar compras si no existen las columnas
SET @dbname = DATABASE();
SET @tablename = 'compras';

-- Agregar combo_id
SET @columnname = 'combo_id';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE `compras` ADD COLUMN `combo_id` BIGINT DEFAULT NULL'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar combo_nombre
SET @columnname = 'combo_nombre';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE `compras` ADD COLUMN `combo_nombre` VARCHAR(150) DEFAULT NULL'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar combo_items
SET @columnname = 'combo_items';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE `compras` ADD COLUMN `combo_items` VARCHAR(255) DEFAULT NULL'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar requiere_verificacion_cumple
SET @columnname = 'requiere_verificacion_cumple';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE `compras` ADD COLUMN `requiere_verificacion_cumple` TINYINT(1) NOT NULL DEFAULT 0'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar llave foránea fk_compras_combo
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND CONSTRAINT_NAME = 'fk_compras_combo') > 0,
    'SELECT 1',
    'ALTER TABLE `compras` ADD CONSTRAINT `fk_compras_combo` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insertar combos semilla si la tabla está vacía
INSERT INTO `combos` (`nombre`, `descripcion`, `precio`, `cantidad_boletas`, `items_adicionales`, `es_cumpleanero`) 
SELECT 'Combo Ron Crew', 'Arma el parche: 4 entradas generales y una Botella de Ron para iniciar la noche.', 100000.00, 4, '1 Botella de Ron', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `combos` WHERE `nombre` = 'Combo Ron Crew');

INSERT INTO `combos` (`nombre`, `descripcion`, `precio`, `cantidad_boletas`, `items_adicionales`, `es_cumpleanero`) 
SELECT 'Combo Vape Crew', 'El combo ideal para parejas: 2 entradas generales y 1 Vape premium a tu elección.', 60000.00, 2, '1 Vape Premium', 0
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `combos` WHERE `nombre` = 'Combo Vape Crew');

INSERT INTO `combos` (`nombre`, `descripcion`, `precio`, `cantidad_boletas`, `items_adicionales`, `es_cumpleanero`) 
SELECT 'Combo Cumpleañero', '¡Tu cumpleaños va por cuenta de la casa! Compra 3 entradas y la 4ta (la tuya) es GRATIS. Válido presentando cédula física en portería.', 0.00, 4, '1 Entrada Gratis (Verificar Cédula)', 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `combos` WHERE `nombre` = 'Combo Cumpleañero');

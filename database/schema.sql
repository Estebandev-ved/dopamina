-- Database: dopamina_crew_db
-- Schema Initialization Script

CREATE DATABASE IF NOT EXISTS `dopamina_crew_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dopamina_crew_db`;

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system roles
INSERT INTO `roles` (`nombre`) VALUES ('ROLE_USER') ON DUPLICATE KEY UPDATE `nombre`=`nombre`;
INSERT INTO `roles` (`nombre`) VALUES ('ROLE_ADMIN') ON DUPLICATE KEY UPDATE `nombre`=`nombre`;

-- 2. Create Users Table (usuarios)
CREATE TABLE IF NOT EXISTS `usuarios` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `telefono` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `rol_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional index for faster query lookup by email
CREATE INDEX idx_user_email ON `usuarios` (`email`);

-- 3. Create Compras Table
CREATE TABLE IF NOT EXISTS `compras` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` BIGINT NOT NULL,
    `evento_id` BIGINT,
    `cantidad` INT NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `descuento` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `codigo_cupon` VARCHAR(50),
    `estado` VARCHAR(50) NOT NULL DEFAULT 'PAGADO',
    `codigo_qr` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`evento_id`) REFERENCES `eventos` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create Boletas Table (individual tickets)
CREATE TABLE IF NOT EXISTS `boletas` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `compra_id` BIGINT NOT NULL,
    `codigo_qr` VARCHAR(255) NOT NULL UNIQUE,
    `estado` VARCHAR(50) NOT NULL DEFAULT 'ACTIVA', -- 'ACTIVA', 'USADA'
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create Canjes Table (reward redemptions)
CREATE TABLE IF NOT EXISTS `canjes` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` BIGINT NOT NULL,
    `premio_id` VARCHAR(100) NOT NULL,
    `premio_titulo` VARCHAR(255) NOT NULL,
    `codigo_canje` VARCHAR(100) NOT NULL UNIQUE,
    `costo_puntos` INT NOT NULL,
    `estado` VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, ENTREGADO
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



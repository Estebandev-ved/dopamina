-- =====================================================================
-- Dopamina Crew — Agregar columna agotado a la tabla combos
-- Ejecutar en phpMyAdmin sobre la base de datos dopamina_crew_db
-- =====================================================================

USE `dopamina_crew_db`;

ALTER TABLE `combos` ADD COLUMN IF NOT EXISTS `agotado` BOOLEAN NOT NULL DEFAULT FALSE AFTER `es_cumpleanero`;

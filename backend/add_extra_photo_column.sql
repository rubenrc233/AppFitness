-- Añadir columna para foto extra en progress_updates
ALTER TABLE progress_updates 
ADD COLUMN extra_photo_url VARCHAR(500) NULL AFTER back_photo_url;

-- Migration: Add photos array to doubts and remove image column
BEGIN;

ALTER TABLE doubts ADD COLUMN photos text[];
ALTER TABLE doubts DROP COLUMN IF EXISTS image;

COMMIT;

-- Migration: Add label and title columns to ticker_items table
-- Run this in Supabase SQL Editor

-- Add new columns
ALTER TABLE ticker_items
ADD COLUMN IF NOT EXISTS label TEXT DEFAULT 'SEKTOR',
ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing records: extract label from text if present
UPDATE ticker_items
SET 
  label = CASE
    WHEN text LIKE 'SON DAKİKA:%' THEN 'SON_DAKIKA'
    WHEN text LIKE 'ANALİZ:%' THEN 'ANALIZ'
    WHEN text LIKE 'RAPOR:%' THEN 'RAPOR'
    WHEN text LIKE 'BDDK RAPORU:%' THEN 'RAPOR'
    WHEN text LIKE 'SEKTÖR:%' THEN 'SEKTOR'
    WHEN text LIKE 'GÜNDEM:%' THEN 'GUNDEM'
    ELSE 'SEKTOR'
  END,
  title = COALESCE(title, SUBSTRING(text FROM 1 FOR 100))
WHERE label IS NULL OR label = 'SEKTOR';

-- Add comment for documentation
COMMENT ON COLUMN ticker_items.label IS 'Ticker item label/prefix: SON_DAKIKA, ANALIZ, RAPOR, SEKTOR, GUNDEM';
COMMENT ON COLUMN ticker_items.title IS 'Short title for the ticker item';

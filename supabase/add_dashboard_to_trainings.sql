-- Add dashboard column to trainings table
ALTER TABLE trainings 
ADD COLUMN IF NOT EXISTS dashboard BOOLEAN DEFAULT true;

-- Update existing rows to have dashboard = true
UPDATE trainings 
SET dashboard = true 
WHERE dashboard IS NULL;

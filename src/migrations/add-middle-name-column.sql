-- Migration: Add middle_name column to employee table
ALTER TABLE employee ADD COLUMN IF NOT EXISTS middle_name VARCHAR;

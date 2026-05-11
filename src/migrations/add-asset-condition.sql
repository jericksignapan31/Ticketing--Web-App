-- Migration: Add condition column to asset table
-- This migration adds the condition column to track asset condition (excellent, good, fair, poor, broken)

ALTER TABLE "asset" 
ADD COLUMN "condition" VARCHAR(20) NOT NULL DEFAULT 'good';

-- Add constraint for valid condition values
ALTER TABLE "asset"
ADD CONSTRAINT "CHK_asset_condition" 
CHECK ("condition" IN ('excellent', 'good', 'fair', 'poor', 'broken'));

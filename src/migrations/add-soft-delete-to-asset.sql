-- Add soft delete columns to asset table
ALTER TABLE "asset" 
ADD COLUMN "is_deleted" boolean NOT NULL DEFAULT false,
ADD COLUMN "deleted_at" timestamp NULL;

-- Create index for faster queries on non-deleted assets
CREATE INDEX idx_asset_is_deleted ON "asset"(is_deleted);

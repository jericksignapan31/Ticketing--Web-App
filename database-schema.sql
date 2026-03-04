-- Initial Schema for IT Help Desk System
-- Run this on Supabase to create all tables

-- Table: branch
CREATE TABLE IF NOT EXISTS "branch" (
    "branch_id" SERIAL PRIMARY KEY,
    "branch_name" VARCHAR(100) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "contact_number" VARCHAR(20),
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Table: department
CREATE TABLE IF NOT EXISTS "department" (
    "department_id" SERIAL PRIMARY KEY,
    "department_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Table: employee
CREATE TABLE IF NOT EXISTS "employee" (
    "employee_id" SERIAL PRIMARY KEY,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL UNIQUE,
    "phone_number" VARCHAR(20),
    "position" VARCHAR(100),
    "branch_id" INTEGER,
    "department_id" INTEGER,
    "hire_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_employee_branch" FOREIGN KEY ("branch_id") REFERENCES "branch"("branch_id") ON DELETE SET NULL,
    CONSTRAINT "FK_employee_department" FOREIGN KEY ("department_id") REFERENCES "department"("department_id") ON DELETE SET NULL
);

-- Table: user_account
CREATE TABLE IF NOT EXISTS "user_account" (
    "user_id" SERIAL PRIMARY KEY,
    "employee_id" INTEGER NOT NULL UNIQUE,
    "username" VARCHAR(50) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "last_login" TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_user_employee" FOREIGN KEY ("employee_id") REFERENCES "employee"("employee_id") ON DELETE CASCADE,
    CONSTRAINT "CHK_user_role" CHECK ("role" IN ('admin', 'technician', 'user'))
);

-- Table: brand
CREATE TABLE IF NOT EXISTS "brand" (
    "brand_id" SERIAL PRIMARY KEY,
    "brand_name" VARCHAR(100) NOT NULL UNIQUE,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Table: asset
CREATE TABLE IF NOT EXISTS "asset" (
    "asset_id" SERIAL PRIMARY KEY,
    "asset_tag" VARCHAR(50) NOT NULL UNIQUE,
    "asset_type" VARCHAR(50) NOT NULL,
    "brand_id" INTEGER,
    "model" VARCHAR(100),
    "serial_number" VARCHAR(100),
    "purchase_date" DATE,
    "warranty_expiry" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'available',
    "condition" VARCHAR(20) NOT NULL DEFAULT 'good',
    "assigned_to" INTEGER,
    "branch_id" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_asset_brand" FOREIGN KEY ("brand_id") REFERENCES "brand"("brand_id") ON DELETE SET NULL,
    CONSTRAINT "FK_asset_employee" FOREIGN KEY ("assigned_to") REFERENCES "employee"("employee_id") ON DELETE SET NULL,
    CONSTRAINT "FK_asset_branch" FOREIGN KEY ("branch_id") REFERENCES "branch"("branch_id") ON DELETE SET NULL,
    CONSTRAINT "CHK_asset_status" CHECK ("status" IN ('available', 'in-use', 'maintenance', 'retired', 'lost')),
    CONSTRAINT "CHK_asset_condition" CHECK ("condition" IN ('excellent', 'good', 'fair', 'poor', 'broken'))
);

-- Table: ticket
CREATE TABLE IF NOT EXISTS "ticket" (
    "ticket_id" SERIAL PRIMARY KEY,
    "ticket_number" VARCHAR(50) NOT NULL UNIQUE,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "reporter_id" INTEGER NOT NULL,
    "assigned_to" INTEGER,
    "asset_id" INTEGER,
    "branch_id" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    "resolved_at" TIMESTAMP,
    "closed_at" TIMESTAMP,
    "resolution_notes" TEXT,
    CONSTRAINT "FK_ticket_reporter" FOREIGN KEY ("reporter_id") REFERENCES "employee"("employee_id") ON DELETE CASCADE,
    CONSTRAINT "FK_ticket_assignee" FOREIGN KEY ("assigned_to") REFERENCES "employee"("employee_id") ON DELETE SET NULL,
    CONSTRAINT "FK_ticket_asset" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE SET NULL,
    CONSTRAINT "FK_ticket_branch" FOREIGN KEY ("branch_id") REFERENCES "branch"("branch_id") ON DELETE SET NULL,
    CONSTRAINT "CHK_ticket_priority" CHECK ("priority" IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT "CHK_ticket_status" CHECK ("status" IN ('open', 'in-progress', 'resolved', 'closed', 'cancelled'))
);

-- Table: repair_log
CREATE TABLE IF NOT EXISTS "repair_log" (
    "log_id" SERIAL PRIMARY KEY,
    "asset_id" INTEGER NOT NULL,
    "ticket_id" INTEGER,
    "repair_type" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "repair_date" TIMESTAMP NOT NULL,
    "repairer_id" INTEGER,
    "cost" DECIMAL(10,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "FK_repair_asset" FOREIGN KEY ("asset_id") REFERENCES "asset"("asset_id") ON DELETE CASCADE,
    CONSTRAINT "FK_repair_ticket" FOREIGN KEY ("ticket_id") REFERENCES "ticket"("ticket_id") ON DELETE SET NULL,
    CONSTRAINT "FK_repair_employee" FOREIGN KEY ("repairer_id") REFERENCES "employee"("employee_id") ON DELETE SET NULL,
    CONSTRAINT "CHK_repair_status" CHECK ("status" IN ('pending', 'in-progress', 'completed', 'cancelled'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IDX_employee_email" ON "employee"("email");
CREATE INDEX IF NOT EXISTS "IDX_employee_branch" ON "employee"("branch_id");
CREATE INDEX IF NOT EXISTS "IDX_employee_department" ON "employee"("department_id");
CREATE INDEX IF NOT EXISTS "IDX_user_username" ON "user_account"("username");
CREATE INDEX IF NOT EXISTS "IDX_user_employee" ON "user_account"("employee_id");
CREATE INDEX IF NOT EXISTS "IDX_asset_tag" ON "asset"("asset_tag");
CREATE INDEX IF NOT EXISTS "IDX_asset_status" ON "asset"("status");
CREATE INDEX IF NOT EXISTS "IDX_asset_assigned" ON "asset"("assigned_to");
CREATE INDEX IF NOT EXISTS "IDX_asset_branch" ON "asset"("branch_id");
CREATE INDEX IF NOT EXISTS "IDX_ticket_number" ON "ticket"("ticket_number");
CREATE INDEX IF NOT EXISTS "IDX_ticket_status" ON "ticket"("status");
CREATE INDEX IF NOT EXISTS "IDX_ticket_reporter" ON "ticket"("reporter_id");
CREATE INDEX IF NOT EXISTS "IDX_ticket_assignee" ON "ticket"("assigned_to");
CREATE INDEX IF NOT EXISTS "IDX_ticket_created" ON "ticket"("created_at");
CREATE INDEX IF NOT EXISTS "IDX_repair_asset" ON "repair_log"("asset_id");
CREATE INDEX IF NOT EXISTS "IDX_repair_ticket" ON "repair_log"("ticket_id");
CREATE INDEX IF NOT EXISTS "IDX_repair_date" ON "repair_log"("repair_date");

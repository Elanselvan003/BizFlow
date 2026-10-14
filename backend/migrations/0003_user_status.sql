-- BizFlow Database Migration 0003: User Status (Active / Deactivated)
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

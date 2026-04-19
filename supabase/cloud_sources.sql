-- 
-- @license
-- SPDX-License-Identifier: Apache-2.0
-- 

-- Table for cloud sources persistence
CREATE TABLE IF NOT EXISTS public.cloud_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('onedrive', 'gdrive', 'gphotos')),
    name TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'connected',
    last_sync TIMESTAMPTZ DEFAULT NOW(),
    usage_used BIGINT DEFAULT 0,
    usage_total BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cloud_sources ENABLE ROW LEVEL SECURITY;

-- Allow all operations for public access (demo mode)
CREATE POLICY "Public full access to cloud_sources" ON public.cloud_sources
    FOR ALL USING (true) WITH CHECK (true);

-- Indices
CREATE INDEX IF NOT EXISTS idx_cloud_sources_provider ON public.cloud_sources (provider);

-- 
-- @license
-- SPDX-License-Identifier: Apache-2.0
-- 

-- Create media_items table
CREATE TABLE IF NOT EXISTS public.media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    mime_type TEXT,
    size BIGINT,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    location JSONB,
    tags TEXT[] DEFAULT '{}',
    ai_quality_score FLOAT DEFAULT 0.8,
    is_blurry BOOLEAN DEFAULT FALSE,
    faces JSONB DEFAULT '[]',
    perceptual_hash TEXT,
    rating INTEGER DEFAULT 0,
    source TEXT DEFAULT 'local'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- In a production app, you would restrict this to authenticated users
CREATE POLICY "Allow public access for all operations" ON public.media_items
    FOR ALL USING (true) WITH CHECK (true);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_media_items_created_at ON public.media_items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_items_type ON public.media_items (type);

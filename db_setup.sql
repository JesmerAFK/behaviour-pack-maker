-- Run these commands in your Neon SQL Editor

-- Table for site-wide statistics (like viewer count)
CREATE TABLE IF NOT EXISTS site_stats (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value INTEGER DEFAULT 0
);

-- Initialize total_views if not exists
INSERT INTO site_stats (key, value) VALUES ('total_views', 0) ON CONFLICT DO NOTHING;

-- Table for download counts per item
CREATE TABLE IF NOT EXISTS downloads (
    id SERIAL PRIMARY KEY,
    item_id TEXT UNIQUE NOT NULL,
    count INTEGER DEFAULT 0
);

-- Table for comments
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    item_id TEXT NOT NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_comments_item_id ON comments(item_id);

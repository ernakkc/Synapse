-- Memory System Database Schema for SQLite
-- Version: 1.0.0
-- Created: 2026-02-25

-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- ==========================================
-- Short-Term Memory Table
-- ==========================================
CREATE TABLE IF NOT EXISTS short_term_memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    metadata TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
    access_count INTEGER NOT NULL DEFAULT 1,
    ttl INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 5
);

CREATE INDEX IF NOT EXISTS idx_stm_expires_at ON short_term_memories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stm_created_at ON short_term_memories(created_at);
CREATE INDEX IF NOT EXISTS idx_stm_priority ON short_term_memories(priority);

-- ==========================================
-- Long-Term Memory Table
-- ==========================================
CREATE TABLE IF NOT EXISTS long_term_memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('FACT', 'SKILL', 'KNOWLEDGE', 'EXPERIENCE', 'USER_PREFERENCE')),
    metadata TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_accessed TEXT NOT NULL DEFAULT (datetime('now')),
    access_count INTEGER NOT NULL DEFAULT 0,
    importance REAL NOT NULL DEFAULT 0.50,
    certainty REAL NOT NULL DEFAULT 0.80,
    verified INTEGER NOT NULL DEFAULT 0,
    last_verified TEXT,
    CHECK(importance >= 0 AND importance <= 1),
    CHECK(certainty >= 0 AND certainty <= 1)
);

CREATE INDEX IF NOT EXISTS idx_ltm_type ON long_term_memories(type);
CREATE INDEX IF NOT EXISTS idx_ltm_importance ON long_term_memories(importance);
CREATE INDEX IF NOT EXISTS idx_ltm_certainty ON long_term_memories(certainty);
CREATE INDEX IF NOT EXISTS idx_ltm_verified ON long_term_memories(verified);
CREATE INDEX IF NOT EXISTS idx_ltm_created_at ON long_term_memories(created_at);
CREATE INDEX IF NOT EXISTS idx_ltm_last_accessed ON long_term_memories(last_accessed);

-- ==========================================
-- Episodes Table
-- ==========================================
CREATE TABLE IF NOT EXISTS episodes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    metadata TEXT NOT NULL,
    summary TEXT,
    dominant_emotion TEXT,
    memory_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
CREATE INDEX IF NOT EXISTS idx_episodes_started_at ON episodes(started_at);
CREATE INDEX IF NOT EXISTS idx_episodes_ended_at ON episodes(ended_at);

-- ==========================================
-- Episodic Memory Table
-- ==========================================
CREATE TABLE IF NOT EXISTS episodic_memories (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    emotional_context TEXT,
    importance REAL NOT NULL DEFAULT 0.50,
    archived INTEGER NOT NULL DEFAULT 0,
    archived_at TEXT,
    CHECK(importance >= 0 AND importance <= 1),
    FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_epm_episode_id ON episodic_memories(episode_id);
CREATE INDEX IF NOT EXISTS idx_epm_created_at ON episodic_memories(created_at);
CREATE INDEX IF NOT EXISTS idx_epm_archived ON episodic_memories(archived);
CREATE INDEX IF NOT EXISTS idx_epm_importance ON episodic_memories(importance);

-- ==========================================
-- Memory Tags Table (Many-to-Many)
-- ==========================================
CREATE TABLE IF NOT EXISTS memory_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tags_tag ON memory_tags(tag);

-- ==========================================
-- Short-Term Memory Tags Junction
-- ==========================================
CREATE TABLE IF NOT EXISTS short_term_memory_tags (
    memory_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (memory_id, tag_id),
    FOREIGN KEY (memory_id) REFERENCES short_term_memories(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES memory_tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stm_tags_memory ON short_term_memory_tags(memory_id);
CREATE INDEX IF NOT EXISTS idx_stm_tags_tag ON short_term_memory_tags(tag_id);

-- ==========================================
-- Long-Term Memory Tags Junction
-- ==========================================
CREATE TABLE IF NOT EXISTS long_term_memory_tags (
    memory_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (memory_id, tag_id),
    FOREIGN KEY (memory_id) REFERENCES long_term_memories(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES memory_tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ltm_tags_memory ON long_term_memory_tags(memory_id);
CREATE INDEX IF NOT EXISTS idx_ltm_tags_tag ON long_term_memory_tags(tag_id);

-- ==========================================
-- Episodic Memory Tags Junction
-- ==========================================
CREATE TABLE IF NOT EXISTS episodic_memory_tags (
    memory_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (memory_id, tag_id),
    FOREIGN KEY (memory_id) REFERENCES episodic_memories(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES memory_tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_epm_tags_memory ON episodic_memory_tags(memory_id);
CREATE INDEX IF NOT EXISTS idx_epm_tags_tag ON episodic_memory_tags(tag_id);

-- ==========================================
-- Views for Convenient Querying
-- ==========================================

-- Active short-term memories view
CREATE VIEW IF NOT EXISTS active_short_term_memories AS
SELECT * FROM short_term_memories
WHERE datetime(expires_at) > datetime('now')
ORDER BY priority DESC, created_at DESC;

-- Important long-term memories view
CREATE VIEW IF NOT EXISTS important_long_term_memories AS
SELECT * FROM long_term_memories
WHERE importance >= 0.7
ORDER BY importance DESC, created_at DESC;

-- Recent episodes summary view
CREATE VIEW IF NOT EXISTS recent_episodes_summary AS
SELECT 
    id,
    title,
    started_at,
    ended_at,
    status,
    memory_count,
    dominant_emotion
FROM episodes
WHERE status != 'ARCHIVED'
ORDER BY started_at DESC
LIMIT 20;

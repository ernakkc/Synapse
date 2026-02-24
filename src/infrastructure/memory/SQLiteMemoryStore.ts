import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { 
  ShortTermMemory 
} from '../../core/entities/ShortTermMemory';
import { 
  LongTermMemory 
} from '../../core/entities/LongTermMemory';
import { 
  EpisodicMemory, 
  Episode 
} from '../../core/entities/EpisodicMemory';

/**
 * SQLite-based memory store for persistent storage
 * Stores all memory data in a local SQLite database file
 */
export class SQLiteMemoryStore {
  private db: Database.Database | null = null;
  private dbPath: string;
  private schemaPath: string;

  constructor(config: { dbPath: string; schemaPath?: string }) {
    this.dbPath = config.dbPath;
    this.schemaPath = config.schemaPath || join(
      process.cwd(),
      'src/infrastructure/database/schema/memory_schema_sqlite.sql'
    );
  }

  /**
   * Connect to SQLite database and initialize schema
   */
  async connect(): Promise<void> {
    try {
      // Ensure data directory exists
      const dbDir = dirname(this.dbPath);
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
      }

      // Open database connection
      this.db = new Database(this.dbPath);
      
      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');
      
      // Initialize schema if tables don't exist
      await this.initializeSchema();
      
      console.log('✅ SQLite Memory Store connected:', this.dbPath);
    } catch (error) {
      console.error('❌ SQLite connection error:', error);
      throw error;
    }
  }

  /**
   * Initialize database schema
   */
  private async initializeSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    try {
      // Check if tables exist
      const tables = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='short_term_memories'"
      ).get();

      if (!tables) {
        // Read and execute schema file
        const schema = readFileSync(this.schemaPath, 'utf-8');
        this.db.exec(schema);
        console.log('✅ Database schema initialized');
      }
    } catch (error) {
      console.error('❌ Schema initialization error:', error);
      throw error;
    }
  }

  /**
   * Ensure database is connected
   */
  private ensureConnection(): void {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
  }

  /**
   * Save short-term memories
   */
  async saveShortTermMemories(memories: Map<string, ShortTermMemory>): Promise<void> {
    this.ensureConnection();
    if (memories.size === 0) return;

    const insert = this.db!.prepare(`
      INSERT OR REPLACE INTO short_term_memories 
      (id, content, metadata, created_at, accessed_at, access_count, ttl, expires_at, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db!.transaction((mems: ShortTermMemory[]) => {
      for (const mem of mems) {
        insert.run(
          mem.id,
          mem.content,
          JSON.stringify(mem.metadata),
          new Date(mem.createdAt).toISOString(),
          new Date(mem.lastAccessed).toISOString(),
          mem.accessCount,
          mem.ttl,
          new Date(mem.expiresAt).toISOString(),
          mem.priority
        );
      }
    });

    transaction(Array.from(memories.values()));
  }

  /**
   * Load short-term memories
   */
  async loadShortTermMemories(): Promise<Map<string, ShortTermMemory>> {
    this.ensureConnection();

    const rows = this.db!.prepare(`
      SELECT * FROM short_term_memories
      WHERE datetime(expires_at) > datetime('now')
    `).all() as any[];

    const memories = new Map<string, ShortTermMemory>();
    for (const row of rows) {
      memories.set(row.id, {
        id: row.id,
        content: row.content,
        metadata: JSON.parse(row.metadata),
        type: 'SHORT_TERM',
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.created_at).getTime(),
        lastAccessed: new Date(row.accessed_at).getTime(),
        accessCount: row.access_count,
        importance: 0.5,
        ttl: row.ttl,
        expiresAt: new Date(row.expires_at).getTime(),
        priority: row.priority
      });
    }

    return memories;
  }

  /**
   * Save long-term memories
   */
  async saveLongTermMemories(memories: Map<string, LongTermMemory>): Promise<void> {
    this.ensureConnection();
    if (memories.size === 0) return;

    const insert = this.db!.prepare(`
      INSERT OR REPLACE INTO long_term_memories 
      (id, content, type, metadata, created_at, last_accessed, access_count, 
       importance, certainty, verified, last_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db!.transaction((mems: LongTermMemory[]) => {
      for (const mem of mems) {
        insert.run(
          mem.id,
          mem.content,
          mem.category,
          JSON.stringify(mem.metadata),
          new Date(mem.createdAt).toISOString(),
          new Date(mem.lastAccessed).toISOString(),
          mem.accessCount,
          mem.strength,
          mem.strength,
          mem.verifiedAt ? 1 : 0,
          mem.verifiedAt ? new Date(mem.verifiedAt).toISOString() : null
        );
      }
    });

    transaction(Array.from(memories.values()));
  }

  /**
   * Load long-term memories
   */
  async loadLongTermMemories(): Promise<Map<string, LongTermMemory>> {
    this.ensureConnection();

    const rows = this.db!.prepare(`
      SELECT * FROM long_term_memories
    `).all() as any[];

    const memories = new Map<string, LongTermMemory>();
    for (const row of rows) {
      memories.set(row.id, {
        id: row.id,
        content: row.content,
        type: 'LONG_TERM',
        category: row.type as any,
        metadata: JSON.parse(row.metadata),
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.created_at).getTime(),
        lastAccessed: new Date(row.last_accessed).getTime(),
        accessCount: row.access_count,
        importance: parseFloat(row.importance),
        strength: parseFloat(row.certainty),
        verifiedAt: row.last_verified ? new Date(row.last_verified).getTime() : undefined,
        verificationCount: 0
      });
    }

    return memories;
  }

  /**
   * Save episodes
   */
  async saveEpisodes(episodes: Map<string, Episode>): Promise<void> {
    this.ensureConnection();
    if (episodes.size === 0) return;

    const insert = this.db!.prepare(`
      INSERT OR REPLACE INTO episodes 
      (id, title, started_at, ended_at, status, metadata, summary, 
       dominant_emotion, memory_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db!.transaction((eps: Episode[]) => {
      for (const ep of eps) {
        insert.run(
          ep.id,
          ep.title,
          new Date(ep.startTime).toISOString(),
          ep.endTime ? new Date(ep.endTime).toISOString() : null,
          ep.endTime ? 'COMPLETED' : 'ACTIVE',
          JSON.stringify({ outcome: ep.outcome }),
          ep.summary || null,
          ep.outcome?.status || null,
          ep.memoryIds.length,
          new Date().toISOString(),
          new Date().toISOString()
        );
      }
    });

    transaction(Array.from(episodes.values()));
  }

  /**
   * Load episodes
   */
  async loadEpisodes(): Promise<Map<string, Episode>> {
    this.ensureConnection();

    const rows = this.db!.prepare(`
      SELECT * FROM episodes
    `).all() as any[];

    const episodes = new Map<string, Episode>();
    for (const row of rows) {
      // Load memory IDs for this episode
      const memoryRows = this.db!.prepare(`
        SELECT id FROM episodic_memories WHERE episode_id = ?
      `).all(row.id) as any[];

      const metadata = JSON.parse(row.metadata);
      episodes.set(row.id, {
        id: row.id,
        title: row.title,
        startTime: new Date(row.started_at).getTime(),
        endTime: row.ended_at ? new Date(row.ended_at).getTime() : undefined,
        memoryIds: memoryRows.map((r: any) => r.id),
        summary: row.summary || undefined,
        outcome: metadata?.outcome
      });
    }

    return episodes;
  }

  /**
   * Save episodic memories
   */
  async saveEpisodicMemories(memories: Map<string, EpisodicMemory>): Promise<void> {
    this.ensureConnection();
    if (memories.size === 0) return;

    const insert = this.db!.prepare(`
      INSERT OR REPLACE INTO episodic_memories 
      (id, episode_id, content, metadata, created_at, emotional_context, 
       importance, archived, archived_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db!.transaction((mems: EpisodicMemory[]) => {
      for (const mem of mems) {
        insert.run(
          mem.id,
          mem.episodeId,
          mem.content,
          JSON.stringify(mem.metadata),
          new Date(mem.createdAt).toISOString(),
          mem.emotionalContext ? JSON.stringify(mem.emotionalContext) : null,
          mem.importance,
          mem.archived ? 1 : 0,
          mem.archived ? new Date(mem.updatedAt).toISOString() : null
        );
      }
    });

    transaction(Array.from(memories.values()));
  }

  /**
   * Load episodic memories
   */
  async loadEpisodicMemories(): Promise<Map<string, EpisodicMemory>> {
    this.ensureConnection();

    const rows = this.db!.prepare(`
      SELECT * FROM episodic_memories
    `).all() as any[];

    const memories = new Map<string, EpisodicMemory>();
    for (const row of rows) {
      memories.set(row.id, {
        id: row.id,
        type: 'EPISODIC',
        episodeId: row.episode_id,
        sequenceNumber: 0,
        content: row.content,
        metadata: JSON.parse(row.metadata),
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.created_at).getTime(),
        lastAccessed: new Date(row.created_at).getTime(),
        accessCount: 0,
        emotionalContext: row.emotional_context 
          ? JSON.parse(row.emotional_context)
          : undefined,
        importance: parseFloat(row.importance),
        archived: Boolean(row.archived)
      });
    }

    return memories;
  }

  /**
   * Load all memories
   */
  async loadAll(): Promise<{
    shortTerm: Map<string, ShortTermMemory>;
    longTerm: Map<string, LongTermMemory>;
    episodic: Map<string, EpisodicMemory>;
    episodes: Map<string, Episode>;
  }> {
    this.ensureConnection();

    const [shortTerm, longTerm, episodes, episodic] = await Promise.all([
      this.loadShortTermMemories(),
      this.loadLongTermMemories(),
      this.loadEpisodes(),
      this.loadEpisodicMemories()
    ]);

    return { shortTerm, longTerm, episodic, episodes };
  }

  /**
   * Save all memories
   */
  async saveAll(data: {
    shortTerm: Map<string, ShortTermMemory>;
    longTerm: Map<string, LongTermMemory>;
    episodic: Map<string, EpisodicMemory>;
    episodes: Map<string, Episode>;
  }): Promise<void> {
    this.ensureConnection();

    // Save episodes FIRST (episodic memories have FK to episodes)
    await this.saveEpisodes(data.episodes);

    // Then save other memories in parallel
    await Promise.all([
      this.saveShortTermMemories(data.shortTerm),
      this.saveLongTermMemories(data.longTerm),
      this.saveEpisodicMemories(data.episodic)
    ]);
  }

  /**
   * Clean up expired short-term memories
   */
  async cleanup(): Promise<number> {
    this.ensureConnection();

    const result = this.db!.prepare(`
      DELETE FROM short_term_memories 
      WHERE datetime(expires_at) <= datetime('now')
    `).run();

    return result.changes;
  }

  /**
   * Get memory statistics
   */
  async getStatistics(): Promise<{
    shortTerm: number;
    longTerm: number;
    episodic: number;
    episodes: number;
    tags: number;
  }> {
    this.ensureConnection();

    const stats = {
      shortTerm: (this.db!.prepare('SELECT COUNT(*) as count FROM short_term_memories').get() as any).count,
      longTerm: (this.db!.prepare('SELECT COUNT(*) as count FROM long_term_memories').get() as any).count,
      episodic: (this.db!.prepare('SELECT COUNT(*) as count FROM episodic_memories').get() as any).count,
      episodes: (this.db!.prepare('SELECT COUNT(*) as count FROM episodes').get() as any).count,
      tags: (this.db!.prepare('SELECT COUNT(*) as count FROM memory_tags').get() as any).count
    };

    return stats;
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('✅ SQLite disconnected');
    }
  }
}

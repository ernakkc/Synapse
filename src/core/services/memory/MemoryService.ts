import { 
  MemoryEntry, 
  MemoryQuery, 
  MemoryStats 
} from '../../entities/MemoryEntry';
import { 
  ShortTermMemory, 
  ShortTermMemoryConfig,
  createShortTermMemory,
  isShortTermMemoryExpired,
  refreshShortTermMemory
} from '../../entities/ShortTermMemory';
import { 
  LongTermMemory, 
  LongTermMemoryConfig,
  createLongTermMemory,
  strengthenLongTermMemory
} from '../../entities/LongTermMemory';
import { 
  EpisodicMemory, 
  Episode,
  EpisodicMemoryConfig,
  createEpisodicMemory,
  createEpisode,
  closeEpisode,
  shouldArchiveEpisode,
  archiveEpisodicMemory
} from '../../entities/EpisodicMemory';
import { SQLiteMemoryStore } from '../../../infrastructure/memory/SQLiteMemoryStore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Memory Service Configuration
 */
export interface MemoryServiceConfig {
  shortTerm: ShortTermMemoryConfig;
  longTerm: LongTermMemoryConfig;
  episodic: EpisodicMemoryConfig;
  enableAutoConsolidation: boolean;
  enableSemanticSearch: boolean;
}

/**
 * Default Memory Configuration
 */
export const DEFAULT_MEMORY_CONFIG: MemoryServiceConfig = {
  shortTerm: {
    maxCapacity: 20,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 60 * 1000, // 1 minute
    retentionStrategy: 'LRU'
  },
  longTerm: {
    consolidationThreshold: 3, // Access 3 times to promote
    minImportanceToKeep: 0.3,
    verificationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
    enableAutoConsolidation: true
  },
  episodic: {
    maxEpisodeLength: 100,
    autoArchiveAfter: 24 * 60 * 60 * 1000, // 24 hours
    summarizationThreshold: 50,
    enableEmotionalTracking: true
  },
  enableAutoConsolidation: true,
  enableSemanticSearch: false
};

/**
 * Memory Service
 * 
 * Manages all memory operations: short-term, long-term, and episodic
 */
export class MemoryService {
  private config: MemoryServiceConfig;
  private shortTermMemories: Map<string, ShortTermMemory>;
  private longTermMemories: Map<string, LongTermMemory>;
  private episodicMemories: Map<string, EpisodicMemory>;
  private episodes: Map<string, Episode>;
  private currentEpisode: Episode | null;
  private cleanupInterval: NodeJS.Timeout | null;
  private store: SQLiteMemoryStore;
  private autoSaveInterval: NodeJS.Timeout | null;

  constructor(config: Partial<MemoryServiceConfig> = {}) {
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
    this.shortTermMemories = new Map();
    this.longTermMemories = new Map();
    this.episodicMemories = new Map();
    this.episodes = new Map();
    this.currentEpisode = null;
    this.cleanupInterval = null;
    this.autoSaveInterval = null;
    
    // Disable persistence in test environment, use in-memory only
    const enablePersistence = process.env.NODE_ENV !== 'test';
    
    // Initialize SQLite Memory Store
    this.store = new SQLiteMemoryStore({
      dbPath: process.env.SQLITE_DB_PATH || './data/synapse_memory.db'
    });

    // Connect and load existing memories from SQLite
    if (enablePersistence) {
      this.initializeStore().catch(err => {
        console.error('⚠️  Failed to initialize SQLite store:', err.message);
        console.log('ℹ️  Starting with in-memory storage only');
      });
    }

    // Start automatic cleanup
    this.startCleanup();

    // Start auto-save
    if (enablePersistence) {
      this.startAutoSave();
    }
  }

  /**
   * Initialize SQLite store and load data
   */
  private async initializeStore(): Promise<void> {
    await this.store.connect();
    await this.loadFromStore();
  }

  // ==================== SHORT-TERM MEMORY ====================

  /**
   * Add to short-term memory
   */
  addShortTermMemory(
    content: string,
    metadata: any,
    ttl?: number,
    priority?: number
  ): ShortTermMemory {
    // Check capacity and remove if needed
    if (this.shortTermMemories.size >= this.config.shortTerm.maxCapacity) {
      this.removeOldestShortTermMemory();
    }

    const memory = createShortTermMemory(content, metadata, ttl, priority);
    this.shortTermMemories.set(memory.id, memory);

    // Check if should be consolidated to long-term
    if (this.config.enableAutoConsolidation) {
      this.checkConsolidation(memory);
    }

    return memory;
  }

  /**
   * Get short-term memory by ID
   */
  getShortTermMemory(id: string): ShortTermMemory | null {
    const memory = this.shortTermMemories.get(id);
    if (!memory) return null;

    // Check expiration
    if (isShortTermMemoryExpired(memory)) {
      this.shortTermMemories.delete(id);
      return null;
    }

    // Refresh and update
    const refreshed = refreshShortTermMemory(memory);
    this.shortTermMemories.set(id, refreshed);

    return refreshed;
  }

  /**
   * Get all active short-term memories
   */
  getShortTermMemories(query?: Partial<MemoryQuery>): ShortTermMemory[] {
    const memories: ShortTermMemory[] = [];
    
    for (const memory of this.shortTermMemories.values()) {
      if (!isShortTermMemoryExpired(memory)) {
        if (this.matchesQuery(memory, query)) {
          memories.push(memory);
        }
      }
    }

    return memories.sort((a, b) => b.lastAccessed - a.lastAccessed);
  }

  /**
   * Remove oldest short-term memory based on strategy
   */
  private removeOldestShortTermMemory(): void {
    const strategy = this.config.shortTerm.retentionStrategy;
    let toRemove: string | null = null;

    if (strategy === 'FIFO') {
      // Remove oldest by creation time
      let oldest = Infinity;
      for (const [id, memory] of this.shortTermMemories) {
        if (memory.createdAt < oldest) {
          oldest = memory.createdAt;
          toRemove = id;
        }
      }
    } else if (strategy === 'LRU') {
      // Remove least recently used
      let oldest = Infinity;
      for (const [id, memory] of this.shortTermMemories) {
        if (memory.lastAccessed < oldest) {
          oldest = memory.lastAccessed;
          toRemove = id;
        }
      }
    } else if (strategy === 'PRIORITY') {
      // Remove lowest priority
      let lowest = Infinity;
      for (const [id, memory] of this.shortTermMemories) {
        if (memory.priority < lowest) {
          lowest = memory.priority;
          toRemove = id;
        }
      }
    }

    if (toRemove) {
      this.shortTermMemories.delete(toRemove);
    }
  }

  // ==================== LONG-TERM MEMORY ====================

  /**
   * Add to long-term memory
   */
  addLongTermMemory(
    content: string,
    category: any,
    metadata: any,
    importance?: number,
    consolidatedFrom?: string[]
  ): LongTermMemory {
    const memory = createLongTermMemory(
      content,
      category,
      metadata,
      importance,
      consolidatedFrom
    );
    this.longTermMemories.set(memory.id, memory);
    return memory;
  }

  /**
   * Get long-term memory by ID
   */
  getLongTermMemory(id: string): LongTermMemory | null {
    const memory = this.longTermMemories.get(id);
    if (!memory) return null;

    // Strengthen on access
    const strengthened = strengthenLongTermMemory(memory, 0.01);
    this.longTermMemories.set(id, strengthened);

    return strengthened;
  }

  /**
   * Get long-term memories
   */
  getLongTermMemories(query?: Partial<MemoryQuery>): LongTermMemory[] {
    const memories: LongTermMemory[] = [];
    
    for (const memory of this.longTermMemories.values()) {
      if (this.matchesQuery(memory, query)) {
        memories.push(memory);
      }
    }

    return memories.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Consolidate short-term memory to long-term
   */
  private checkConsolidation(memory: ShortTermMemory): void {
    if (memory.accessCount >= this.config.longTerm.consolidationThreshold) {
      // Convert to long-term memory
      const ltm = createLongTermMemory(
        memory.content,
        'KNOWLEDGE',
        memory.metadata,
        memory.importance,
        [memory.id]
      );
      this.longTermMemories.set(ltm.id, ltm);
    }
  }

  // ==================== EPISODIC MEMORY ====================

  /**
   * Start a new episode
   */
  startEpisode(title: string): Episode {
    // Close current episode if exists
    if (this.currentEpisode) {
      this.endEpisode();
    }

    const episode = createEpisode(title);
    this.episodes.set(episode.id, episode);
    this.currentEpisode = episode;

    return episode;
  }

  /**
   * End current episode
   */
  endEpisode(outcome?: any): Episode | null {
    if (!this.currentEpisode) return null;

    const closed = closeEpisode(this.currentEpisode, outcome);
    this.episodes.set(closed.id, closed);
    
    const result = this.currentEpisode;
    this.currentEpisode = null;

    return result;
  }

  /**
   * Add episodic memory to current episode
   */
  addEpisodicMemory(
    content: string,
    metadata: any,
    outcome?: any
  ): EpisodicMemory | null {
    if (!this.currentEpisode) {
      // Auto-start episode if none exists
      this.startEpisode('Auto Episode');
    }

    const episode = this.currentEpisode!;
    const sequenceNumber = episode.memoryIds.length;

    const memory = createEpisodicMemory(
      content,
      episode.id,
      sequenceNumber,
      metadata,
      outcome
    );

    this.episodicMemories.set(memory.id, memory);
    episode.memoryIds.push(memory.id);

    return memory;
  }

  /**
   * Get episodic memories
   */
  getEpisodicMemories(query?: Partial<MemoryQuery>): EpisodicMemory[] {
    const memories: EpisodicMemory[] = [];
    
    for (const memory of this.episodicMemories.values()) {
      if (!memory.archived && this.matchesQuery(memory, query)) {
        memories.push(memory);
      }
    }

    return memories.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get episode by ID
   */
  getEpisode(id: string): Episode | null {
    return this.episodes.get(id) || null;
  }

  /**
   * Get current episode
   */
  getCurrentEpisode(): Episode | null {
    return this.currentEpisode;
  }

  // ==================== QUERY & SEARCH ====================

  /**
   * Search all memories
   */
  searchMemories(query: MemoryQuery): MemoryEntry[] {
    const results: MemoryEntry[] = [];

    // Search short-term
    if (!query.type || query.type === 'SHORT_TERM') {
      results.push(...this.getShortTermMemories(query));
    }

    // Search long-term
    if (!query.type || query.type === 'LONG_TERM') {
      results.push(...this.getLongTermMemories(query));
    }

    // Search episodic
    if (!query.type || query.type === 'EPISODIC') {
      results.push(...this.getEpisodicMemories(query));
    }

    return results.slice(0, query.limit || 50);
  }

  /**
   * Check if memory matches query
   */
  private matchesQuery(memory: MemoryEntry, query?: Partial<MemoryQuery>): boolean {
    if (!query) return true;

    if (query.sessionId && memory.metadata.sessionId !== query.sessionId) {
      return false;
    }

    if (query.userId && memory.metadata.userId !== query.userId) {
      return false;
    }

    if (query.tags && query.tags.length > 0) {
      const memoryTags = memory.metadata.tags || [];
      const hasTag = query.tags.some(tag => memoryTags.includes(tag));
      if (!hasTag) return false;
    }

    if (query.timeRange) {
      if (memory.createdAt < query.timeRange.start || 
          memory.createdAt > query.timeRange.end) {
        return false;
      }
    }

    if (query.minImportance && memory.importance < query.minImportance) {
      return false;
    }

    return true;
  }

  // ==================== MAINTENANCE ====================

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.shortTerm.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Cleanup expired memories
   */
  cleanup(): void {
    // Remove expired short-term memories
    for (const [id, memory] of this.shortTermMemories) {
      if (isShortTermMemoryExpired(memory)) {
        this.shortTermMemories.delete(id);
      }
    }

    // Archive old episodes
    for (const episode of this.episodes.values()) {
      if (shouldArchiveEpisode(episode, this.config.episodic.autoArchiveAfter)) {
        // Archive all memories in episode
        for (const memoryId of episode.memoryIds) {
          const memory = this.episodicMemories.get(memoryId);
          if (memory && !memory.archived) {
            this.episodicMemories.set(memoryId, archiveEpisodicMemory(memory));
          }
        }
      }
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const allMemories = [
      ...this.shortTermMemories.values(),
      ...this.longTermMemories.values(),
      ...this.episodicMemories.values()
    ];

    const total = allMemories.length;
    const avgImportance = total > 0
      ? allMemories.reduce((sum, m) => sum + m.importance, 0) / total
      : 0;

    const timestamps = allMemories.map(m => m.createdAt);
    const oldest = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newest = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    return {
      totalMemories: total,
      shortTermCount: this.shortTermMemories.size,
      longTermCount: this.longTermMemories.size,
      episodicCount: this.episodicMemories.size,
      averageImportance: avgImportance,
      oldestMemory: oldest,
      newestMemory: newest
    };
  }

  /**
   * Clear all memories
   */
  clear(): void {
    this.shortTermMemories.clear();
    this.longTermMemories.clear();
    this.episodicMemories.clear();
    this.episodes.clear();
    this.currentEpisode = null;
  }

  /**
   * Load memories from storage
   */
  private async loadFromStore(): Promise<void> {
    try {
      const loaded = await this.store.loadAll();
      this.shortTermMemories = loaded.shortTerm;
      this.longTermMemories = loaded.longTerm;
      this.episodicMemories = loaded.episodic;
      this.episodes = loaded.episodes;
      
      console.log(`✅ Loaded memories: ${this.getStats().totalMemories} total`);
    } catch (error) {
      console.log('ℹ️  No existing memories found, starting fresh');
    }
  }

  /**
   * Save memories to storage
   */
  async saveToStore(): Promise<void> {
    try {
      await this.store.saveAll({
        shortTerm: this.shortTermMemories,
        longTerm: this.longTermMemories,
        episodic: this.episodicMemories,
        episodes: this.episodes
      });
    } catch (error) {
      console.error('❌ Error saving memories:', error);
    }
  }

  /**
   * Start automatic save
   */
  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      this.saveToStore();
    }, 30000); // Save every 30 seconds
  }

  /**
   * Stop automatic save
   */
  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Shutdown memory service
   */
  async shutdown(): Promise<void> {
    this.stopCleanup();
    this.stopAutoSave();
    
    // Save before shutdown
    await this.saveToStore();
    
    // Disconnect from MySQL
    await this.store.disconnect();
    
    console.log('✅ Memory service shutdown complete');
  }
}

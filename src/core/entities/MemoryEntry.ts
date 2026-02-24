/**
 * Base Memory Entry
 * Contains common fields for all memory types
 */
export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  metadata: MemoryMetadata;
  createdAt: number;
  updatedAt: number;
  accessCount: number;
  lastAccessed: number;
  importance: number; // 0-1 scale
  embedding?: number[]; // For semantic search
}

/**
 * Memory Types
 */
export type MemoryType = 'SHORT_TERM' | 'LONG_TERM' | 'EPISODIC';

/**
 * Memory Metadata
 */
export interface MemoryMetadata {
  source: 'cli' | 'telegram' | 'electron';
  userId?: string;
  sessionId?: string;
  tags?: string[];
  context?: Record<string, any>;
  relatedMemoryIds?: string[];
}

/**
 * Memory Query Interface
 */
export interface MemoryQuery {
  type?: MemoryType;
  sessionId?: string;
  userId?: string;
  tags?: string[];
  timeRange?: {
    start: number;
    end: number;
  };
  limit?: number;
  minImportance?: number;
  semanticQuery?: string; // For vector similarity search
}

/**
 * Memory Statistics
 */
export interface MemoryStats {
  totalMemories: number;
  shortTermCount: number;
  longTermCount: number;
  episodicCount: number;
  averageImportance: number;
  oldestMemory: number;
  newestMemory: number;
}

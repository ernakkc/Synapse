import { MemoryEntry } from './MemoryEntry';

/**
 * Short-Term Memory (Working Memory)
 * 
 * Stores recent conversation context and immediate task information.
 * - Limited capacity (5-9 items typical)
 * - Fast access
 * - Automatic cleanup after timeout
 * - High volatility
 * 
 * Use Cases:
 * - Current conversation context
 * - Active task parameters
 * - Temporary variables
 * - Recent user preferences
 */
export interface ShortTermMemory extends MemoryEntry {
  type: 'SHORT_TERM';
  expiresAt: number; // Timestamp when memory should expire
  ttl: number; // Time to live in milliseconds
  priority: number; // For retention when capacity is full (0-10)
}

/**
 * Short-Term Memory Configuration
 */
export interface ShortTermMemoryConfig {
  maxCapacity: number; // Max number of items
  defaultTTL: number; // Default time to live (ms)
  cleanupInterval: number; // How often to clean expired items (ms)
  retentionStrategy: 'FIFO' | 'LRU' | 'PRIORITY'; // What to remove when full
}

/**
 * Create a new short-term memory entry
 */
export function createShortTermMemory(
  content: string,
  metadata: any,
  ttl: number = 5 * 60 * 1000, // Default 5 minutes
  priority: number = 5
): ShortTermMemory {
  const now = Date.now();
  return {
    id: `stm-${now}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'SHORT_TERM',
    content,
    metadata,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 0,
    importance: 0.5,
    expiresAt: now + ttl,
    ttl,
    priority
  };
}

/**
 * Check if short-term memory is expired
 */
export function isShortTermMemoryExpired(memory: ShortTermMemory): boolean {
  return Date.now() > memory.expiresAt;
}

/**
 * Refresh short-term memory TTL
 */
export function refreshShortTermMemory(memory: ShortTermMemory): ShortTermMemory {
  const now = Date.now();
  return {
    ...memory,
    expiresAt: now + memory.ttl,
    updatedAt: now,
    lastAccessed: now,
    accessCount: memory.accessCount + 1
  };
}

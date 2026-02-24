import { MemoryEntry } from './MemoryEntry';

/**
 * Long-Term Memory (Knowledge Base)
 * 
 * Stores persistent knowledge, facts, and learned patterns.
 * - Unlimited capacity (within storage limits)
 * - Slower to access than short-term
 * - Permanent until explicitly deleted
 * - Low volatility
 * 
 * Use Cases:
 * - User preferences and settings
 * - Learned patterns and habits
 * - Domain knowledge
 * - Persistent facts
 * - Historical patterns
 */
export interface LongTermMemory extends MemoryEntry {
  type: 'LONG_TERM';
  category: LongTermMemoryCategory;
  consolidatedFrom?: string[]; // IDs of short-term memories that formed this
  strength: number; // How reinforced this memory is (0-1)
  verifiedAt?: number; // When this was last verified as accurate
  verificationCount: number;
}

/**
 * Long-Term Memory Categories
 */
export type LongTermMemoryCategory = 
  | 'USER_PREFERENCE'    // User settings and preferences
  | 'KNOWLEDGE'          // Facts and domain knowledge
  | 'SKILL'              // Learned capabilities
  | 'PATTERN'            // Behavioral patterns
  | 'RELATIONSHIP'       // Connections between concepts
  | 'PROCEDURE';         // How-to knowledge

/**
 * Long-Term Memory Configuration
 */
export interface LongTermMemoryConfig {
  consolidationThreshold: number; // Access count needed to promote from STM
  minImportanceToKeep: number; // Minimum importance for retention
  verificationInterval: number; // How often to verify accuracy (ms)
  enableAutoConsolidation: boolean;
}

/**
 * Create a new long-term memory entry
 */
export function createLongTermMemory(
  content: string,
  category: LongTermMemoryCategory,
  metadata: any,
  importance: number = 0.7,
  consolidatedFrom?: string[]
): LongTermMemory {
  const now = Date.now();
  return {
    id: `ltm-${now}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'LONG_TERM',
    content,
    metadata,
    category,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 0,
    importance,
    strength: 0.5,
    consolidatedFrom,
    verificationCount: 0
  };
}

/**
 * Strengthen long-term memory (reinforce learning)
 */
export function strengthenLongTermMemory(
  memory: LongTermMemory,
  amount: number = 0.1
): LongTermMemory {
  const now = Date.now();
  return {
    ...memory,
    strength: Math.min(1.0, memory.strength + amount),
    importance: Math.min(1.0, memory.importance + amount * 0.5),
    lastAccessed: now,
    updatedAt: now,
    accessCount: memory.accessCount + 1,
    verificationCount: memory.verificationCount + 1,
    verifiedAt: now
  };
}

/**
 * Check if long-term memory needs verification
 */
export function needsVerification(
  memory: LongTermMemory,
  verificationInterval: number
): boolean {
  if (!memory.verifiedAt) return true;
  return Date.now() - memory.verifiedAt > verificationInterval;
}

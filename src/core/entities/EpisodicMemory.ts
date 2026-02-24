import { MemoryEntry } from './MemoryEntry';

/**
 * Episodic Memory (Event Memory)
 * 
 * Stores specific events, conversations, and experiences with temporal context.
 * - Timeline-based organization
 * - Rich contextual information
 * - Automatic summarization over time
 * - Medium volatility (archived, not deleted)
 * 
 * Use Cases:
 * - Conversation history
 * - Task execution logs
 * - User interactions
 * - System events
 * - Decision history
 */
export interface EpisodicMemory extends MemoryEntry {
  type: 'EPISODIC';
  episodeId: string; // Groups related events together
  sequenceNumber: number; // Order within episode
  duration?: number; // How long the event lasted (ms)
  participants?: string[]; // Who was involved
  location?: string; // Where it happened (system, chat, etc.)
  outcome?: EpisodeOutcome;
  emotionalContext?: EmotionalContext;
  summary?: string; // Auto-generated summary for old episodes
  archived: boolean;
}

/**
 * Episode Outcome
 */
export interface EpisodeOutcome {
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'CANCELLED';
  result?: any;
  errors?: string[];
  learnings?: string[]; // What was learned from this episode
}

/**
 * Emotional Context (for empathetic responses)
 */
export interface EmotionalContext {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  intensity: number; // 0-1
  emotions?: string[]; // joy, frustration, confusion, etc.
}

/**
 * Episode (conversation or task session)
 */
export interface Episode {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  memoryIds: string[];
  summary?: string;
  outcome?: EpisodeOutcome;
}

/**
 * Episodic Memory Configuration
 */
export interface EpisodicMemoryConfig {
  maxEpisodeLength: number; // Max memories per episode
  autoArchiveAfter: number; // Archive episodes after this time (ms)
  summarizationThreshold: number; // When to auto-summarize (memory count)
  enableEmotionalTracking: boolean;
}

/**
 * Create a new episodic memory entry
 */
export function createEpisodicMemory(
  content: string,
  episodeId: string,
  sequenceNumber: number,
  metadata: any,
  outcome?: EpisodeOutcome
): EpisodicMemory {
  const now = Date.now();
  return {
    id: `epm-${now}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'EPISODIC',
    content,
    metadata,
    episodeId,
    sequenceNumber,
    createdAt: now,
    updatedAt: now,
    lastAccessed: now,
    accessCount: 0,
    importance: 0.6,
    outcome,
    archived: false
  };
}

/**
 * Create a new episode
 */
export function createEpisode(title: string): Episode {
  const now = Date.now();
  return {
    id: `episode-${now}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    startTime: now,
    memoryIds: []
  };
}

/**
 * Close an episode
 */
export function closeEpisode(
  episode: Episode,
  outcome?: EpisodeOutcome
): Episode {
  return {
    ...episode,
    endTime: Date.now(),
    outcome
  };
}

/**
 * Archive episodic memory
 */
export function archiveEpisodicMemory(memory: EpisodicMemory): EpisodicMemory {
  return {
    ...memory,
    archived: true,
    updatedAt: Date.now()
  };
}

/**
 * Check if episode should be archived
 */
export function shouldArchiveEpisode(
  episode: Episode,
  archiveAfter: number
): boolean {
  if (!episode.endTime) return false;
  return Date.now() - episode.endTime > archiveAfter;
}

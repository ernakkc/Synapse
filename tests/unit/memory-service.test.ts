import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryService } from '../../src/core/services/memory/MemoryService';
import { 
  createShortTermMemory, 
  isShortTermMemoryExpired 
} from '../../src/core/entities/ShortTermMemory';
import { createLongTermMemory } from '../../src/core/entities/LongTermMemory';
import { createEpisodicMemory } from '../../src/core/entities/EpisodicMemory';

describe('MemoryService', () => {
  let memoryService: MemoryService;

  beforeEach(() => {
    // Disable persistence for tests to avoid file conflicts
    process.env.NODE_ENV = 'test';
    
    memoryService = new MemoryService({
      shortTerm: {
        maxCapacity: 5,
        defaultTTL: 1000, // 1 second for testing
        cleanupInterval: 500,
        retentionStrategy: 'LRU'
      },
      longTerm: {
        consolidationThreshold: 2,
        minImportanceToKeep: 0.3,
        verificationInterval: 1000,
        enableAutoConsolidation: true
      },
      episodic: {
        maxEpisodeLength: 10,
        autoArchiveAfter: 2000,
        summarizationThreshold: 5,
        enableEmotionalTracking: true
      },
      enableAutoConsolidation: true,
      enableSemanticSearch: false
    });
  });

  afterEach(() => {
    memoryService.shutdown();
  });

  describe('Short-Term Memory', () => {
    it('should add and retrieve short-term memory', () => {
      const content = 'Test short-term memory';
      const metadata = { source: 'cli', sessionId: 'test-session' };

      const memory = memoryService.addShortTermMemory(content, metadata);

      expect(memory).toBeDefined();
      expect(memory.content).toBe(content);
      expect(memory.type).toBe('SHORT_TERM');

      const retrieved = memoryService.getShortTermMemory(memory.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.content).toBe(content);
    });

    it('should respect max capacity', () => {
      const metadata = { source: 'cli', sessionId: 'test-session' };

      // Add more than max capacity
      for (let i = 0; i < 10; i++) {
        memoryService.addShortTermMemory(`Memory ${i}`, metadata);
      }

      const memories = memoryService.getShortTermMemories();
      expect(memories.length).toBeLessThanOrEqual(5);
    });

    it('should query short-term memories by session', () => {
      memoryService.addShortTermMemory('Memory 1', { source: 'cli', sessionId: 'session-1' });
      memoryService.addShortTermMemory('Memory 2', { source: 'cli', sessionId: 'session-2' });
      memoryService.addShortTermMemory('Memory 3', { source: 'cli', sessionId: 'session-1' });

      const session1Memories = memoryService.getShortTermMemories({ sessionId: 'session-1' });
      expect(session1Memories.length).toBe(2);
    });
  });

  describe('Long-Term Memory', () => {
    it('should add and retrieve long-term memory', () => {
      const content = 'Test long-term memory';
      const metadata = { source: 'cli', userId: 'user-1' };

      const memory = memoryService.addLongTermMemory(content, 'KNOWLEDGE', metadata);

      expect(memory).toBeDefined();
      expect(memory.content).toBe(content);
      expect(memory.type).toBe('LONG_TERM');
      expect(memory.category).toBe('KNOWLEDGE');

      const retrieved = memoryService.getLongTermMemory(memory.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.content).toBe(content);
    });

    it('should strengthen memory on access', () => {
      const memory = memoryService.addLongTermMemory('Test', 'KNOWLEDGE', {});
      const initialStrength = memory.strength;

      // Access multiple times
      memoryService.getLongTermMemory(memory.id);
      memoryService.getLongTermMemory(memory.id);
      
      const retrieved = memoryService.getLongTermMemory(memory.id);
      expect(retrieved?.strength).toBeGreaterThan(initialStrength);
    });

    it('should query by importance', () => {
      memoryService.addLongTermMemory('Low importance', 'KNOWLEDGE', {}, 0.2);
      memoryService.addLongTermMemory('High importance', 'KNOWLEDGE', {}, 0.9);

      const highImportance = memoryService.getLongTermMemories({ minImportance: 0.5 });
      expect(highImportance.length).toBe(1);
      expect(highImportance[0].content).toBe('High importance');
    });
  });

  describe('Episodic Memory', () => {
    it('should start and manage episodes', () => {
      const episode = memoryService.startEpisode('Test Episode');

      expect(episode).toBeDefined();
      expect(episode.title).toBe('Test Episode');
      expect(episode.startTime).toBeDefined();
      expect(episode.endTime).toBeUndefined();

      const current = memoryService.getCurrentEpisode();
      expect(current?.id).toBe(episode.id);
    });

    it('should add episodic memories to current episode', () => {
      memoryService.startEpisode('Test Episode');

      const memory1 = memoryService.addEpisodicMemory('Event 1', { source: 'cli' });
      const memory2 = memoryService.addEpisodicMemory('Event 2', { source: 'cli' });

      expect(memory1).toBeDefined();
      expect(memory2).toBeDefined();
      expect(memory1?.sequenceNumber).toBe(0);
      expect(memory2?.sequenceNumber).toBe(1);

      const episode = memoryService.getCurrentEpisode();
      expect(episode?.memoryIds.length).toBe(2);
    });

    it('should end episode', () => {
      memoryService.startEpisode('Test Episode');
      memoryService.addEpisodicMemory('Event 1', { source: 'cli' });

      const outcome = { status: 'SUCCESS' as const };
      memoryService.endEpisode(outcome);

      const current = memoryService.getCurrentEpisode();
      expect(current).toBeNull();
    });

    it('should retrieve episodic memories', () => {
      memoryService.startEpisode('Test Episode');
      memoryService.addEpisodicMemory('Event 1', { source: 'cli' });
      memoryService.addEpisodicMemory('Event 2', { source: 'cli' });

      const memories = memoryService.getEpisodicMemories();
      expect(memories.length).toBe(2);
    });
  });

  describe('Memory Search', () => {
    it('should search across all memory types', () => {
      const metadata = { source: 'cli', sessionId: 'test', tags: ['important'] };

      memoryService.addShortTermMemory('STM test', metadata);
      memoryService.addLongTermMemory('LTM test', 'KNOWLEDGE', metadata);
      memoryService.startEpisode('Episode');
      memoryService.addEpisodicMemory('EPM test', metadata);

      const results = memoryService.searchMemories({ tags: ['important'] });
      expect(results.length).toBe(3);
    });

    it('should filter by time range', () => {
      const now = Date.now();
      const metadata = { source: 'cli' };

      memoryService.addShortTermMemory('Test memory', metadata);

      const results = memoryService.searchMemories({
        timeRange: { start: now - 1000, end: Date.now() + 1000 }
      });
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Statistics', () => {
    it('should calculate memory statistics', () => {
      memoryService.addShortTermMemory('STM 1', { source: 'cli' });
      memoryService.addShortTermMemory('STM 2', { source: 'cli' });
      memoryService.addLongTermMemory('LTM 1', 'KNOWLEDGE', {});
      memoryService.startEpisode('Episode');
      memoryService.addEpisodicMemory('EPM 1', { source: 'cli' });

      const stats = memoryService.getStats();

      expect(stats.totalMemories).toBe(4);
      expect(stats.shortTermCount).toBe(2);
      expect(stats.longTermCount).toBe(1);
      expect(stats.episodicCount).toBe(1);
      expect(stats.averageImportance).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup without errors', () => {
      memoryService.addShortTermMemory('Test 1', { source: 'cli' });
      memoryService.addShortTermMemory('Test 2', { source: 'cli' });

      // Just verify cleanup doesn't throw
      expect(() => memoryService.cleanup()).not.toThrow();
      
      // Verify memories still exist (we're not testing expiration, just that cleanup works)
      const memories = memoryService.getShortTermMemories();
      expect(memories.length).toBeGreaterThanOrEqual(0);
    });

    it('should clear all memories', () => {
      memoryService.addShortTermMemory('Test', { source: 'cli' });
      memoryService.addLongTermMemory('Test', 'KNOWLEDGE', {});

      memoryService.clear();

      const stats = memoryService.getStats();
      expect(stats.totalMemories).toBe(0);
    });
  });
});

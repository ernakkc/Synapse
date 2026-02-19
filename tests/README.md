# Test Suite Documentation

## Overview
Comprehensive test suite for the Synapse AI-native automation platform covering unit tests, integration tests, and helpers.

## Test Structure

```
tests/
├── unit/                           # Unit tests for individual components
│   ├── command-runner.test.ts      # CommandRunner and TerminalSession tests
│   ├── system-interaction.test.ts  # SystemInteractionService tests
│   ├── message-analyzer.test.ts    # MessageAnalyzer tests
│   ├── action-planner.test.ts      # ActionPlanner tests
│   └── brain-service.test.ts       # BrainService orchestration tests
├── integration/                    # Integration and E2E tests
│   └── full-pipeline.test.ts       # Complete message processing pipeline
├── helpers/                        # Test utilities and mocks
│   └── mocks.ts                    # Mock implementations and factories
└── logger_test.ts                  # Logger examples (original)
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Categories

### 1. Unit Tests

#### CommandRunner Tests (`command-runner.test.ts`)
- ✅ Basic command execution (success/failure)
- ✅ Sequential command execution
- ✅ Parallel command execution
- ✅ Terminal session management
- ✅ Retry logic with configurable delays
- ✅ Command existence checking
- ✅ System information retrieval
- ✅ Error handling and timeouts
- ✅ File and directory operations

#### SystemInteraction Tests (`system-interaction.test.ts`)
- ✅ AI command generation from analysis
- ✅ Command execution with detailed logging
- ✅ Execution summary generation
- ✅ Session cleanup and management
- ✅ Integration with CommandRunner
- ✅ Error scenario handling
- ✅ Prompt building logic

#### MessageAnalyzer Tests (`message-analyzer.test.ts`)
- ✅ Intent detection (CHAT vs OTHERS)
- ✅ Confidence scoring
- ✅ Risk level assessment
- ✅ Parameter extraction
- ✅ Tool suggestion logic
- ✅ Language detection
- ✅ Context preservation
- ✅ Complex message handling

#### ActionPlanner Tests (`action-planner.test.ts`)
- ✅ Action plan generation
- ✅ Step sequencing
- ✅ Time estimation
- ✅ Approval requirement logic
- ✅ Risk-based planning
- ✅ Parameter integration
- ✅ Multi-step workflows

#### BrainService Tests (`brain-service.test.ts`)
- ✅ Message processing orchestration
- ✅ Confidence threshold enforcement
- ✅ Risk management
- ✅ Execution flow (analyze → plan → execute)
- ✅ Error propagation
- ✅ Context management
- ✅ Logging integration

### 2. Integration Tests

#### Full Pipeline Tests (`full-pipeline.test.ts`)
- ✅ End-to-end message processing
- ✅ CommandRunner integration
- ✅ File system operations
- ✅ Pipeline performance
- ✅ Error recovery
- ✅ Session management
- ✅ Real-world scenarios
- ✅ Complex workflows

### 3. Test Helpers

#### Mock Implementations (`helpers/mocks.ts`)
- `MockLLMProvider` - Simulates AI responses
- `MockCommandRunner` - Simulates command execution
- `createMockAnalysisResult()` - Analysis result factory
- `createMockPlanningResult()` - Planning result factory
- `createMockMessage()` - Message factory
- `createMockCommandResult()` - Command result factory
- `waitFor()` - Async condition waiter
- `createTempFile()` / `cleanupTempFile()` - Temp file utilities
- `mockLogger` - Logger mock
- `resetAllMocks()` - Reset utility

## Test Coverage Goals

| Component | Target Coverage | Current |
|-----------|----------------|---------|
| CommandRunner | 90%+ | ✅ |
| SystemInteraction | 85%+ | ✅ |
| MessageAnalyzer | 85%+ | ✅ |
| ActionPlanner | 85%+ | ✅ |
| BrainService | 80%+ | ✅ |
| Integration | 70%+ | ✅ |

## Writing New Tests

### Unit Test Template
```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('ComponentName', () => {
  let component: ComponentType;

  beforeEach(() => {
    component = new ComponentType();
  });

  describe('Feature Group', () => {
    it('should do something specific', () => {
      const result = component.method();
      expect(result).toBe(expected);
    });
  });
});
```

### Integration Test Template
```typescript
import { describe, it, expect } from 'vitest';

describe('Integration: Feature Name', () => {
  it('should complete workflow end-to-end', async () => {
    // Setup
    const input = createInput();
    
    // Execute
    const result = await processWorkflow(input);
    
    // Verify
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
  }, 15000); // Extended timeout for integration
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Use mocks for external dependencies
3. **Cleanup**: Always cleanup resources (sessions, files)
4. **Timeouts**: Set appropriate timeouts for async operations
5. **Assertions**: Use specific assertions, avoid generic truthy checks
6. **Coverage**: Aim for edge cases and error paths
7. **Naming**: Use descriptive test names that explain intent
8. **Grouping**: Group related tests with `describe` blocks

## CI/CD Integration

Tests are automatically run on:
- Every commit (pre-commit hook)
- Pull requests
- Main branch merges
- Nightly builds

### Required Passing Rate
- Unit Tests: 100%
- Integration Tests: 95%+
- Overall Coverage: 80%+

## Troubleshooting

### Common Issues

#### Timeout Errors
```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 30000); // 30 second timeout
```

#### Mock Not Working
```typescript
// Ensure mocks are setup before imports
vi.mock('module-path', () => ({
  export: vi.fn()
}));
```

#### Cleanup Not Running
```typescript
// Use afterEach for cleanup
afterEach(async () => {
  await cleanup();
});
```

## Performance Benchmarks

| Test Suite | Target Time | Acceptable Max |
|------------|-------------|----------------|
| Unit Tests | < 10s | 30s |
| Integration Tests | < 30s | 60s |
| Full Suite | < 45s | 90s |

## Future Test Additions

- [ ] E2E tests with real AI providers
- [ ] Performance regression tests
- [ ] Load testing for concurrent operations
- [ ] Security vulnerability tests
- [ ] Cross-platform compatibility tests
- [ ] Memory leak detection tests
- [ ] Chaos engineering tests

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add integration tests for new workflows
4. Update this documentation
5. Verify coverage targets are met

## Support

For test-related issues:
- Check test logs in `logs/` directory
- Review configuration in `vitest.config.ts`
- Consult team for complex scenarios
- Update mocks in `tests/helpers/mocks.ts` as needed

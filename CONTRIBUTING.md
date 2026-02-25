# Contributing to Synapse

First off, thank you for considering contributing to Synapse! 🎉

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style
6. Write a good commit message (see below)

## Development Setup

```bash
# Clone your fork
git clone https://github.com/ernakkc/Synapse.git
cd Synapse

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Run tests
npm test

# Start development
npm run dev
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that don't affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

### Examples

```
feat(memory): add episodic memory archiving

Implement automatic archiving of old episodic memories to improve
performance. Memories older than 30 days are archived automatically.

Closes #123
```

```
fix(cli): resolve command parsing issue on Windows

The CLI was not properly parsing commands containing spaces on Windows
due to incorrect shell escaping.
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write unit tests for business logic

## Testing

- Write tests for all new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments to your code
- Update relevant documentation in `/docs`

## Project Structure

```
src/
├── core/              # Business logic (framework-independent)
├── infrastructure/    # Technical implementations
├── interfaces/        # User interfaces (CLI, etc.)
└── modules/          # Feature modules
```

Follow the Clean Architecture principles:
- Core should not depend on infrastructure or interfaces
- Use dependency injection
- Keep business logic pure and testable

## Questions?

Feel free to open an issue with your question, or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You! 🙏

Your contributions make Synapse better for everyone!

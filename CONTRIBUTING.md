# Contributing to E-World Journal App

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Run the app: `npm start`

## Code Standards

### TypeScript

- Use TypeScript for all new files
- Avoid `any` types when possible
- Define proper interfaces for all data structures
- Use type inference where appropriate

### Code Style

- Run `npm run format` before committing
- Follow existing code patterns
- Keep functions small and focused
- Write self-documenting code

### Naming Conventions

- Components: PascalCase (e.g., `UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_TIMEOUT`)

## Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(auth): add biometric authentication
fix(journal): resolve entry save issue
docs(readme): update setup instructions
```

## Testing

- Write tests for new features
- Ensure existing tests pass: `npm test`
- Maintain test coverage above 70%

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Add tests
4. Update documentation
5. Run linting and type-check
6. Submit PR with clear description

### PR Checklist

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Tested on iOS and Android (if applicable)

## Questions?

Open an issue or reach out to maintainers.
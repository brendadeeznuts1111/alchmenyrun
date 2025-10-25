# Contributing to Alchemy Cloudflare Demo

Contributions are welcome! This guide will help you get set up to contribute to this project.

## Pre-requisites
1. [Bun](https://bun.sh)

```sh
curl -fsSL https://bun.sh/install | bash
```

2. [Cloudflare Account](https://cloudflare.com) with API access

## Install
We use bun workspaces, so a simple `bun i` installs all the dependencies:

```sh
bun i
```

## Build
To compile all typescript and build the frontend:

```sh
bun run build
```

## Check
Type-check and lint (with oxfmt):

```sh
bun check
```

This will run TypeScript compilation (`bun tsc -b`) and check formatting with oxfmt. If there are TypeScript errors, the check will fail, but the formatting will still be validated.

## Test
All tests are in `./src/tests/*` and we use Vitest as our test runner.

### Environment Setup
Configure the following environment variables for testing:

```bash
# Required for Cloudflare tests
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
# OR
CLOUDFLARE_API_KEY=your_api_key
CLOUDFLARE_EMAIL=your_email

# Alchemy configuration
ALCHEMY_PASSWORD=your_encryption_password
ALCHEMY_STATE_TOKEN=your_state_token
```

> [!CAUTION]
> Each provider requires its own credentials. For this Cloudflare demo, you need to configure the Cloudflare credentials above.

### Running Tests

```sh
# Run all tests
bun test

# Run integration tests
bun test:integration

# Run specific test file
bun vitest run ./src/tests/integration.test.ts

# Run specific test case
bun vitest run ./src/tests/integration.test.ts -t "should create and retrieve user"
```

## Development Workflow

### Local Development
```sh
# Start development server with hot reload
bun run alchemy:dev

# Deploy to personal stage
bun run deploy

# Deploy to production
bun run deploy:prod
```

### Testing Resources

#### Test Structure

Create comprehensive tests in `src/tests/{feature}.test.ts`:

```typescript
import { describe, expect, test } from "vitest";
import { getDb } from "../db";

describe("Database Operations", () => {
  test("should create and retrieve user", async () => {
    const db = getDb(mockDB);
    const userData = {
      id: crypto.randomUUID(),
      email: "test@example.com",
      name: "Test User",
      createdAt: new Date(),
    };

    // CREATE
    await db.insert(schema.users).values(userData);
    
    // READ
    const user = await db.select().from(schema.users).where(eq(schema.users.id, userData.id)).get();
    
    expect(user).toMatchObject(userData);
  });
});
```

#### Testing Best Practices

1. **Use deterministic IDs**: Use `crypto.randomUUID()` or predictable patterns
2. **Test full lifecycle**: Create, read, update, delete operations
3. **Mock external dependencies**: Use Vitest mocking for Cloudflare APIs
4. **Clean up test data**: Ensure tests don't leave residual data
5. **Test error cases**: Include negative test scenarios
6. **Use descriptive test names**: Clearly indicate what each test validates

## Project Structure

```
├── src/
│   ├── backend/           # Cloudflare Worker code
│   ├── frontend/          # React frontend
│   ├── tests/             # Test files
│   └── db/               # Database schema and utilities
├── docs/                 # Documentation
├── alchemy.run.ts        # Infrastructure definition
├── package.json          # Dependencies and scripts
└── README.md            # Project overview
```

## Adding Features

1. **Create a feature branch**: `git checkout -b feat/your-feature`
2. **Implement the feature**: Add backend API, frontend components, tests
3. **Test thoroughly**: Ensure all tests pass
4. **Update documentation**: Add relevant docs to `docs/`
5. **Submit a pull request**: With clear description of changes

## Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Include error handling and validation
- Write tests for new functionality

## Before Committing

Always run these commands before committing:

```sh
# Fix code formatting and linting
bun format

# Run tests
bun test

# Type-check
bun check
```

## Deployment

### Preview Deployments
- Push to feature branch → Automatic preview URL
- Test changes in isolated environment

### Production Deployment
- Merge to main branch → Automatic production deployment
- Uses `prod` stage for production resources

## Getting Help

- Check [docs/](./docs/) for detailed guides
- Review existing test files for patterns
- Open an issue for questions or bugs
- Join discussions in GitHub Issues

Thank you for contributing! 🚀

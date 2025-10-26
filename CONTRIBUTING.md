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

1. **Always use try-finally**: Ensure cleanup happens even if assertions fail
2. **Destroy scope in finally**: Call `destroy(scope)` to clean up all resources
3. **Make tests idempotent**: Use deterministic, non-random IDs so failed tests can be re-run
4. **Test create, update, delete**: Cover the full resource lifecycle
5. **Test failed cases**: Include negative test cases for error conditions
6. **Use direct API verification**: Verify changes using the provider's API client
7. **Use BRANCH_PREFIX**: Creates unique test resource names across all tests

#### Test Naming

- Use `BRANCH_PREFIX` for deterministic, non-colliding resource names
- Pattern: `${BRANCH_PREFIX}-test-resource-type`
- Keep names consistent and descriptive

#### Test Structure

Create comprehensive end-to-end tests in `src/tests/{feature}.test.ts`:

```typescript
import { describe, expect, test } from "vitest";
import alchemy from "../../alchemy.run";
import { destroy } from "alchemy/src/destroy";
import { BRANCH_PREFIX, generateTestId } from "./util";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Cloudflare", () => {
  test("should create and deploy website", async (scope: any) => {
    const resourceId = `${BRANCH_PREFIX}-website`;
    let website: any;
    
    try {
      // CREATE
      const deployed = await scope.deploy();
      website = deployed.website;

      expect(website).toMatchObject({
        url: expect.stringContaining("workers.dev"),
        apiUrl: expect.stringContaining("workers.dev"),
      });

      // UPDATE (if applicable)
      // website = await Website("updated", { ... });

      // READ - Verify via API
      const response = await fetch(`${website.url}/api/health`);
      expect(response.status).toBe(200);

    } finally {
      await destroy(scope);
      await assertWebsiteDoesNotExist(website);
    }
  });
});

async function assertWebsiteDoesNotExist(website: any) {
  // Call API to verify resource no longer exists
  // Throw test error if it still exists
}
```

### API Design Principles

When implementing resources that interact with external APIs:

1. **Minimal abstraction**: Use thin wrappers around fetch rather than complex SDK clients
2. **Explicit path construction**: Build API paths explicitly at call sites
3. **Direct HTTP status handling**: Check response status codes directly
4. **Explicit JSON parsing**: Parse JSON responses explicitly where needed
5. **Public properties**: Expose properties like `api.accountId` publicly
6. **Minimal error transformation**: Preserve original error details

#### Example API Implementation

```typescript
// Good: Minimal abstraction
export async function createWorker(name: string, script: string) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${api.accountId}/workers/scripts`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${api.token}`,
      "Content-Type": "application/javascript",
    },
    body: script,
  });
  
  if (response.status !== 200) {
    throw new Error(`Failed to create worker: ${response.status}`);
  }
  
  return await response.json();
}

// Bad: Complex SDK abstraction
export class WorkerClient {
  private sdk = new CloudflareSDK(api.token);
  
  async createWorker(config: WorkerConfig) {
    return this.sdk.workers.create(config);
  }
}
```

### Documentation Requirements

#### Provider README.md

Provide comprehensive documentation of all Resources for the provider with relevant links. This serves as design and internal documentation.

See [docs/cloudflare.md](./docs/cloudflare.md) for our complete provider documentation.

#### Resource Documentation

Each resource requires:
- **Examples**: Multiple @example blocks showing distinct use cases
- **JSDoc comments**: For all properties and interfaces
- **Clear descriptions**: Of what the resource does and when to use it

#### Provider Guide

Create a getting started guide in `./docs/guides/{provider}.md` that walks users through:
- Installation and setup
- Credential configuration
- Creating their first resource
- Deploying and testing
- Cleanup/teardown

See [docs/guides/cloudflare.md](./docs/guides/cloudflare.md) for our complete getting started guide.

## Project Structure

```
├── src/
│   ├── backend/           # Cloudflare Worker code
│   ├── frontend/          # React frontend
│   ├── tests/             # Test files
│   └── db/               # Database schema and utilities
├── docs/                 # Documentation
│   ├── cloudflare.md     # Provider documentation
│   └── guides/           # Getting started guides
├── alchemy.run.ts        # Infrastructure definition
├── package.json          # Dependencies and scripts
└── README.md            # Project overview
```

## Adding Features

### Alche-men-yt Style: Tiny PRs

We follow the **Alche-men-yt** approach for contributions:

- **One concept per PR** (< 200 lines, ideally < 50)
- **Green CI before merge** - All checks must pass
- **Factual title + one-sentence body** - No fluff
- **Docs go in `docs/`** - Not in PR descriptions
- **Sequential merges** - One PR lands before the next opens

**Why tiny PRs?**
- ✅ Faster reviews
- ✅ Easier to understand
- ✅ Safer to rollback
- ✅ Better git history
- ✅ Less merge conflicts

**Example workflow:**
1. **Create a feature branch**: `git checkout -b feat/your-feature`
2. **Implement ONE thing**: Add backend API OR frontend component OR tests
3. **Test thoroughly**: Ensure all tests pass following Alchemy patterns
4. **Update documentation**: Add relevant docs to `docs/`
5. **Submit a pull request**: With clear, factual description
6. **Wait for green CI**: All checks must pass
7. **Merge**: Then start next tiny PR if needed

## Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Include error handling and validation
- Write tests for new functionality following Alchemy best practices

## Before Committing

Always run these commands before committing:

```sh
# Fix code formatting and linting
bun format

# Run tests (targets changed files vs main)
bun run test

# Or run specific tests during development
bun vitest ./src/tests/... -t "..."
```

### Pre-commit Helper Script

For convenience, you can use the pre-commit helper script:

```sh
# Run all pre-commit checks automatically
./scripts/pre-commit.sh
```

This script runs the exact commands specified above and ensures you're following Alchemy's contributing standards.

## Deployment

### Preview Deployments
- Push to feature branch → Automatic preview URL
- Test changes in isolated environment

### Production Deployment
- Merge to main branch → Automatic production deployment
- Uses `prod` stage for production resources

## Getting Help

- Check [docs/](./docs/) for detailed guides
- Review existing test files for Alchemy patterns
- Open an issue for questions or bugs
- Join discussions in GitHub Issues

Thank you for contributing! 🚀

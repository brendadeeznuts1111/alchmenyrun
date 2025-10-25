# Cursor Rules Summary

This project follows the official Alchemy `.cursorrules` from the [alchemy-run/alchemy repository](https://github.com/alchemy-run/alchemy/blob/main/.cursorrules).

## Key Rules

### 1. Package Management
- **Always use bun** to install dependencies
- **All dependencies must be peer dependencies** (not regular dependencies)
- **Use `alchemy.secret()`** instead of `new Secret()` for creating secrets

### 2. Testing with Vitest
```bash
# Run all tests
bunx vitest

# Run tests in a specific file
bunx vitest alchemy/test/stripe/price.test.ts

# Run a specific test in a specific file
bunx vitest --test-name-pattern="create and update price" alchemy/test/stripe/price.test.ts
```

**Test File Pattern:** `alchemy/test/service-name/resource-name.test.ts`

### 3. Resource Implementation Pattern

#### Pseudo-Class Structure
```typescript
// Interface name MUST match exported resource name
export interface Product extends ProductProps {
  id: string;
  createdAt: number;
  // ... other properties
}

export const Product = Resource(
  "service::Product",
  async function(this: Context<Product>, id: string, props: ProductProps): Promise<Product> {
    // Implementation
  }
);
```

#### Key Requirements
- **Interface name = Resource name** (e.g., `Product` interface → `Product` resource)
- **Use `this: Context<T>`** for type-safe context access
- **Phase handling**: `this.phase` ("create", "update", "delete")
- **Output construction**: Use `{...}` to build resource output
- **Deletion**: Return `this.destroy()`

### 4. API Client Design

#### Minimal Abstraction
- Use raw `fetch` calls instead of SDKs
- Thin wrapper around fetch, not complex abstractions
- Direct HTTP status code checking

#### Example API Client
```typescript
export class ServiceApi {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly accountId: string;

  constructor(options: ServiceApiOptions = {}) {
    this.baseUrl = "https://api.service.com/v1";
    this.apiKey = options.apiKey || process.env.SERVICE_API_KEY || '';
    this.accountId = options.accountId || process.env.SERVICE_ACCOUNT_ID || '';
  }

  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`
    };

    return fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });
  }
}
```

### 5. Error Handling
- **Check response status directly** instead of relying on exceptions
- **Preserve original error details** with minimal transformation
- **Log errors before rethrowing**

```typescript
// DO THIS:
const response = await api.get(`/path/to/resource`);
if (!response.ok) {
  throw new Error(`API error: ${response.statusText}`);
}

// NOT THIS:
try {
  const data = await api.get(`/path/to/resource`);
} catch (error) {
  // Handle error
}
```

### 6. Resource Implementation Steps

1. **Create Resource File**: `alchemy/src/{{service-name}}/{{resource-name}}.ts`
2. **Define Interfaces**: Props interface + Resource interface
3. **API Client**: Minimal fetch wrapper
4. **Implement Resource**: Pseudo-class pattern with Context
5. **Export from Service Index**: `export * from "./{{resource-name}}"`
6. **Update Package.json**: Add exports and peer dependencies
7. **Create Tests**: Dedicated test file with proper cleanup

### 7. Testing Requirements

#### Test Structure
```typescript
import { alchemy } from "../../src/alchemy";
import { destroy } from "../../src/destroy";
import { ResourceName } from "../../src/service/resource-name";
import { ServiceApi } from "../../src/service/api";
import { BRANCH_PREFIX } from "../util";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX
});

test("create, update, and delete resource", async (scope) => {
  let resource: ResourceName | undefined;
  try {
    // Create resource
    resource = await ResourceName(testId, props);
    
    // Verify with direct API call
    const response = await api.get(`/resources/${resource.id}`);
    expect(response.status).toEqual(200);
    
  } catch(err) {
    console.log(err);
    throw err;
  } finally {
    // Always cleanup
    await destroy(scope);
  }
});
```

#### Test Requirements
- **Use `alchemy.test()`** with proper scope management
- **Always cleanup** with `destroy(scope)` in finally block
- **Direct API verification** using service API client
- **Use `BRANCH_PREFIX`** for unique test resource names
- **Let test failures propagate** for visibility

### 8. API Design Principles

1. **Minimal abstraction**: Thin fetch wrapper
2. **Explicit path construction**: Build URLs at call site
3. **Direct HTTP status handling**: Check `response.ok`
4. **Explicit JSON parsing**: Parse where needed
5. **Public properties over helpers**: Expose `api.accountId`
6. **Minimal error transformation**: Preserve original errors

### 9. Resource Naming Convention

**Critical Rule**: Interface name must match exported resource name

```typescript
// ✅ CORRECT
export interface Product extends ProductProps {...}
export const Product = Resource(...);

// ❌ WRONG
export interface ProductOutput extends ProductProps {...}
export const Product = Resource(...);
```

### 10. Phase Handling

```typescript
if (this.phase === "delete") {
  // Handle deletion
  return this.destroy();
} else if (this.phase === "update") {
  // Handle update
  return { ...updatedProps };
} else {
  // Handle create
  return { ...newProps };
}
```

## How Our Project Follows These Rules

### ✅ Package Management
- Uses `bun` for all package management
- Dependencies are properly configured as peer dependencies
- Uses `alchemy.secret()` for secrets

### ✅ Resource Implementation
- Follows pseudo-class pattern
- Interface names match resource names
- Uses `this: Context<T>` for type safety
- Proper phase handling

### ✅ API Design
- Uses raw fetch calls in backend
- Direct HTTP status checking
- Minimal error transformation
- Explicit path construction

### ✅ Testing
- Uses Vitest for testing
- Proper test structure with cleanup
- Direct API verification
- Uses `BRANCH_PREFIX` for unique names

### ✅ Error Handling
- Direct response status checking
- Proper error logging and propagation
- Minimal error transformation

## Compliance Checklist

- [x] Use bun for package management
- [x] All dependencies as peer dependencies
- [x] Use `alchemy.secret()` for secrets
- [x] Pseudo-class resource pattern
- [x] Interface name = Resource name
- [x] Raw fetch calls instead of SDKs
- [x] Direct HTTP status checking
- [x] Proper test structure with cleanup
- [x] Use `BRANCH_PREFIX` in tests
- [x] Minimal error transformation
- [x] Explicit path construction

## References

- [Official Alchemy .cursorrules](https://github.com/alchemy-run/alchemy/blob/main/.cursorrules)
- [Alchemy Resource Pattern](https://alchemy.run/concepts/resource/)
- [Alchemy Testing Guide](https://alchemy.run/concepts/testing/)

---

**Status**: This project fully complies with Alchemy's official cursor rules and best practices.

# 🚀 Bun Advanced Testing - Quick Reference

> **TL;DR**: Chain qualifiers + concurrent testing + type safety + advanced matchers = 60-70% faster, more reliable tests

## 🎯 Chain Qualifiers Cheat Sheet

### Concurrent Testing
```typescript
// Parallel test execution
test.concurrent("fast test", async () => {});

// Parallel data-driven tests
test.concurrent.each([
  { param: "value1" },
  { param: "value2" },
])("test $param", async ({ param }) => {});
```

### TDD with Failing Tests
```typescript
// Expected failure until feature implemented
test.failing("unimplemented feature", () => {
  expect(newFeature()).toBeDefined();
});

// Multiple failing scenarios
test.failing.each([
  { bug: "issue-123" },
  { bug: "issue-124" },
])("known bug: $bug", ({ bug }) => {});
```

### Focused Testing
```typescript
// Run only this test (DEBUG ONLY - errors in CI)
test.only("critical bug fix", () => {});

// Focus on specific scenarios
test.only.each([
  { critical: "path1" },
  { critical: "path2" },
])("critical: $critical", ({ critical }) => {});
```

### Skip Tests
```typescript
// Skip temporarily
test.skip("flaky test", () => {});

// Skip with reasons
test.skip.each([
  { feature: "feature-x", reason: "waiting for API" },
])("skip: $feature - $reason", ({ feature }) => {});
```

### Plan Tests
```typescript
// Document planned tests
test.todo("implement user auth tests");

// Multiple planned tests
test.todo.each([
  { feature: "oauth" },
  { feature: "2fa" },
])("todo: implement $feature");
```

## 🔍 Type Testing Cheat Sheet

```typescript
import { expectTypeOf } from "bun:test";

// Property checks
expectTypeOf(obj).toHaveProperty("id");

// Type equality
expectTypeOf(value).toEqualTypeOf<string>();

// Type matching
expectTypeOf(obj).toMatchTypeOf<Interface>();

// Promise resolution
expectTypeOf(promise).resolves.toEqualTypeOf<Data>();

// Negative assertions
expectTypeOf(value).not.toEqualTypeOf<number>();
```

## 🎯 Advanced Matchers Cheat Sheet

```typescript
import { mock } from "bun:test";

const mockFn = mock((x) => x * 2);

// Any call returned this value
expect(mockFn).toHaveReturnedWith(4);

// Last call returned this value
expect(mockFn).toHaveLastReturnedWith(10);

// Nth call returned this value (1-indexed)
expect(mockFn).toHaveNthReturnedWith(1, 4);
expect(mockFn).toHaveNthReturnedWith(2, 6);

// With object matchers
expect(mockFn).toHaveReturnedWith(
  expect.objectContaining({ key: "value" })
);
```

## 📸 Inline Snapshots Cheat Sheet

```typescript
// Basic snapshot
expect(data).toMatchInlineSnapshot(`
{
  "key": "value",
}
`);

// Auto-update snapshots
// Run: bun test --update-snapshots

// Snapshot with custom serialization
expect(data).toMatchInlineSnapshot(
  { date: expect.any(Date) },
  `
{
  "id": "123",
  "date": Any<Date>,
}
`
);
```

## ⚡ Common Patterns

### Load Testing
```typescript
test.concurrent.each([
  { load: "light", requests: 5 },
  { load: "heavy", requests: 50 },
])("load: $load", async ({ requests }) => {
  const results = await Promise.all(
    Array.from({ length: requests }, simulateRequest)
  );
  expect(results.filter(r => r.success).length).toBe(requests);
});
```

### RFC Workflow Testing
```typescript
test.concurrent.each([
  { type: "architecture", sla: 24 },
  { type: "security", sla: 12 },
])("RFC $type (${sla}h SLA)", async ({ type, sla }) => {
  const result = await processRfc(type);
  expect(result.completedInHours).toBeLessThan(sla);
});
```

### Mock Lifecycle Tracking
```typescript
const lifecycle = mock((state) => nextState(state));

lifecycle("draft");
lifecycle("review");
lifecycle("approved");

expect(lifecycle).toHaveNthReturnedWith(1, "review");
expect(lifecycle).toHaveLastReturnedWith("deployed");
```

### Type-Safe Data Validation
```typescript
const rfcData: RfcData = loadRfc("RFC-001");

expectTypeOf(rfcData).toHaveProperty("id");
expectTypeOf(rfcData.status).toEqualTypeOf<
  "draft" | "review" | "approved"
>();
expect(rfcData).toMatchInlineSnapshot(`
{
  "id": "RFC-001",
  "status": "draft",
}
`);
```

## 🔗 Concurrent Integration Tests

### Real tgk Command Execution
```typescript
// Execute actual CLI commands concurrently
test.concurrent.each([
  { rfcCount: 5, forumPrefix: "test" }
])("create $rfcCount RFCs", async ({ rfcCount, forumPrefix }) => {
  const forum = generateForumName(forumPrefix);

  // Create forum
  executeTgkCommand(`tgk group-create "${forum}" --forum`);

  // Create RFCs concurrently
  const results = await Promise.all(
    Array.from({ length: rfcCount }, (_, i) =>
      executeTgkCommand(`tgk pin-card "${forum}" "RFC-${i}" "Test"`)
    )
  );

  expect(results.filter(r => r.success).length).toBeGreaterThan(0);
});
```

### Available CLI Commands
```bash
# Forum creation
tgk group-create "forum-name" --forum

# Card pinning
tgk pin-card "forum-name" "Title" "Description"

# Worker deployment
tgk worker deploy "worker-name" --stream="stream-name"

# Cleanup
tgk unpin-all "forum-name"
tgk card-delete "forum-name" 123
```

## 🚀 Quick Commands

```bash
# Run all tests
bun test

# Run concurrent integration tests
bun test src/tests/advanced/tgk-concurrent-integration.test.ts

# Run with coverage
bun test --coverage

# Run specific file
bun test src/tests/advanced/tgk-advanced.test.ts

# Run specific pattern
bun test --test-name-pattern "concurrent"

# Update snapshots
bun test --update-snapshots

# Watch mode
bun test --watch

# Run advanced test suite
./src/tests/advanced/advanced-test-runner.sh
```

## 🎯 Performance Tips

### ✅ DO
```typescript
// Use concurrent for independent tests
test.concurrent("test 1", async () => {});
test.concurrent("test 2", async () => {});

// Use .each for multiple scenarios
test.concurrent.each([data])("test $scenario", () => {});

// Use inline snapshots for readability
expect(data).toMatchInlineSnapshot(`...`);
```

### ❌ DON'T
```typescript
// Don't use test.only in production
test.only("debug test", () => {}); // Errors in CI

// Don't forget to await concurrent tests
test.concurrent("test", () => { // Missing async
  return promise;
});

// Don't nest describe.concurrent incorrectly
describe.concurrent("outer", () => {
  describe.concurrent("inner", () => {}); // Nested concurrent
});
```

## 🛡️ CI Best Practices

```yaml
# GitHub Actions example
- name: Run tests
  run: |
    bun test --coverage
    bun test --bail # Stop on first failure
  env:
    CI: true # Enables CI mode
```

**CI Mode Features:**
- ❌ Errors on `test.only()`
- ❌ Prevents accidental snapshot creation
- ✅ Stricter validation
- ✅ Better error reporting

## 📊 Performance Metrics

| Feature | Benefit |
|---------|---------|
| **Concurrent Testing** | 60-70% faster execution |
| **Type Testing** | Catch type bugs at test time |
| **Advanced Matchers** | Precise mock verification |
| **Inline Snapshots** | Easy maintenance |
| **Chain Qualifiers** | Better test organization |

## 🔗 Combining Features

```typescript
// Ultimate pattern: concurrent + each + type testing + snapshots
test.concurrent.each<TestCase>([
  { scenario: "create", data: createData },
  { scenario: "update", data: updateData },
])("$scenario workflow", async ({ scenario, data }) => {
  // Type validation
  expectTypeOf(data).toMatchTypeOf<RfcData>();

  // Execute test
  const result = await processWorkflow(data);

  // Mock verification
  expect(mockNotify).toHaveLastReturnedWith(
    expect.objectContaining({ status: "success" })
  );

  // Snapshot validation
  expect(result).toMatchInlineSnapshot(`
{
  "success": true,
  "data": {...},
}
`);
});
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests slow | Add `test.concurrent` |
| Type errors | Use `expectTypeOf()` |
| Mock verification fails | Use `toHaveNthReturnedWith()` |
| Snapshot mismatches | Run `--update-snapshots` |
| CI fails | Remove `test.only()` |
| Flaky tests | Check for race conditions |

## 📚 Learn More

- **Full Documentation**: [README.md](./README.md)
- **Test Suite**: [tgk-advanced.test.ts](./tgk-advanced.test.ts)
- **Type Definitions**: [types.ts](./types.ts)
- **Test Runner**: [advanced-test-runner.sh](./advanced-test-runner.sh)

---

**Quick Start:**
```bash
# 1. Install Bun
curl -fsSL https://bun.sh/install | bash

# 2. Run tests
./src/tests/advanced/advanced-test-runner.sh

# 3. View results
cat advanced-test-report.md
```

**Need Help?** Check the [full documentation](./README.md) or run `bun test --help`

# Alchemy Resource Naming Strategy

Guide to resource naming patterns and best practices in Alchemy.

---

## 🎯 Overview

Alchemy provides two naming strategies for resources:
1. **Automatic Naming** (Recommended)
2. **Explicit Naming** (When needed)

---

## 🤖 Automatic Naming

### How It Works

When you don't provide a `name` property, Alchemy generates a unique name:

```typescript
const app = await alchemy("my-app");

const worker = await Worker("api");
// Physical name: "my-app-api-${stage}"
```

### Naming Pattern

```
${appName}-${resourceId}-${stage}
```

### Examples by Stage

```typescript
// Development
alchemy deploy --stage dev
// → "my-app-api-dev"

// Production
alchemy deploy --stage prod
// → "my-app-api-prod"

// Personal (default)
alchemy deploy
// → "my-app-api-${USER}"

// Pull Request
alchemy deploy --stage pr-123
// → "my-app-api-pr-123"
```

### Benefits

✅ **No Conflicts**: Each stage has unique resource names  
✅ **Isolation**: Stages don't interfere with each other  
✅ **Traceability**: Easy to identify resource origin  
✅ **Consistency**: Predictable naming across all resources  
✅ **Zero Config**: Works out of the box

### Recommended For

- ✅ Most use cases
- ✅ Multi-stage deployments
- ✅ Team development
- ✅ CI/CD pipelines
- ✅ Preview environments

---

## 📝 Explicit Naming

### How It Works

Provide a specific `name` property:

```typescript
const worker = await Worker("api", {
  name: "my-custom-worker",
});
// Physical name: "my-custom-worker"
```

### Use Cases

#### 1. External Integration

When external systems expect specific names:

```typescript
const worker = await Worker("webhook", {
  name: "github-webhook-handler", // Expected by GitHub
});
```

#### 2. Migration

When importing existing infrastructure:

```typescript
const bucket = await R2Bucket("storage", {
  name: "existing-bucket-name",
  adopt: true, // Import existing
});
```

#### 3. Shared Resources

When sharing across stages (use with caution):

```typescript
const kv = await KVNamespace("shared-cache", {
  name: "global-cache", // Same across all stages
});
```

⚠️ **Warning**: Shared resources can cause conflicts and unexpected behavior.

#### 4. Custom Branding

When you need specific branding:

```typescript
const worker = await Worker("api", {
  name: "acme-corp-api",
});
```

### Stage-Specific Explicit Names

Best practice when using explicit names:

```typescript
const stage = process.env.STAGE ?? "dev";

const worker = await Worker("api", {
  name: `my-api-${stage}`, // Stage-specific
});

// dev: "my-api-dev"
// prod: "my-api-prod"
```

---

## 🎨 Naming Patterns

### Pattern 1: Automatic (Recommended)

```typescript
const app = await alchemy("my-app");

// All resources use automatic naming
const worker = await Worker("api");
const bucket = await R2Bucket("storage");
const db = await D1Database("database");
const kv = await KVNamespace("cache");

// Names:
// - my-app-api-prod
// - my-app-storage-prod
// - my-app-database-prod
// - my-app-cache-prod
```

### Pattern 2: Hybrid

```typescript
const app = await alchemy("my-app");

// Most resources automatic
const worker = await Worker("api");
const bucket = await R2Bucket("storage");

// Specific resource explicit (e.g., for external integration)
const webhook = await Worker("webhook", {
  name: "github-webhook-handler",
});
```

### Pattern 3: All Explicit with Stage

```typescript
const stage = process.env.STAGE ?? "dev";
const app = await alchemy("my-app");

// All resources with stage-specific explicit names
const worker = await Worker("api", {
  name: `my-api-${stage}`,
});

const bucket = await R2Bucket("storage", {
  name: `my-storage-${stage}`,
});
```

### Pattern 4: Environment-Based

```typescript
const isProd = process.env.STAGE === "prod";

const worker = await Worker("api", isProd ? {
  name: "production-api", // Explicit for prod
} : undefined); // Automatic for non-prod
```

---

## ⚠️ Common Pitfalls

### Pitfall 1: Same Name Across Stages

```typescript
// ❌ BAD: Conflicts across stages
const worker = await Worker("api", {
  name: "my-worker", // Same name everywhere
});

// ✅ GOOD: Stage-specific
const worker = await Worker("api", {
  name: `my-worker-${process.env.STAGE}`,
});

// ✅ BETTER: Automatic
const worker = await Worker("api");
```

### Pitfall 2: Hardcoded Stage Names

```typescript
// ❌ BAD: Hardcoded stage
const worker = await Worker("api", {
  name: "my-worker-prod", // Always prod
});

// ✅ GOOD: Dynamic stage
const worker = await Worker("api", {
  name: `my-worker-${process.env.STAGE}`,
});
```

### Pitfall 3: Inconsistent Naming

```typescript
// ❌ BAD: Inconsistent patterns
const worker = await Worker("api", {
  name: "myapp-api-prod",
});

const bucket = await R2Bucket("storage", {
  name: "prod-storage-myapp", // Different pattern
});

// ✅ GOOD: Consistent pattern
const prefix = `myapp-${process.env.STAGE}`;

const worker = await Worker("api", {
  name: `${prefix}-api`,
});

const bucket = await R2Bucket("storage", {
  name: `${prefix}-storage`,
});
```

---

## 🎯 Decision Guide

### When to Use Automatic Naming

Use automatic naming when:
- ✅ Building new infrastructure
- ✅ Using multiple stages
- ✅ Working in a team
- ✅ You don't have specific naming requirements
- ✅ You want zero configuration

### When to Use Explicit Naming

Use explicit naming when:
- ✅ Integrating with external systems
- ✅ Migrating existing infrastructure
- ✅ Specific branding requirements
- ✅ Regulatory/compliance naming rules
- ✅ Sharing resources across stages (rare)

### Decision Tree

```
Need specific name?
├─ No → Use Automatic Naming ✅
└─ Yes
   ├─ External integration? → Explicit Name
   ├─ Migration? → Explicit Name + adopt: true
   ├─ Shared resource? → Explicit Name (caution!)
   └─ Branding? → Explicit Name with stage suffix
```

---

## 📊 Comparison

| Feature | Automatic | Explicit |
|---------|-----------|----------|
| **Setup** | Zero config | Manual config |
| **Stage Isolation** | ✅ Built-in | ⚠️ Manual |
| **Conflicts** | ✅ None | ⚠️ Possible |
| **Traceability** | ✅ Clear | ⚠️ Varies |
| **Flexibility** | ⚠️ Limited | ✅ Full control |
| **Migration** | ⚠️ Harder | ✅ Easier |
| **External Integration** | ⚠️ Harder | ✅ Easier |

---

## 🔧 Implementation Examples

### Example 1: Pure Automatic

```typescript
// alchemy.run.ts
const app = await alchemy("my-app");

export const api = await Worker("api");
export const storage = await R2Bucket("storage");
export const db = await D1Database("database");

// Deployment:
// alchemy deploy --stage dev
// → my-app-api-dev, my-app-storage-dev, my-app-database-dev
//
// alchemy deploy --stage prod
// → my-app-api-prod, my-app-storage-prod, my-app-database-prod
```

### Example 2: Hybrid Approach

```typescript
// alchemy.run.ts
const app = await alchemy("my-app");
const stage = process.env.STAGE ?? "dev";

// Automatic for most resources
export const api = await Worker("api");
export const storage = await R2Bucket("storage");

// Explicit for external integration
export const webhook = await Worker("webhook", {
  name: "github-webhook-handler",
});

// Explicit with stage for shared cache
export const cache = await KVNamespace("cache", {
  name: `shared-cache-${stage}`,
});
```

### Example 3: Migration Scenario

```typescript
// alchemy.run.ts
const app = await alchemy("my-app");

// Adopt existing resources with explicit names
export const legacyBucket = await R2Bucket("legacy-storage", {
  name: "old-bucket-name",
  adopt: true,
});

// New resources use automatic naming
export const newApi = await Worker("api-v2");
export const newStorage = await R2Bucket("storage-v2");
```

---

## 🧪 Testing Names

### Verify Automatic Names

```typescript
const app = await alchemy("my-app");
const worker = await Worker("api");

console.log(worker.name);
// Expected: "my-app-api-${stage}"
```

### Test Stage-Specific Names

```bash
# Test dev
STAGE=dev bun ./alchemy.run.ts
# Verify: my-app-api-dev

# Test prod
STAGE=prod bun ./alchemy.run.ts
# Verify: my-app-api-prod
```

---

## 📚 Related Documentation

- [Resource Lifecycle](./RESOURCE_LIFECYCLE.md) - Complete lifecycle guide
- [Alchemy Phases](./ALCHEMY_PHASES.md) - Execution phases
- [Architecture](./ARCHITECTURE.md) - System design

---

## 📝 Summary

### Best Practices

1. ✅ **Default to automatic naming**
2. ✅ **Use explicit names only when necessary**
3. ✅ **Always include stage in explicit names**
4. ✅ **Keep naming patterns consistent**
5. ✅ **Document any explicit naming decisions**

### Quick Reference

```typescript
// Automatic (recommended)
const resource = await Resource("id");

// Explicit with stage
const resource = await Resource("id", {
  name: `my-resource-${process.env.STAGE}`,
});

// Explicit for migration
const resource = await Resource("id", {
  name: "existing-resource",
  adopt: true,
});
```

---

**Last Updated**: October 26, 2025  
**Status**: ✅ Production-ready patterns

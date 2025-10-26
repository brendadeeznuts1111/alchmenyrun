# Alchemy Resource Lifecycle Guide

Complete guide to understanding and implementing Alchemy resource lifecycle patterns.

> **Official Documentation**: [alchemy.run/concepts/resource](https://alchemy.run/concepts/resource/)

---

## 📚 Table of Contents

1. [Resource Basics](#resource-basics)
2. [Lifecycle Phases](#lifecycle-phases)
3. [Resource Replacement](#resource-replacement)
4. [Resource Adoption](#resource-adoption)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)

---

## 🎯 Resource Basics

### What is a Resource?

A **Resource** is the core building block of Alchemy. It represents infrastructure (Workers, databases, storage, etc.) with:

- **Resource ID**: Unique identifier within your app
- **Input Props**: Configuration you provide
- **Output Attributes**: Properties returned after creation
- **Physical Name**: Actual name in the cloud provider
- **Fully Qualified Name (FQN)**: Complete path including app and stage

### Physical Name

The **Physical Name** is the actual name used to identify the resource in the infrastructure provider (e.g., Cloudflare).

#### Explicit Physical Name

You can provide a specific physical name:

```typescript
const worker = await Worker("worker1", {
  name: "my-custom-worker", // Explicit physical name
});

console.log(worker.name); // "my-custom-worker"
```

#### Automatic Physical Name

If you don't provide a physical name, Alchemy generates one automatically:

```typescript
const app = await alchemy("my-app");

const worker = await Worker("worker1");

console.log(worker.name); // "my-app-worker1-${stage}"
```

**Naming Pattern**: `${appName}-${resourceId}-${stage}`

**Examples**:
- Dev stage: `alchemy deploy --stage dev` → `my-app-worker1-dev`
- Prod stage: `alchemy deploy --stage prod` → `my-app-worker1-prod`
- Personal stage: `alchemy deploy` → `my-app-worker1-${USER}`

#### Why Automatic Names?

Automatic naming provides:
- ✅ **Uniqueness**: No naming conflicts across stages
- ✅ **Isolation**: Each stage has separate resources
- ✅ **Traceability**: Easy to identify resource origin
- ✅ **Consistency**: Predictable naming pattern

#### When to Use Explicit Names

Use explicit names when:
- Integrating with external systems expecting specific names
- Migrating existing infrastructure
- Sharing resources across stages (use with caution)
- Custom branding requirements

⚠️ **Warning**: Explicit names can cause conflicts across stages. Use stage-specific names or rely on automatic naming.

### Example Resource

```typescript
// Automatic naming (recommended)
const bucket = await R2Bucket("storage");
// Name: "my-app-storage-prod"

// Explicit naming
const bucket = await R2Bucket("storage", {
  name: "my-app-storage", // Same name across all stages
});

// Stage-specific explicit naming
const bucket = await R2Bucket("storage", {
  name: `my-app-storage-${process.env.STAGE}`,
});
```

---

## 🔄 Lifecycle Phases

Alchemy resources go through three lifecycle phases:

### 1. **Create Phase**

Creates a new resource.

```typescript
if (this.phase === "create") {
  // Create the resource
  const resource = await provider.createResource(props);
  
  return {
    id: resource.id,
    name: resource.name,
    // ... other outputs
  };
}
```

**When it runs:**
- First deployment
- After calling `this.replace()`

### 2. **Update Phase**

Updates an existing resource.

```typescript
if (this.phase === "update") {
  // Check if update is possible
  if (canUpdate(this.output, props)) {
    return await provider.updateResource(this.output.id, props);
  } else {
    // Trigger replacement if update not possible
    this.replace();
  }
}
```

**When it runs:**
- Subsequent deployments when props change

### 3. **Delete Phase**

Destroys a resource.

```typescript
if (this.phase === "delete") {
  await provider.deleteResource(this.output.id);
  return; // No output needed
}
```

**When it runs:**
- Resource removed from code
- After `app.finalize()` for orphaned resources
- After replacement completes

---

## 🔄 Resource Replacement

### Why Replace?

Some resources cannot be updated in-place (e.g., renaming an R2 bucket). Replacement creates a new resource and deletes the old one.

### Standard Replacement (Zero Downtime)

**Pattern**: Create new → Update references → Delete old

```typescript
// Implementation pattern
if (this.phase === "update") {
  if (this.output.name !== props.name) {
    // Trigger replace and terminate this "update" phase
    this.replace();
    // (unreachable code after this.replace())
  } else {
    return updateResource();
  }
}

if (this.phase === "create") {
  // Create new resource with new name
  return createNewResource();
}
```

**Flow:**
1. `this.replace()` called during update
2. Phase switches to "create" → new resource created
3. Downstream dependencies updated
4. `app.finalize()` → old resource deleted

### Immediate Replacement (Potential Downtime)

**Pattern**: Delete old → Create new

```typescript
// Use when resource requires unique name
if (this.phase === "update") {
  if (this.output.name !== props.name) {
    this.replace(true); // Delete old BEFORE creating new
  }
}
```

⚠️ **Caution**: `this.replace(true)` causes downtime!

### Avoiding Downtime with Unique Names

**Best Practice**: Append random slug to avoid name conflicts

```typescript
const name = `${props.name}-${this.output?.slug ?? generateSlug()}`;

if (this.phase === "update") {
  if (this.output?.name !== name) {
    this.replace(); // No `true` needed - names are unique
  }
}

return {
  ...props,
  name, // Unique name avoids conflicts
};
```

**Benefits:**
- ✅ Zero downtime
- ✅ No name conflicts
- ✅ Automatic cleanup

---

## 🔗 Resource Adoption

### What is Adoption?

Adoption allows Alchemy to use pre-existing resources instead of failing when they already exist.

### Without Adoption (Default)

```typescript
const bucket = await R2Bucket("my-bucket", {
  name: "existing-bucket",
});
// ❌ Fails if bucket already exists
```

### With Adoption

**Per-Resource:**
```typescript
const bucket = await R2Bucket("my-bucket", {
  name: "existing-bucket",
  adopt: true, // ✅ Uses existing bucket
});
```

**Global Flag:**
```bash
alchemy deploy --adopt
# Adopts all resources without code changes
```

### When to Use Adoption

- **Migrating** existing infrastructure to Alchemy
- **Importing** manually created resources
- **Recovering** from failed deployments
- **Sharing** resources across apps

### Adoption Flow

```typescript
if (this.phase === "create") {
  // Check if resource exists
  const existing = await provider.findResource(props.name);
  
  if (existing) {
    if (props.adopt) {
      // Adopt existing resource
      return {
        id: existing.id,
        name: existing.name,
        adopted: true,
      };
    } else {
      throw new Error(`Resource ${props.name} already exists`);
    }
  }
  
  // Create new resource
  return await provider.createResource(props);
}
```

---

## ✅ Best Practices

### 1. **Handle All Phases**

```typescript
export class MyResource extends Resource {
  async lifecycle(props: Props) {
    if (this.phase === "create") {
      return await this.create(props);
    }
    
    if (this.phase === "update") {
      return await this.update(props);
    }
    
    if (this.phase === "delete") {
      await this.delete();
      return;
    }
  }
}
```

### 2. **Use Unique Names for Zero Downtime**

```typescript
// ✅ Good: Unique names
const name = `${props.name}-${generateSlug()}`;

// ❌ Bad: Shared names (requires immediate replacement)
const name = props.name;
```

### 3. **Validate Before Replace**

```typescript
if (this.phase === "update") {
  // Check if replacement is necessary
  const needsReplace = 
    this.output.name !== props.name ||
    this.output.region !== props.region;
  
  if (needsReplace) {
    this.replace();
  } else {
    return await this.update(props);
  }
}
```

### 4. **Always Call app.finalize()**

```typescript
const app = await alchemy("my-app");

// ... create resources ...

await app.finalize(); // ✅ Cleans up orphaned/replaced resources
```

### 5. **Use Adoption for Migrations**

```bash
# First deployment with existing resources
alchemy deploy --adopt

# Subsequent deployments (normal)
alchemy deploy
```

---

## 🎨 Common Patterns

### Pattern 1: Immutable Resource

Resources that cannot be updated (always replace).

```typescript
if (this.phase === "update") {
  // Always replace on any change
  this.replace();
}

if (this.phase === "create") {
  return await provider.createResource(props);
}

if (this.phase === "delete") {
  await provider.deleteResource(this.output.id);
}
```

### Pattern 2: Partially Mutable Resource

Some properties can update, others require replacement.

```typescript
if (this.phase === "update") {
  const mutableProps = ["description", "tags"];
  const immutableProps = ["name", "region"];
  
  const hasImmutableChange = immutableProps.some(
    prop => this.output[prop] !== props[prop]
  );
  
  if (hasImmutableChange) {
    this.replace();
  } else {
    return await provider.updateResource(this.output.id, props);
  }
}
```

### Pattern 3: Conditional Adoption

Adopt only in specific scenarios.

```typescript
if (this.phase === "create") {
  const existing = await provider.findResource(props.name);
  
  if (existing) {
    // Adopt if in migration mode
    if (process.env.MIGRATION_MODE === "true" || props.adopt) {
      return { ...existing, adopted: true };
    }
    throw new Error(`Resource ${props.name} already exists`);
  }
  
  return await provider.createResource(props);
}
```

### Pattern 4: Graceful Deletion

Handle deletion errors gracefully.

```typescript
if (this.phase === "delete") {
  try {
    await provider.deleteResource(this.output.id);
  } catch (error) {
    if (error.code === "NOT_FOUND") {
      // Already deleted, that's fine
      return;
    }
    throw error;
  }
}
```

### Pattern 5: Zero-Downtime Replacement

Use unique names to avoid conflicts.

```typescript
// Generate stable slug from resource ID
const slug = this.output?.slug ?? 
  crypto.createHash('md5')
    .update(this.id)
    .digest('hex')
    .slice(0, 8);

const name = `${props.name}-${slug}`;

if (this.phase === "update") {
  if (this.output?.name !== name) {
    this.replace(); // Safe - names are unique
  }
}

return { ...props, name, slug };
```

---

## 🧪 Testing Resources

### Test All Phases

```typescript
import { describe, it, expect } from "vitest";

describe("MyResource", () => {
  it("should create resource", async () => {
    const resource = await MyResource("test", { name: "test-resource" });
    expect(resource.name).toBe("test-resource");
  });
  
  it("should update resource", async () => {
    // First create
    await MyResource("test", { name: "test", description: "v1" });
    
    // Then update
    const updated = await MyResource("test", { 
      name: "test", 
      description: "v2" 
    });
    
    expect(updated.description).toBe("v2");
  });
  
  it("should replace on immutable change", async () => {
    // Create
    const v1 = await MyResource("test", { name: "test-v1" });
    
    // Change immutable property
    const v2 = await MyResource("test", { name: "test-v2" });
    
    expect(v2.id).not.toBe(v1.id); // New resource created
  });
  
  it("should delete resource", async () => {
    await MyResource("test", { name: "test" });
    
    // Remove from code and finalize
    await app.finalize();
    
    // Verify deletion
    const exists = await provider.resourceExists("test");
    expect(exists).toBe(false);
  });
});
```

---

## 📊 Lifecycle Decision Tree

```
┌─────────────────┐
│  Resource Call  │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Exists? │
    └────┬────┘
         │
    ┌────▼─────┬─────────┐
    │   No     │   Yes   │
    │          │         │
┌───▼───┐  ┌───▼────┐
│CREATE │  │ UPDATE │
└───┬───┘  └───┬────┘
    │          │
    │      ┌───▼────────┐
    │      │ Can Update?│
    │      └───┬────────┘
    │          │
    │     ┌────▼─────┬──────┐
    │     │   Yes    │  No  │
    │     │          │      │
    │  ┌──▼──┐   ┌───▼────┐
    │  │UPDATE│   │REPLACE │
    │  └──┬──┘   └───┬────┘
    │     │          │
    │     │      ┌───▼───┐
    │     │      │CREATE │
    │     │      └───┬───┘
    │     │          │
    └─────┴──────────┴─────┐
                           │
                    ┌──────▼──────┐
                    │ app.finalize│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   DELETE    │
                    │  (orphaned) │
                    └─────────────┘
```

---

## 🔗 Related Documentation

- **Official Alchemy Docs**: [alchemy.run/concepts/resource](https://alchemy.run/concepts/resource/)
- **Execution Phases**: [docs/ALCHEMY_PHASES.md](./ALCHEMY_PHASES.md)
- **Testing Guide**: [docs/TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Architecture**: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 📝 Summary

### Key Concepts

1. **Three Phases**: Create, Update, Delete
2. **Replacement**: For immutable changes
3. **Adoption**: Import existing resources
4. **Zero Downtime**: Use unique names
5. **Finalization**: Clean up orphaned resources

### Quick Reference

```typescript
// Standard lifecycle
if (this.phase === "create") return create();
if (this.phase === "update") return update();
if (this.phase === "delete") return delete();

// Replacement
this.replace();      // Zero downtime
this.replace(true);  // Immediate (downtime)

// Adoption
{ adopt: true }      // Per-resource
--adopt              // Global flag

// Finalization
await app.finalize(); // Clean up
```

---

**Last Updated**: October 26, 2025  
**Alchemy Version**: 0.76.1+  
**Status**: ✅ Production-ready patterns

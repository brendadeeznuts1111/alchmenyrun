# 🚀 Quick Start Guide

Get up and running with Alchemy in minutes!

## 📋 Prerequisites

- [Bun](https://bun.sh) installed
- [Cloudflare account](https://cloudflare.com)
- [Alchemy CLI](https://www.npmjs.com/package/alchemy) (`npm install -g alchemy`)

## 🎯 Three Ways to Start

### 1. Use This Repo Directly

```bash
# Clone and install
git clone https://github.com/brendadeeznuts1111/alchmenyrun.git
cd alchmenyrun
bun install

# Configure Alchemy
bun alchemy configure
bun alchemy login

# Deploy
bun run deploy
```

### 2. Create a New App from Template

```bash
# Clone this repo first
git clone https://github.com/brendadeeznuts1111/alchmenyrun.git
cd alchmenyrun
bun install

# Create your app
./scripts/create-app.sh my-app
cd apps/my-app
bun install

# Deploy
alchemy deploy --profile dev
```

### 3. Copy Template to New Repo

```bash
# Copy just the template
cp -r alchmenyrun/templates/app my-new-project
cd my-new-project
bun install

# Configure and deploy
alchemy configure
alchemy login
alchemy deploy
```

## 🛠️ Development Workflow

### Local Development

```bash
# Start dev server
bun run dev

# Or with MCP server
bun run kit:dev
```

### Testing

```bash
# Run all tests
bun test

# Run specific tests
bun test src/tests/integration.test.ts

# Watch mode
bun run test:watch
```

### Deployment

```bash
# Deploy to dev
alchemy deploy --profile dev

# Deploy to production
bun run deploy:prod

# Check deployment
bun run deploy:read
```

## 📦 Project Structure

```
your-app/
├── alchemy.config.ts    # Infrastructure configuration
├── src/
│   ├── api.ts          # Worker API endpoints
│   ├── client.tsx      # React frontend
│   └── ...
├── package.json
└── README.md
```

## 🎨 Customization

### Add Resources

Edit `alchemy.config.ts`:

```typescript
export default {
  name: "my-app",
  resources: {
    // Add a Worker
    api: {
      type: "worker",
      script: "./src/api.ts",
    },
    
    // Add KV storage
    cache: {
      type: "kv",
    },
    
    // Add D1 database
    db: {
      type: "d1",
    },
    
    // Add R2 bucket
    storage: {
      type: "r2",
    },
  },
};
```

### Environment Profiles

```typescript
export default {
  name: "my-app",
  resources: { /* ... */ },
  
  profiles: {
    dev: {
      // Dev-specific settings
      cache: { ttl: 60 },
    },
    prod: {
      // Production settings
      cache: { ttl: 3600 },
    },
  },
};
```

## 🔧 Common Tasks

### Add a New Route

```typescript
// src/api.ts
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/users') {
      // Your logic here
      return Response.json({ users: [] });
    }
    
    return Response.json({ error: 'Not found' }, { status: 404 });
  },
};
```

### Use KV Storage

```typescript
// Access KV in your worker
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Store data
    await env.cache.put('key', 'value');
    
    // Retrieve data
    const value = await env.cache.get('key');
    
    return Response.json({ value });
  },
};
```

### Use D1 Database

```typescript
// Query D1 in your worker
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const result = await env.db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(1).first();
    
    return Response.json({ user: result });
  },
};
```

## 📚 Learn More

- **Documentation**: [docs/](./docs/)
- **Examples**: [examples/](./examples/)
- **Alchemy Docs**: [Alchemy CLI](https://www.npmjs.com/package/alchemy)
- **Cloudflare Docs**: [Workers](https://developers.cloudflare.com/workers/)

## 🆘 Troubleshooting

### "alchemy: command not found"

```bash
npm install -g alchemy
```

### "Failed to authenticate"

```bash
bun alchemy login
# Follow the prompts to authenticate
```

### "Resource not found"

Make sure you've run:
```bash
bun alchemy configure
```

### Build Errors

```bash
# Clean and reinstall
rm -rf node_modules bun.lock
bun install
```

## 🎉 Next Steps

1. ✅ Create your app
2. ✅ Customize `alchemy.config.ts`
3. ✅ Add your routes and logic
4. ✅ Test locally with `bun run dev`
5. ✅ Deploy with `alchemy deploy`

**Happy building!** 🚀

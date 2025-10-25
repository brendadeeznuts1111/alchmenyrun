# Getting Started with Cloudflare on Alchemy

This guide walks you through setting up and deploying your first Cloudflare application using Alchemy.

## Prerequisites

1. **Install Bun**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Cloudflare Account**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Get your Account ID from the dashboard

3. **Cloudflare API Token**
   - Go to **My Profile → API Tokens**
   - Create a custom token with:
     - Account: `Cloudflare Account:Read`
     - Zone: `Zone:Read`
     - Zone: `Zone Settings:Edit`
     - Account: `Account Settings:Edit`
     - Account: `Cloudflare Pages:Edit`
     - Account: `Account D1 Database:Edit`
     - Account: `Account R2:Edit`
     - Account: `Account KV Storage:Edit`
     - Account: `Account Durable Objects:Edit`
     - Account: `Account Queues:Edit`
     - Account: `Account Workflows:Edit`

## Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/your-repo.git
   cd your-repo
   ```

2. **Install Dependencies**
   ```bash
   bun i
   ```

## Configuration

1. **Set Environment Variables**
   
   Create a `.env` file:
   ```bash
   # Cloudflare Configuration
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   CLOUDFLARE_API_TOKEN=your_api_token_here
   
   # Alchemy Configuration
   ALCHEMY_PASSWORD=your_encryption_password
   ALCHEMY_STATE_TOKEN=your_state_token
   ```

2. **Generate State Token**
   ```bash
   # This will generate and save a new state token
   bun run alchemy:dev
   ```

## Your First Application

### 1. Create a Basic Worker

Create `src/backend/server.ts`:
```typescript
/**
 * Basic Cloudflare Worker
 */
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const url = new URL(request.url);
    
    // Health check endpoint
    if (url.pathname === '/api/health') {
      return Response.json({
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    }
    
    // Default response
    return new Response('Hello from Cloudflare Workers!', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },
};
```

### 2. Add a Frontend

Create `src/frontend/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Alchemy App</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-center mb-8">My Alchemy App</h1>
        <div id="content" class="text-center">
            <p>Loading...</p>
        </div>
    </div>
    
    <script>
        async function loadHealth() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                document.getElementById('content').innerHTML = `
                    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <strong>Status:</strong> ${data.status}<br>
                        <strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}
                    </div>
                `;
            } catch (error) {
                document.getElementById('content').innerHTML = `
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <strong>Error:</strong> Failed to load health status
                    </div>
                `;
            }
        }
        
        loadHealth();
    </script>
</body>
</html>
```

### 3. Configure Infrastructure

Update `alchemy.run.ts`:
```typescript
import alchemy from "alchemy";
import { Website } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

const app = await alchemy("my-first-app", {
  password: process.env.ALCHEMY_PASSWORD || "change-me-in-production",
  stateStore: (scope) => new CloudflareStateStore(scope),
});

// Deploy the website
const website = await Website("app", {
  name: "my-first-app",
  scriptPath: "./src/backend/server.ts",
  assetsPath: "./src/frontend",
  database: false,  // No database for this simple example
  storage: false,   // No R2 storage
  cache: false,     // No KV cache
  chat: false,      // No Durable Objects
  workflow: false,  // No Workflows
});

console.log(`🚀 Application deployed at: ${website.url}`);
console.log(`🔧 API endpoint: ${website.apiUrl}`);

await app.finalize();
```

## Development

### 1. Start Development Server
```bash
bun run alchemy:dev
```

This will:
- Deploy your application to a development stage
- Start a local development server with hot reload
- Output the development URLs

### 2. Test Your Application
```bash
# Test the health endpoint
curl https://your-app-dev.your-subdomain.workers.dev/api/health

# Run the test suite
bun test
```

### 3. Make Changes
- Edit your backend or frontend code
- Changes are automatically redeployed
- Refresh your browser to see updates

## Adding Features

### Database (D1)

1. **Create Database Schema**
   ```typescript
   // src/db/schema.ts
   import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
   
   export const users = sqliteTable("users", {
     id: text("id").primaryKey(),
     email: text("email").notNull().unique(),
     name: text("name").notNull(),
     createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
   });
   ```

2. **Update Infrastructure**
   ```typescript
   const website = await Website("app", {
     name: "my-app-with-db",
     scriptPath: "./src/backend/server.ts",
     assetsPath: "./src/frontend",
     database: true,  // Enable D1 database
   });
   ```

3. **Use Database in Backend**
   ```typescript
   export default {
     async fetch(request: Request, env: any, ctx: ExecutionContext) {
       if (request.method === 'POST' && url.pathname === '/api/users') {
         const { email, name } = await request.json();
         
         const user = await env.db.insert(users).values({
           id: crypto.randomUUID(),
           email,
           name,
           createdAt: new Date(),
         }).returning().get();
         
         return Response.json({ user });
       }
       
       // ... other routes
     },
   };
   ```

### File Storage (R2)

1. **Enable Storage**
   ```typescript
   const website = await Website("app", {
     // ... other config
     storage: true,  // Enable R2 bucket
   });
   ```

2. **Upload Files**
   ```typescript
   if (request.method === 'POST' && url.pathname === '/api/upload') {
     const formData = await request.formData();
     const file = formData.get('file') as File;
     
     const key = `uploads/${crypto.randomUUID()}-${file.name}`;
     await env.storage.put(key, await file.arrayBuffer());
     
     return Response.json({ 
       file: { 
         id: key, 
         name: file.name, 
         size: file.size 
       } 
     });
   }
   ```

### Real-time Chat (Durable Objects)

1. **Create Durable Object**
   ```typescript
   // src/chat/durable-object.ts
   export class ChatRoom {
     private sessions: Set<WebSocket> = new Set();
     
     async fetch(request: Request) {
       if (request.headers.get("Upgrade") === "websocket") {
         return this.handleWebSocket(request);
       }
       return new Response("Expected websocket", { status: 400 });
     }
     
     private handleWebSocket(request: Request) {
       const [client, server] = Object.values(new WebSocketPair());
       
       server.accept();
       this.sessions.add(server);
       
       server.addEventListener("message", (event) => {
         const message = event.data;
         
         // Broadcast to all connected clients
         this.sessions.forEach((session) => {
           session.send(message);
         });
       });
       
       server.addEventListener("close", () => {
         this.sessions.delete(server);
       });
       
       return new Response(null, { 
         status: 101, 
         webSocket: client 
       });
     }
   }
   ```

2. **Enable Chat**
   ```typescript
   const website = await Website("app", {
     // ... other config
     chat: true,  // Enable Durable Object chat
   });
   ```

## Deployment

### Development Deployment
```bash
bun run deploy
```

### Production Deployment
```bash
bun run deploy:prod
```

### Environment-Specific Configuration
```typescript
const isProduction = process.env.NODE_ENV === 'production';

const website = await Website("app", {
  name: isProduction ? "my-app-prod" : "my-app-dev",
  scriptPath: "./src/backend/server.ts",
  assetsPath: "./src/frontend",
  database: true,
  storage: true,
  cache: true,
  chat: isProduction, // Only enable chat in production
});
```

## Testing

### Run Tests
```bash
# Run all tests
bun test

# Run integration tests
bun test:integration

# Run with watch mode
bun test:watch
```

### Test Structure
Tests follow Alchemy's testing best practices:
- Use `BRANCH_PREFIX` for deterministic resource names
- Always use try-finally for cleanup
- Test create, update, delete lifecycle
- Include error handling tests

## Monitoring and Debugging

### View Logs
```bash
# View real-time logs
wrangler tail

# View logs for specific worker
wrangler tail --name my-app
```

### Debug Locally
```bash
# Start local Miniflare server
bun run alchemy:dev

# Access local debugging tools
open http://localhost:8787
```

## Cleanup

### Remove Development Resources
```bash
bun run destroy
```

### Remove Production Resources
```bash
bun run destroy:prod
```

## Next Steps

- [Add authentication](./authentication.md)
- [Set up CI/CD](./cicd.md)
- [Monitor performance](./monitoring.md)
- [Scale to multiple environments](./multi-env.md)

## Troubleshooting

### Common Issues

1. **"No credentials found"**
   - Check your CLOUDFLARE_API_TOKEN environment variable
   - Ensure the token has the required permissions

2. **"Missing token for CloudflareStateStore"**
   - Run `bun run alchemy:dev` to generate a state token
   - Or set ALCHEMY_STATE_TOKEN manually

3. **Build failures**
   - Run `bun check` to check for TypeScript errors
   - Run `bun format` to fix formatting issues

### Getting Help

- Check the [Alchemy documentation](https://alchemy.run)
- Review [Cloudflare Workers docs](https://developers.cloudflare.com/workers)
- Open an issue on GitHub

## License

This project is licensed under the Apache-2.0 License.

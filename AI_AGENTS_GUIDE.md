# AI Agents Guide for Alchemy Projects

Based on the [official Alchemy AGENTS.md](https://github.com/alchemy-run/alchemy/blob/main/AGENTS.md), this guide provides comprehensive information for AI agents working with Alchemy infrastructure projects.

## What are Agents in Alchemy?

**Agents** in Alchemy are components responsible for managing specific resources or tasks within the infrastructure. They handle the complete lifecycle of resources: creation, updating, and deletion.

## Agent Responsibilities

### 1. **Resource Management**
- **Creation**: Initialize resources with proper configuration
- **Updating**: Modify existing resources when changes are detected
- **Deletion**: Clean up resources when no longer needed
- **State Management**: Ensure resources are in the desired state

### 2. **Idempotency**
- **Consistent Results**: Multiple executions should produce the same result
- **Safe Re-runs**: Agents should handle partial failures gracefully
- **State Reconciliation**: Detect and resolve state drift

### 3. **Error Handling**
- **Graceful Degradation**: Handle failures without breaking the entire system
- **Retry Logic**: Implement appropriate retry mechanisms
- **Error Reporting**: Provide clear error messages and context

## Implementation Guidelines

### 1. **Agent Structure**
```typescript
// Example agent structure
export interface Agent {
  name: string;
  resources: Resource[];
  
  // Lifecycle methods
  create(): Promise<void>;
  update(): Promise<void>;
  delete(): Promise<void>;
  
  // State management
  getState(): Promise<AgentState>;
  reconcile(): Promise<void>;
}
```

### 2. **Resource Management Pattern**
```typescript
// Agent managing multiple resources
export class CloudflareAgent {
  private resources: Map<string, Resource> = new Map();
  
  async createResource(id: string, config: ResourceConfig): Promise<Resource> {
    const resource = await Resource(id, config);
    this.resources.set(id, resource);
    return resource;
  }
  
  async updateResource(id: string, config: ResourceConfig): Promise<Resource> {
    const resource = this.resources.get(id);
    if (!resource) {
      throw new Error(`Resource ${id} not found`);
    }
    
    // Update logic here
    return resource;
  }
  
  async deleteResource(id: string): Promise<void> {
    const resource = this.resources.get(id);
    if (resource) {
      await resource.destroy();
      this.resources.delete(id);
    }
  }
}
```

### 3. **State Management**
```typescript
// Agent state management
export interface AgentState {
  resources: Record<string, ResourceState>;
  lastUpdated: number;
  version: string;
}

export class StatefulAgent {
  private state: AgentState;
  
  async getState(): Promise<AgentState> {
    return this.state;
  }
  
  async saveState(): Promise<void> {
    // Persist state to storage
    await this.persistState(this.state);
  }
  
  async reconcile(): Promise<void> {
    // Compare desired state with actual state
    const desiredState = await this.getDesiredState();
    const actualState = await this.getActualState();
    
    // Apply differences
    await this.applyDifferences(desiredState, actualState);
  }
}
```

## Best Practices for AI Agents

### 1. **Resource Naming**
- Use consistent, descriptive names
- Include environment prefixes (dev, staging, prod)
- Avoid special characters and spaces

### 2. **Error Handling**
```typescript
// Robust error handling
export class RobustAgent {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw lastError!;
  }
}
```

### 3. **Configuration Management**
```typescript
// Agent configuration
export interface AgentConfig {
  name: string;
  environment: 'dev' | 'staging' | 'prod';
  retryAttempts: number;
  timeout: number;
  resources: ResourceConfig[];
}

export class ConfigurableAgent {
  constructor(private config: AgentConfig) {}
  
  async validateConfig(): Promise<boolean> {
    // Validate configuration
    return this.config.resources.length > 0;
  }
}
```

### 4. **Monitoring and Logging**
```typescript
// Agent monitoring
export class MonitoredAgent {
  private logger: Logger;
  
  async executeOperation(operation: string, fn: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Starting operation: ${operation}`);
      const result = await fn();
      
      const duration = Date.now() - startTime;
      this.logger.info(`Operation completed: ${operation} (${duration}ms)`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Operation failed: ${operation} (${duration}ms)`, error);
      throw error;
    }
  }
}
```

## Agent Types in Our Project

### 1. **Infrastructure Agent**
- Manages Cloudflare resources (Workers, D1, R2, KV, etc.)
- Handles resource creation and configuration
- Manages bindings between resources

### 2. **Deployment Agent**
- Handles CI/CD pipeline execution
- Manages environment-specific deployments
- Coordinates resource updates

### 3. **Monitoring Agent**
- Tracks resource health and performance
- Manages alerts and notifications
- Provides observability data

## Agent Implementation Examples

### 1. **Cloudflare Worker Agent**
```typescript
export class WorkerAgent {
  async createWorker(name: string, config: WorkerConfig): Promise<Worker> {
    return await Worker(name, {
      name: config.name,
      entrypoint: config.entrypoint,
      bindings: config.bindings,
    });
  }
  
  async updateWorker(name: string, config: WorkerConfig): Promise<Worker> {
    // Update existing worker
    return await Worker(name, config);
  }
  
  async deleteWorker(name: string): Promise<void> {
    // Delete worker
    await Worker(name, { destroy: true });
  }
}
```

### 2. **Database Agent**
```typescript
export class DatabaseAgent {
  async createDatabase(name: string, config: DatabaseConfig): Promise<D1Database> {
    return await D1Database(name, {
      name: config.name,
    });
  }
  
  async runMigrations(database: D1Database, migrations: Migration[]): Promise<void> {
    for (const migration of migrations) {
      await database.exec(migration.sql);
    }
  }
}
```

## Agent Testing

### 1. **Unit Testing**
```typescript
// Test agent functionality
describe('WorkerAgent', () => {
  let agent: WorkerAgent;
  
  beforeEach(() => {
    agent = new WorkerAgent();
  });
  
  it('should create worker successfully', async () => {
    const worker = await agent.createWorker('test-worker', {
      name: 'test-worker',
      entrypoint: './src/index.ts',
      bindings: {}
    });
    
    expect(worker).toBeDefined();
    expect(worker.name).toBe('test-worker');
  });
});
```

### 2. **Integration Testing**
```typescript
// Test agent with real resources
describe('Agent Integration', () => {
  it('should manage complete infrastructure', async () => {
    const agent = new InfrastructureAgent();
    
    // Create resources
    await agent.createResources(testConfig);
    
    // Verify resources exist
    const state = await agent.getState();
    expect(state.resources).toHaveLength(3);
    
    // Cleanup
    await agent.deleteAllResources();
  });
});
```

## Agent Security

### 1. **Authentication**
- Use proper authentication mechanisms
- Rotate credentials regularly
- Implement least-privilege access

### 2. **Secrets Management**
```typescript
// Secure secrets handling
export class SecureAgent {
  async createSecret(name: string, value: string): Promise<Secret> {
    return alchemy.secret(value);
  }
  
  async getSecret(name: string): Promise<string> {
    // Retrieve secret securely
    return process.env[name] || '';
  }
}
```

### 3. **Audit Logging**
```typescript
// Audit agent actions
export class AuditableAgent {
  private auditLog: AuditLog[] = [];
  
  async logAction(action: string, resource: string, details: any): Promise<void> {
    this.auditLog.push({
      timestamp: new Date(),
      action,
      resource,
      details,
      userId: this.getCurrentUser()
    });
  }
}
```

## Agent Monitoring

### 1. **Health Checks**
```typescript
// Agent health monitoring
export class HealthCheckableAgent {
  async healthCheck(): Promise<HealthStatus> {
    try {
      // Check agent functionality
      await this.validateResources();
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        details: 'All resources operational'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      };
    }
  }
}
```

### 2. **Metrics Collection**
```typescript
// Agent metrics
export class MetricsAgent {
  private metrics: Map<string, number> = new Map();
  
  incrementCounter(name: string): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + 1);
  }
  
  recordDuration(name: string, duration: number): void {
    this.metrics.set(`${name}_duration`, duration);
  }
}
```

## Conclusion

Following the guidelines from the [official Alchemy AGENTS.md](https://github.com/alchemy-run/alchemy/blob/main/AGENTS.md) ensures that AI agents working with Alchemy projects are:

- **Robust**: Handle failures gracefully
- **Idempotent**: Produce consistent results
- **Maintainable**: Follow clear patterns and practices
- **Secure**: Handle secrets and authentication properly
- **Observable**: Provide monitoring and logging

Our project already implements many of these patterns, making it an excellent example of how to structure Alchemy projects for AI agent interaction.

## References

- [Official Alchemy AGENTS.md](https://github.com/alchemy-run/alchemy/blob/main/AGENTS.md)
- [Alchemy Documentation](https://alchemy.run)
- [Alchemy .cursorrules](https://github.com/alchemy-run/alchemy/blob/main/.cursorrules)
- [Our Project Cursor Rules Summary](./CURSOR_RULES_SUMMARY.md)

---

**Status**: This guide provides comprehensive coverage of AI agent best practices for Alchemy projects, based on the official documentation.

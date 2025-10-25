# Alchemy Profiles

This guide covers how to use Alchemy profiles to manage credentials for your Cloudflare infrastructure.

## Overview

Alchemy profiles provide a simple way to manage credentials for cloud providers without juggling multiple `.env` files or separate login CLI commands. Profiles are stored locally in your `~/.alchemy` directory and behave similarly to [AWS profiles](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html).

## Quick Start

### 1. Configure Profile

Create or update a profile:

```bash
# Configure default profile
bun alchemy configure

# Configure specific profile
bun alchemy configure --profile prod
```

This will create/update `~/.alchemy/config.json` with your profile configuration.

### 2. Login

Authenticate with Cloudflare:

```bash
# Login to default profile
bun alchemy login

# Login to specific profile
bun alchemy login --profile prod
```

This will store credentials securely in `~/.alchemy/credentials/{profile}/cloudflare.json`.

### 3. Use Profiles

Deploy with specific profile:

```bash
# Use default profile
bun run deploy

# Use specific profile
bun run deploy --profile prod

# Override with environment variable
ALCHEMY_PROFILE=prod bun run deploy
```

## Profile Configuration

### config.json

The configuration file stores non-sensitive profile data:

```json
{
  "version": 1,
  "profiles": {
    "default": {
      "cloudflare": {
        "method": "oauth",
        "metadata": {
          "id": "<account-id>",
          "name": "<account-name>"
        },
        "scopes": [
          "account:read",
          "user:read", 
          "workers:write"
        ]
      }
    },
    "prod": {
      "cloudflare": {
        "method": "api-token",
        "metadata": {
          "id": "<account-id>",
          "name": "<account-name>"
        }
      }
    }
  }
}
```

### Credentials Files

Credentials are stored separately in profile-specific files:

```bash
~/.alchemy/credentials/default/cloudflare.json
~/.alchemy/credentials/prod/cloudflare.json
```

Example credentials file:

```json
{
  "type": "oauth",
  "access": "<access-token>",
  "refresh": "<refresh-token>", 
  "expires": 1758577621359
}
```

## Authentication Methods

### OAuth (Recommended)

Use OAuth for interactive authentication:

```bash
bun alchemy configure
# Select OAuth method
# Follow browser authentication flow
bun alchemy login
```

### API Token

Use API tokens for automated workflows:

```bash
bun alchemy configure
# Select API token method
# Enter your Cloudflare API token
```

## Profile Management

### List Profiles

View configured profiles:

```bash
# View config file
cat ~/.alchemy/config.json

# List credential files
ls ~/.alchemy/credentials/
```

### Switch Profiles

Change active profile:

```bash
# Using command line flag
bun run deploy --profile prod

# Using environment variable
ALCHEMY_PROFILE=prod bun run deploy

# Provider-specific override
CLOUDFLARE_PROFILE=prod bun run deploy
```

### Update Profile

Modify existing profile configuration:

```bash
bun alchemy configure --profile prod
```

### Remove Profile

Delete profile credentials:

```bash
bun alchemy logout --profile prod
```

## Advanced Usage

### Resource-Level Profiles

Configure individual resources to use specific profiles:

```typescript
import { Worker } from "alchemy/cloudflare";

const worker = await Worker("my-worker", {
  profile: "prod", // Use prod profile for this resource
  // ... other config
});
```

### App-Level Profiles

Set profile globally for all resources in an app:

```typescript
import alchemy from "alchemy";

const app = await alchemy("my-app", {
  profile: "prod", // All resources use prod profile
});

// Resources will inherit the prod profile
const worker = await Worker("my-worker", {
  // profile: "prod" // This is implicit
});
```

### Environment-Specific Configuration

Use different profiles for different environments:

```typescript
// alchemy.run.ts
const profile = process.env.NODE_ENV === "production" ? "prod" : "dev";

const app = await alchemy("my-app", {
  profile,
});
```

## Best Practices

### 1. Use Separate Profiles for Environments

```bash
# Development profile
bun alchemy configure --profile dev
bun alchemy login --profile dev

# Production profile  
bun alchemy configure --profile prod
bun alchemy login --profile prod
```

### 2. Use OAuth for Development

OAuth provides better security and automatic token refresh:

```bash
bun alchemy configure --profile dev
# Select OAuth method
bun alchemy login --profile dev
```

### 3. Use API Tokens for CI/CD

API tokens work better in automated environments:

```bash
bun alchemy configure --profile ci
# Select API token method
# Enter CI/CD token
```

### 4. Regular Login Refresh

Credentials may expire, so login regularly:

```bash
# Daily login refresh
bun alchemy login
```

### 5. Secure Credential Storage

- Credentials are stored locally in `~/.alchemy/`
- Files have appropriate permissions (600)
- Never commit `~/.alchemy/` to version control
- Use different tokens for different environments

## Troubleshooting

### "No credentials found"

```bash
# Check profile configuration
cat ~/.alchemy/config.json

# Login to refresh credentials
bun alchemy login

# Check specific profile
bun alchemy login --profile prod
```

### "Invalid credentials"

```bash
# Logout and re-login
bun alchemy logout
bun alchemy login

# Or for specific profile
bun alchemy logout --profile prod
bun alchemy login --profile prod
```

### "Profile not found"

```bash
# Configure the missing profile
bun alchemy configure --profile missing-profile
bun alchemy login --profile missing-profile
```

## Integration with This Project

This project uses Alchemy profiles for credential management:

### Environment Variables

Only minimal environment variables are needed:

```bash
# .env
ALCHEMY_PASSWORD=your_encryption_password
# ALCHEMY_PROFILE=prod  # Optional: override default profile
# CLOUDFLARE_PROFILE=prod  # Optional: override Cloudflare profile
```

### Deployment Commands

```bash
# Development (uses default profile)
bun run alchemy:dev
bun run deploy

# Production (uses prod profile)
ALCHEMY_PROFILE=prod bun run deploy:prod
bun run deploy:prod --profile prod
```

### Infrastructure Code

The `alchemy.run.ts` uses the default profile:

```typescript
const app = await alchemy("cloudflare-demo", {
  password: process.env.ALCHEMY_PASSWORD,
  stateStore: (scope) => new CloudflareStateStore(scope),
  // Uses default profile - can be overridden with --profile flag
});
```

## Security Considerations

- Credentials are stored locally and encrypted
- Profile configuration (`config.json`) contains no sensitive data
- Credentials files (`credentials/{profile}/cloudflare.json`) contain tokens
- Use appropriate file permissions (600)
- Regularly rotate API tokens
- Use least-privilege tokens for specific use cases

## Migration from Environment Variables

If you're currently using environment variables:

1. **Configure profile**:
   ```bash
   bun alchemy configure
   ```

2. **Login**:
   ```bash
   bun alchemy login
   ```

3. **Update environment**:
   ```bash
   # Remove from .env:
   # CLOUDFLARE_ACCOUNT_ID
   # CLOUDFLARE_API_TOKEN
   # ALCHEMY_STATE_TOKEN
   
   # Keep only:
   ALCHEMY_PASSWORD=your_encryption_password
   ```

4. **Update deployment scripts**:
   ```bash
   # Old: CLOUDFLARE_API_TOKEN=xxx bun run deploy
   # New: bun run deploy (uses profiles)
   ```

## Further Reading

- [Alchemy Profiles Documentation](https://alchemy.run/concepts/profiles/)
- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-tokens/)
- [AWS Profiles Reference](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html)

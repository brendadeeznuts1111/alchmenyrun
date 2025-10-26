# Claude AI Assistant Configuration

This document contains configuration and context for Claude AI assistants working with this Alchemy project.

## 🏢 Organizational Structure

### 👥 Team Hierarchy

#### **Engineering Leadership**
- **Team Lead**: @brendadeeznuts1111 
  - Role: Principal Engineer & Project Lead
  - Responsibilities: Architecture decisions, merge approvals, strategic direction
  - Department: Engineering Leadership

#### **Core Departments**

**🚀 Infrastructure Team**
- **Lead**: @brendadeeznuts1111
- **Focus**: CI/CD, deployment, resource providers, core framework
- **Components**: Queue, Tunnel, Worker, CLI tools

**⚡ Resource Provider Team**  
- **Lead**: @brendadeeznuts1111 (interim)
- **Focus**: Implementing cloud service providers
- **Components**: All resource implementations

**🧪 Quality & Testing Team**
- **Lead**: TBD
- **Focus**: Test frameworks, CI validation, quality assurance

**📚 Documentation Team**
- **Lead**: TBD
- **Focus**: Guides, examples, API documentation

### 🏷️ Department Labels
- `dept/leadership` 👔 - Leadership team decisions
- `dept/infrastructure` 🏗️ - Infrastructure and deployment
- `dept/providers` 🔌 - Resource provider implementations
- `dept/quality` 🧪 - Testing and quality assurance
- `dept/documentation` 📚 - Documentation and guides

### 📋 Assignment Rules
- Infrastructure components → @brendadeeznuts1111
- Provider implementations → Department leads
- Documentation → Documentation team
- Testing → Quality team

## Branching Strategy & CI/CD

**IMPORTANT**: Always create dedicated feature branches for specific work following the pattern:

```bash
# For new features or specific work
git checkout -b feat/descriptive-name

# For bug fixes  
git checkout -b fix/descriptive-name

# For documentation
git checkout -b docs/descriptive-name
```

### CI/CD Pipeline
- **Main branch**: Deploys to production (`prod` stage)
- **Pull requests**: Creates preview environments (`pr-{number}` stage)
- **PR cleanup**: Automatic teardown when PR is closed
- **GitHub Actions**: Uses Bun for package management and deployment

### Slash Commands
Available GitHub slash commands for PR management:
- `/deploy` - Trigger manual deployment
- `/destroy` - Clean up preview environment
- `/test` - Run test suite
- `/lint` - Run code formatting and linting

# Alchemy

Alchemy is an Typescript-native Infrastructure-as-Code repository. Claude's job is to implement "Resource" providers for various cloud services by following a set up strict conventions and patterns.

Your job is to build and maintain resource providers following the following convention and structure:

## Provider Layout

```
alchemy/
  src/
    {provider}/
      README.md
      {resource}.ts
  test/
    {provider}/
      {resource}.test.ts
alchemy-web/
  guides/
    {provider}.md # guide on how to get started with the {provider}
  docs/
    providers/
      {provider}/
        index.md # overview of usage and link to all the resources for the provider
        {resource}.md # example-oriented reference docs for the resource
examples/
  {provider}-{qualifier?}/ # only add a qualifier if there are more than one example for this {provider}, e.g. {cloudflare}-{vitejs}
    package.json
    tsconfig.json
    alchemy.run.ts
    README.md #
    src/
      # source code
```

## Convention

> Each Resource ha one .ts file, one test suite and one documentation page

## README

Please provide a comprehensive document of all the Resources for this provider with relevant links to documentation. This is effectivel the design and internal documentation.

## Resource File

> [!NOTE]
> Follow rules and conventions laid out in thge [cursorrules](./.cursorrules).

````ts
// ./alchemy/src/{provider}/{resource}.ts
import { Context } from "../context.ts";

export interface {Resource}Props {
    // input props
}

export interface {Resource} extends Resource<"{provider}::{resource}"> {
    // output props
}

/**
 * {overview}
 *
 * @example
 * ## {Example Title}
 *
 * {concise description}
 *
 * ```ts
 * {example snippet}
 * ```
 *
 * @example
 * // .. repeated for all examples
 */
export const {Resource} = Resource(
  "{provider}::{resource}",
  async function (this: Context<>, id: string, props: {Resource}Props): Promise<{Resource}> {
    // Create, Update, Delete lifecycle
  }
);
````

## Test Suite

> [!NOTE]
> Follow rules and conventions laid out in thge [cursorrules](./.cursorrules).

```ts
// ./alchemy/test/{provider}/{resource}.test.ts
import { destroy } from "../src/destroy.ts"
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("{Provider}", () => {
  test("{test case}", async (scope) => {
    let resource: {Resource}
    try {
      // create
      resource = await {Resource}("{id}", {
        // {props}
      })

      expect(resource).toMatchObject({
        // {assertions}
      })

      // update
      resource = await {Resource}("{id}", {
        // {update props}
      })

      expect(resource).toMatchObject({
        // {updated assertions}
      })
    } finally {
      await destroy(scope);
      await assert{ResourceDoesNotExist}(resource)
    }
  })
});

async function assert{Resource}DoesNotExist(api: {Provider}Client, resource: {Resource}) {
    // {call api to check it does not exist, throw test error if it does}
}
```

## Provider Overivew Docs (index.md)

Each provider folder should have an `index.md` that indexes and summarizes the provider and links to each resource.

```md
# {Provider}

{overview of the provider}

{official links out to the provider website}

## Resources

- [{Resource}1](./{resource}1.md) - {brief description}
- [{Resource}2](./{resource}2.md) - {brief description}
- ..
- [{Resource}N](./{resource}n.md) - {brief description}

## Example Usage

\`\`\`ts
// {comprehensive end-to-end usage}
\`\`\`
```

## Example Project

An example project is effectiveley a whole NPM package that demon

```
examples/
  {provider}-{qualifier?}/
    package.json
    tsconfig.json # extends
    alchemy.run.ts
    README.md
    src/
      # code

tsconfig.json # is updated to reference examples/{provider}-{qualifer?}
```

## Guide

Each Provide has a getting started guide in ./alchemy-web/docs/guides/{provider}.md.

```md
---
order: { number to decide the position in the tree view }
title: { Provider }
description: { concise description of the tutorial }
---

# Getting Started {Provider}

{1 sentence overview of what this tutorial will set the user up with}

## Install

{any installation pre-requisties}

::: code-group

\`\`\`sh [bun]
bun ..
\`\`\`

\`\`\`sh [npm]
npm ...
\`\`\`

\`\`\`sh [pnpm]
pnpm ..
\`\`\`

\`\`\`sh [yarn]
yarn ..
\`\`\`

:::

## Credentials

{how to get credentials and store in .env}

## Create a {Provider} applicaiton

{code group with commands to run to init a new project}

## Create `alchemy.run.ts` 

{one or more subsequent code snippets with explanations for using alchemy to provision this provider}

## Deploy

Run `alchemy.run.ts` script to deploy:

::: code-group

\`\`\`sh [bun]
bun ./alchemy.run
\`\`\`

\`\`\`sh [npm]
npx tsx ./alchemy.run
\`\`\`

\`\`\`sh [pnpm]
pnpm tsx ./alchemy.run
\`\`\`

\`\`\`sh [yarn]
yarn tsx ./alchemy.run
\`\`\`

:::

It should log out the ... {whatever information is relevant for interacting with the app deployed to this provider}
\`\`\`sh
{expected output}
\`\`\`

## Tear Down

That's it! You can now tear down the app (if you want to):

::: code-group

\`\`\`sh [bun]
bun ./alchemy.run --destroy
\`\`\`

\`\`\`sh [npm]
npx tsx ./alchemy.run --destroy
\`\`\`

\`\`\`sh [pnpm]
pnpm tsx ./alchemy.run --destroy
\`\`\`

\`\`\`sh [yarn]
yarn tsx ./alchemy.run --destroy
\`\`\`

:::
```

> [!NOTE]
> Claude, you should review all of the existing Cloudflare guides like [cloudflare-vitejs.md](./alchemy-web/docs/guides/cloudflare-vitejs.md) and follow the writing style and flow.

> [!TIP]
> If the Resource is mostly headless infrastructure like a database or some other service, you should use Cloudflare Workers as the runtime to "round off" the example package. E.g. for a Neon Provider, we would connect it into a Cloudlare Worker via Hyperdrive and provide a URL (via Worker) to hit that page. Ideally you'd also put ViteJS in front and hit that endpoint.

## Project Structure

- `alchemy.run.ts` - Main Alchemy infrastructure definition
- `src/backend/` - Cloudflare Workers backend code
- `src/frontend/` - React frontend application
- `src/db/` - Database schema and utilities
- `packages/@alch/` - Internal Alchemy packages
- `examples/` - Example implementations

## Development Commands

```bash
# Start development server
bun run dev

# Build CSS
bun run build:css

# Run tests
bun test

# Type checking
bun tsc -b

# Deploy to development
bun run deploy

# Deploy to production
bun run deploy:prod
```

## Common Issues

### 404 Errors
- Ensure the backend server has routes for both frontend and API
- Check that `acceptsHtml` header is properly handled
- Verify static file serving (CSS, JS) is configured

### MIME Type Errors
- JavaScript modules must be served with `application/javascript`
- TypeScript files should be compiled to JS before serving
- Use proper content headers for all static assets

### Database Issues
- D1 database requires Cloudflare API token authentication
- Set `CLOUDFLARE_API_TOKEN` environment variable
- OAuth profiles from `wrangler login` don't support D1 operations

## Architecture Notes

- Uses Alchemy framework for Infrastructure as TypeScript
- Cloudflare Workers for serverless backend
- React with TypeScript for frontend
- D1 for database, R2 for storage, KV for caching
- Durable Objects for real-time features
- Workflows for orchestration

## Debugging

- Backend runs on port 1337 in development
- Frontend is served by the same worker (not separate dev server)
- Use browser dev tools to inspect network requests
- Check console for JavaScript errors
- Use `curl` to test API endpoints directly

## VS Code Configuration

The `.vscode/` directory contains:
- `settings.json` - Editor preferences and TypeScript settings
- `extensions.json` - Recommended extensions
- `launch.json` - Debug configurations
- `tasks.json` - Build and test tasks

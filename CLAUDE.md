# Claude AI Assistant Configuration

This document contains configuration and context for Claude AI assistants working with this Alchemy project.

## 🏢 Organizational Structure

### 👥 Team Hierarchy

#### **Engineering Leadership**
- **Team Lead**: @brendadeeznuts1111 (Brenda Deeznuts)
- **Email**: brenda.deeznuts@alchemists.dev
- **Role**: Principal Engineer & Project Lead (Final Approver for Strategic, Architectural Decisions)
- **Responsibilities**: Architecture decisions, final merge approvals for strategic changes, strategic direction, high-level project roadmap, team coordination and mentoring
- **Department**: Engineering Leadership
- **Profile**: Brenda is the visionary behind Project Alchemist, setting the technical direction and fostering a culture of innovation. She's passionate about developer experience and robust infrastructure, focusing her attention on strategic and architectural oversight.

#### **Core Engineering Departments**

**🚀 Infrastructure Team (Alchemist Core Infra)**
- **Lead**: @alice.smith (Alice Smith)
- **Email**: alice.smith@alchemists.dev
- **Role**: Infrastructure Lead (Primary Reviewer for Infrastructure)
- **Profile**: Alice leads the Infrastructure Team, ensuring our pipelines run smoothly and efficiently. She's the primary decision-maker for tactical infrastructure changes and reviews all core infrastructure PRs.
- **Members**:
  - @infra_dev1 (Bob Johnson) - CI/CD Specialist
  - @infra_dev2 (Carol White) - Core Framework Developer
- **Focus**: CI/CD, deployment, resource providers, core framework
- **Components**: Queue, Tunnel, Worker, CLI tools
- **Expertise**: Cloudflare integration, TypeScript patterns, infrastructure-as-code

**⚡ Resource Provider Team (Alchemist Integrations)**
- **Lead**: @charlie.brown (Charlie Brown)
- **Email**: charlie.brown@alchemists.dev
- **Role**: Resource Provider Lead (Primary Reviewer for Providers)
- **Profile**: Charlie leads the Integrations Team, specializing in connecting Alchemist to the vast ecosystem of cloud services. He drives provider implementations and ensures their reliability.
- **Members**:
  - @provider_dev1 (David Green) - API Integration Specialist
- **Focus**: Implementing cloud service providers
- **Components**: All resource implementations (Docker, GitHub, Neon, etc.)
- **Expertise**: API integration, resource lifecycle management

**🧪 Quality & Testing Team (Alchemist Quality Gate)**
- **Lead**: @diana.prince (Diana Prince)
- **Email**: diana.prince@alchemists.dev
- **Role**: Quality Assurance Lead (Primary Reviewer for Quality)
- **Profile**: Diana leads the Quality Gate, designing and implementing our automated test suites and defining quality standards for the entire project.
- **Members**:
  - @qa_analyst1 (Eve Adams) - Automation Engineer
- **Focus**: Test frameworks, CI validation, quality assurance
- **Components**: Test suites, automation, validation pipelines
- **Expertise**: Vitest, end-to-end testing, test patterns

**📚 Documentation Team (Alchemist Knowledge Base)**
- **Lead**: @frank.taylor (Frank Taylor)
- **Email**: frank.taylor@alchemists.dev
- **Role**: Documentation Lead (Primary Reviewer for Documentation)
- **Profile**: Frank leads the Documentation Team, transforming complex technical concepts into clear, concise, and user-friendly documentation, guiding users through every step.
- **Members**:
  - @doc_writer1 (Grace Kim) - Technical Writer
- **Focus**: Guides, examples, API documentation
- **Components**: Documentation site, examples, guides
- **Expertise**: Technical writing, user experience

### 🏷️ Department Labels
- `dept/leadership` 👔 - Leadership team decisions (Brenda's involvement)
- `dept/infrastructure` 🏗️ - Infrastructure and deployment (Infrastructure Team ownership)
- `dept/providers` 🔌 - Resource provider implementations (Resource Provider Team ownership)
- `dept/quality` 🧪 - Testing and quality assurance (Quality & Testing Team ownership)
- `dept/documentation` 📚 - Documentation and guides (Documentation Team ownership)

### 🎭 Role-Based Labels
- `role/lead` 👑 - Department Lead responsibilities (Alice, Charlie, Diana, Frank)
- `role/reviewer` 👀 - Code review assignments (team members)
- `role/maintainer` 🔧 - Package maintenance
- `role/contributor` 🤝 - Community contributors
- `role/final-approver` ⭐ - Strategic final approval (Brenda's specific role for high-level changes)

### 📊 Hierarchy Level Labels
- `level/strategic` 🎯 - Strategic decisions (Requires Brenda's final-approver review)
- `level/tactical` ⚡ - Tactical implementations (Department Lead/Reviewer approval)
- `level/operational` 🔨 - Operational tasks (Team member/Reviewer approval)

### 📋 Assignment Rules

#### **Automatic Assignment Based on Component**
```yaml
# Infrastructure Components (Primary review by Infrastructure Team)
packages/@alch/queue/*: @alice.smith, @infra_dev1
packages/@alch/tunnel/*: @alice.smith, @infra_dev2
src/backend/*: @alice.smith, @infra_dev2
.github/workflows/*: @alice.smith, @infra_dev1

# Provider Components (Primary review by Resource Provider Team)
alchemy/src/cloudflare/*: @charlie.brown, @provider_dev1
alchemy/src/docker/*: @charlie.brown, @provider_dev1
alchemy/src/github/*: @charlie.brown, @provider_dev1

# Documentation (Primary review by Documentation Team)
docs/*: @frank.taylor, @doc_writer1
examples/*: @frank.taylor, @doc_writer1
alchemy-web/*: @frank.taylor, @doc_writer1

# Testing (Primary review by Quality & Testing Team)
src/__tests__/*: @diana.prince, @qa_analyst1
**/*.test.ts: @diana.prince, @qa_analyst1
```

#### **Review Requirements Based on Hierarchy**
```yaml
# Strategic Changes (Requires Brenda's final approval after Department Lead review)
- Architecture decisions: Requires dept/leadership + role/final-approver (@brendadeeznuts1111) + department-specific role/lead review
- Breaking changes: Requires dept/leadership + role/final-approver (@brendadeeznuts1111) + department-specific role/lead review
- New provider frameworks: Requires dept/leadership + role/final-approver (@brendadeeznuts1111) + department-specific role/lead review

# Tactical Changes (Approved by Department Lead/Reviewer)
- New resource implementations: Approved by dept/providers + role/lead (@charlie.brown) or role/reviewer
- Infrastructure improvements: Approved by dept/infrastructure + role/lead (@alice.smith) or role/reviewer
- Major refactors: Approved by dept/infrastructure + role/lead (@alice.smith) or role/reviewer

# Operational Changes (Standard Review, Approved by Team Member/Reviewer)
- Bug fixes: Approved by dept/quality + role/reviewer or role/contributor (with review)
- Documentation updates: Approved by dept/documentation + role/reviewer or role/contributor (with review)
- Test improvements: Approved by dept/quality + role/reviewer or role/contributor (with review)
```

### 🔄 Escalation Path
```
Contributor → Department Reviewer → Department Lead → (Strategic only) Leadership Final Approver
     ↓              ↓                  ↓                   ↓
  role/contributor → role/reviewer → role/lead → (if strategic) role/final-approver (@brendadeeznuts1111)
```

### 📊 Reporting Structure
```
Engineering Leadership (@brendadeeznuts1111)
├── Infrastructure Team (Alchemist Core Infra - Lead: @alice.smith)
│   ├── @infra_dev1 (Bob Johnson) - CI/CD Specialist
│   └── @infra_dev2 (Carol White) - Core Framework Developer
├── Resource Provider Team (Alchemist Integrations - Lead: @charlie.brown)
│   └── @provider_dev1 (David Green) - API Integration Specialist
├── Quality & Testing Team (Alchemist Quality Gate - Lead: @diana.prince)
│   └── @qa_analyst1 (Eve Adams) - Automation Engineer
└── Documentation Team (Alchemist Knowledge Base - Lead: @frank.taylor)
    └── @doc_writer1 (Grace Kim) - Technical Writer
```

### 🎯 Department Responsibilities

#### **Engineering Leadership (@brendadeeznuts1111)**
- ✅ Final architectural decision-making and patterns
- ✅ **Final merge approvals for `level/strategic` changes**
- ✅ Strategic project roadmap and planning
- ✅ High-level team coordination and mentoring
- ✅ Community engagement and vision
- ✅ Oversees cross-team strategic initiatives

#### **Infrastructure Team (Alchemist Core Infra - @alice.smith Lead)**
- ✅ **Primary ownership and review of Infrastructure components**
- ✅ CI/CD pipeline maintenance and evolution
- ✅ Core framework development and optimization
- ✅ Deployment and operations best practices
- ✅ Performance and reliability monitoring and improvement
- ✅ Monitors system health and alerts

#### **Resource Provider Team (Alchemist Integrations - @charlie.brown Lead)**
- ✅ **Primary ownership and review of Resource Provider implementations**
- ✅ Cloud service integrations and lifecycle management
- ✅ API wrapper development and maintenance
- ✅ Provider-specific testing and validation
- ✅ Provider documentation accuracy
- ✅ Engages with external API providers

#### **Quality & Testing Team (Alchemist Quality Gate - @diana.prince Lead)**
- ✅ **Primary ownership and review of Test frameworks and Quality Assurance**
- ✅ Test framework development and continuous improvement
- ✅ CI validation pipelines and automation
- ✅ Quality assurance processes and standards definition
- ✅ Performance testing and regression prevention
- ✅ Defines testing standards and best practices

#### **Documentation Team (Alchemist Knowledge Base - @frank.taylor Lead)**
- ✅ **Primary ownership and review of Documentation**
- ✅ Guide and tutorial creation and maintenance
- ✅ API documentation development and accuracy
- ✅ Example project development and updates
- ✅ User experience optimization within documentation
- ✅ Manages documentation platform and community content

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

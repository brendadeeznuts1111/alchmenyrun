# Claude AI Assistant Configuration

This document contains configuration and context for Claude AI assistants working with this Alchemy project.

# Alchemist Org Structure & Workflow  
> Same concepts, two planes: **resources** (`alchemy.run`) and **people** (this doc).

## 1. Team Topology (Resource-Analogue)
| Alchemist Concept | Human Equivalent | Purpose |
|-------------------|------------------|---------|
| **Profile** | Role + Scope | Limits blast radius |
| **Stage** | Dept / Project | Isolated environment |
| **Promotion** | Lead Sync → Main | Immutable artefact flow |
| **Artefact** | Deliverable / Decision | Byte-for-byte reproducible |

---

## 2. Domain Owners & Profiles
### **The Alchemists Council**  
**Lead:** @brendadeeznuts1111 (Brenda Williams)  
**Mission:** Set the **global state**—long-term vision, budget, final `level/strategic` approval.  
**Profile:** Owns the **Alchemist Profile** for strategic decisions; mirrors [alchemy.run/concepts/profiles](https://alchemy.run/concepts/profiles) but scopes **people** instead of **tokens**.

### **Infrastructure Team**  
**Lead:** @alice.smith (Alice Smith)  
**Mission:** Keep the **pipeline** green and **artefacts** immutable.  
**Profile:** Implements every rule in [alchemy.run/guides/ci](https://alchemy.run/guides/ci):  
- GitOps only—no click-ops snowflakes  
- Preview → Prod promotion locks the **exact** SHA  
- Zero-downtime via blue-green & rolling updates  

### **Providers Team**  
**Lead:** @charlie.brown (Charlie Brown)  
**Mission:** Ship **resource providers** that feel native to Alchemy.  
**Profile:** `dept/providers`—owns `@alch/*` packages and the provider SDK.

### **Quality Team**  
**Lead:** @diana.prince (Diana Prince)  
**Mission:** Gate quality **before** promotion.  
**Profile:** Enforces CI gates: ≥ 80% coverage, lint clean, type clean, perf budget.

---

## 3. Workflow Mechanics
### **PR Title Grammar**  
`[DOMAIN][SCOPE][TYPE] Imperative description`  
- **DOMAIN** = `dept/` label (`INFRA`, `PROVIDERS`, `QUALITY`)  
- **SCOPE** = component (`QUEUE`, `DOCKER-PROVIDER`, `API-DOCS`)  
- **TYPE** = `type/` label (`FEAT`, `BUG`, `REFACTOR`)  

Example:  
`[INFRA][QUEUE][FEAT] Add dead-letter queue support` 

### **Review & Approval Matrix**
| Level | Who | Gate |
|-------|-----|------|
| `tactical` | Domain Lead | 1 LGTM |
| `strategic` | Brenda | Lead-sync + final approve |
| `mentoring` | Any senior | Teach, don't gate |

### **Definition of Done (lifted from CI guide)**
- [ ] Code reviewed & approved by required parties  
- [ ] All tests (unit, integration, E2E) pass  
- [ ] Docs updated (API, user guide, examples)  
- [ ] Performance & security implications reviewed  
- [ ] Artefact SHA locked in preview → prod promotion

---

## 4. Cross-Functional Alignment
| Human Gate | CI Analogue | Frequency |
|------------|-------------|-----------|
| **Leads Sync** | `plan` stage | Weekly |
| **RFC PR** | `preview` stage | Ad-hoc |
| **Retro** | Post-mortem artefact | Bi-weekly |

---

## 5. Growth & Mentorship
- `role/mentoring` PRs = scoped profile for learners (only the permissions they need)  
- Pair programming = live review loop  
- 1:1s = personal backlog grooming  
- Skill matrix = public RFC for career path  

---

## 6. Quick-Start for New Contributors
1. Fork → branch `feat/your-name`  
2. Install: `npm create alchemy@latest`  
3. Run: `alchemy deploy --stage preview`  
4. PR title: `[PROVIDERS][YOUR-SCOPE][FEAT] Add your thing`  
5. Tag reviewer listed in `CODEOWNERS`  
6. Merge → artefact auto-promotes to prod

---

## 7. Project Health Dashboard  
> Same metrics we demand from **resources**, surfaced for **people**.

| Metric | Target | Current | CI Gate |
|--------|--------|---------|---------|
| **Lead Time** (merge → deploy) | ≤ 15 min | [![](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.alchemy.run%2Fmetric%2Flead-time )](https://alchemy.run ) | ✅ |
| **Change Failure Rate** | ≤ 2 % | [![](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.alchemy.run%2Fmetric%2Ffailure-rate )](https://alchemy.run ) | ✅ |
| **PR Review Time** (open → first approval) | ≤ 24 h | [![](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.alchemy.run%2Fmetric%2Freview-time )](https://alchemy.run ) | ✅ |
| **Doc Coverage** (ADR / major change) | 100 % | [![](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.alchemy.run%2Fmetric%2Fdoc-coverage )](https://alchemy.run ) | ✅ |
| **Mentoring Ratio** (PRs with `role/mentoring`) | ≥ 10 % | [![](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi.alchemy.run%2Fmetric%2Fmentoring-ratio )](https://alchemy.run ) | 🟡 |

> **Legend**: ✅ = gate passed, 🟡 = warning, 🔴 = gate failed  
> **Source**: live data from `alchemy.run/metrics` (public endpoint)  
> **Refresh**: badges update every 5 min; click any badge for drill-down.

### **How we collect**
- **Lead Time**: GitHub webhook → `alchemy deploy --stage metrics` → Prometheus  
- **Failure Rate**: `#incident` label count / total deployments  
- **Review Time**: GitHub API → `alchemy run query review-time`  
- **Doc Coverage**: ADR markdown files vs. `level/major` PR count  
- **Mentoring Ratio**: `role/mentoring` label on merged PRs  

### **Alerting**
- **telegram**: `#proj-alchemist-health` (webhook from Prometheus)  
- **Auto-escalate**: 2 consecutive failures → page on-call lead  

---

## 8. Enhanced Assignment & Review Rules (structured by `[DOMAIN][SCOPE][TYPE]`)
+*Quick example:*
+* `[DOMAIN]` → `dept/` label: `INFRA`, `PROVIDERS`  
+* `[SCOPE]` → component: `QUEUE`, `DOCKER-PROVIDER`, `API-DOCS`  
+* `[TYPE]` → `type/` label: `FEAT`, `BUG`, `REFACTOR`  
+*Sample PR title:* `[INFRA][QUEUE][FEAT] Implement durable queue for worker restarts` 

### Assignment Rules by Pattern
```yaml
# Infrastructure Components (dept/infrastructure)
packages/@alch/queue/*: @alice.smith, @infra_dev1
packages/@alch/tunnel/*: @alice.smith, @infra_dev2
src/backend/*: @alice.smith, @infra_dev2
.github/workflows/*: @alice.smith, @infra_dev1

# Provider Components (dept/providers)  
alchemy/src/cloudflare/*: @charlie.brown, @provider_dev1
alchemy/src/docker/*: @charlie.brown, @provider_dev1
alchemy/src/github/*: @charlie.brown, @provider_dev1

# Documentation (dept/documentation)
docs/*: @frank.taylor, @doc_writer1
examples/*: @frank.taylor, @doc_writer1

# Quality & Testing (dept/quality)
src/__tests__/*: @diana.prince, @qa_analyst1
**/*.test.ts: @diana.prince, @qa_analyst1
```

### Review Requirements by Hierarchy Level
| Level | Pattern | Required Reviewers | Approvers | Notes |
|-------|---------|-------------------|-----------|-------|
| `strategic` | `level/strategic` | Domain Lead + 1 reviewer | Brenda final | Architecture changes, breaking changes |
| `tactical` | `level/tactical` | Domain Lead + 1 reviewer | Domain Lead | New features, significant refactors |
| `operational` | `level/operational` | 1 reviewer | Domain Lead | Bug fixes, docs, small changes |

### PR Title Grammar Enforcement
- **Format**: `[DOMAIN][SCOPE][TYPE] Imperative description`
- **DOMAIN**: Maps to `dept/` labels (`INFRA`, `PROVIDERS`, `QUALITY`)
- **SCOPE**: Specific component (`QUEUE`, `DOCKER-PROVIDER`, `API-DOCS`)  
- **TYPE**: Maps to `type/` labels (`FEAT`, `BUG`, `REFACTOR`)

**Examples:**
```
[INFRA][QUEUE][FEAT] Add dead-letter queue support
[PROVIDERS][DOCKER][BUG] Fix container cleanup race condition  
[QUALITY][TESTS][REFACTOR] Migrate to Vitest from Jest
[DOCS][GUIDES][FEAT] Add Cloudflare deployment tutorial
```

### Escalation Path
1. **Contributor** → Opens PR with proper `[DOMAIN][SCOPE][TYPE]` title
2. **Domain Reviewer** → Technical review, code quality
3. **Domain Lead** → Tactical approval for their domain
4. **Cross-functional Leads** → For `dept/cross-functional` changes
5. **Brenda** → Strategic final approval for `level/strategic` changes

### Quality Gates by Domain
| Domain | Coverage | Linting | Testing | Docs |
|--------|----------|---------|---------|------|
| `INFRA` | ≥80% | ✅ | Unit + Integration | API docs |
| `PROVIDERS` | ≥80% | ✅ | Unit + E2E | Provider docs |
| `QUALITY` | ≥90% | ✅ | All test types | Test docs |
| `DOCS` | N/A | ✅ | Link validation | Content review |

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

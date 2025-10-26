# Claude AI Assistant Configuration

This document contains configuration and context for Claude AI assistants working with this Alchemy project.

## Project Alchemist - Enhanced Team & Governance Hierarchy

### 👥 Team Hierarchy and Core Principles

Alchemist thrives on a culture of distributed ownership, transparency, and continuous improvement. Our structure ensures clarity on decision-making while empowering every team to drive their domain.

#### **Leadership Team**
- **Team Name**: The Alchemists Council
- **Team Lead**: @brendadeeznuts1111 (Brenda Deeznuts)
- **Email**: brenda.deeznuts@alchemists.dev
- **Role**: Principal Engineer & Project Lead (Strategic Vision & Final Architectural Approver)
- **Responsibilities**:
  - Defines and stewards the overarching technical vision and strategic direction
  - Provides final architectural approval for `level/strategic` changes, ensuring alignment with project goals
  - Mentors Department Leads, fostering their growth and leadership
  - Manages high-level project roadmap and inter-departmental dependencies
  - Represents Project Alchemist in critical external engagements and community leadership
  - Oversees budget, resource allocation, and long-term sustainability
- **Department**: Engineering Leadership
- **Profile**: Brenda is the visionary behind Project Alchemist, setting the technical direction and fostering a culture of innovation. Her focus is on the long-term health and strategic evolution of the project, empowering her teams to take day-to-day ownership.

#### **Core Engineering Department - *Principles: Ownership, Quality, Collaboration***

**🚀 Infrastructure Team**
- **Team Name**: Alchemist Core Infra
- **Lead**: @alice.smith (Alice Smith)
- **Email**: alice.smith@alchemists.dev
- **Role**: Infrastructure Lead (Domain Owner, Primary Decision-Maker & Technical Reviewer)
- **Profile**: Alice leads the Infrastructure Team, acting as the primary owner for all foundational components. She champions best practices for CI/CD, deployment, and core framework stability, making tactical decisions and guiding her team's technical direction. She fosters a culture of reliability and automation.
- **Members**:
  - @infra_dev1 (Bob Johnson)
    - **Email**: bob.johnson@alchemists.dev
    - **Role**: CI/CD & DevOps Specialist (Focus: Automation, Monitoring, SRE)
    - **Profile**: Bob is instrumental in maintaining and evolving our automated build, test, and deployment pipelines. He specializes in site reliability engineering and ensuring robust system monitoring.
  - @infra_dev2 (Carol White)
    - **Email**: carol.white@alchemists.dev
    - **Role**: Core Framework Architect (Focus: Scalability, Performance, Core API Design)
    - **Profile**: Carol is responsible for the design and evolution of our core framework, focusing on performance, scalability, and clean API abstractions that enable other teams.
- **Domain Ownership**:
  - End-to-end CI/CD and deployment pipelines
  - Core framework design, stability, and API contracts
  - System reliability, performance, and monitoring infrastructure
  - Cloud resource management and cost optimization strategies
- **Focus**: CI/CD, deployment, resource providers, core framework
- **Components**: Queue, Tunnel, Worker, CLI tools
- **Expertise**: Cloudflare integration, TypeScript patterns, infrastructure-as-code, GitOps, observability

**⚡ Resource Provider Team**
- **Team Name**: Alchemist Integrations Hub
- **Lead**: @charlie.brown (Charlie Brown)
- **Email**: charlie.brown@alchemists.dev
- **Role**: Resource Provider Lead (Domain Owner, Primary Decision-Maker & Technical Reviewer)
- **Profile**: Charlie leads the Integrations Hub, overseeing the development and maintenance of all external service integrations. He ensures our providers are robust, secure, and user-friendly, setting the standards for API interaction and resource lifecycle management. He fosters expertise in diverse cloud ecosystems.
- **Members**:
  - @provider_dev1 (David Green)
    - **Email**: david.green@alchemists.dev
    - **Role**: Cloud Integration Specialist (Focus: API Design, Security, External Service Hooks)
    - **Profile**: David excels at connecting Alchemist to the vast ecosystem of cloud services, ensuring secure, efficient, and well-documented integrations.
- **Domain Ownership**:
  - Implementation and maintenance of all specific cloud service integrations (Docker, GitHub, Neon, AWS, GCP, etc.)
  - Lifecycle management of external resources created via Alchemist
  - Secure API wrapper design and credential management
  - Compliance with external service provider terms and best practices
- **Focus**: Implementing cloud service providers
- **Components**: All resource implementations (Docker, GitHub, Neon, etc.)
- **Expertise**: API integration, resource lifecycle management, security protocols (OAuth, API Keys), idempotency, error handling

**🧪 Quality & Testing Team**
- **Team Name**: Alchemist Quality Gate
- **Lead**: @diana.prince (Diana Prince)
- **Email**: diana.prince@alchemists.dev
- **Role**: Quality Assurance Lead (Domain Owner, Primary Decision-Maker & Quality Advocate)
- **Profile**: Diana leads the Quality Gate, establishing and enforcing testing standards across the project. She designs and implements robust test frameworks, ensuring every release meets the highest quality standards and provides a reliable user experience. She advocates for quality throughout the development lifecycle.
- **Members**:
  - @qa_analyst1 (Eve Adams)
    - **Email**: eve.adams@alchemists.dev
    - **Role**: Automation Engineer (Focus: Test Framework Development, E2E Testing)
    - **Profile**: Eve is the architect of our automated test suites, developing and maintaining the tools that validate functionality, performance, and reliability across the entire system.
- **Domain Ownership**:
  - Definition and enforcement of project-wide quality standards and testing methodologies
  - Development and maintenance of test frameworks (unit, integration, E2E, performance)
  - Management of CI validation pipelines and release gating criteria
  - Regression prevention strategies and bug triaging processes
  - Educating teams on effective testing practices
- **Focus**: Test frameworks, CI validation, quality assurance
- **Components**: Test suites, automation, validation pipelines
- **Expertise**: Vitest, Playwright/Cypress, end-to-end testing, performance testing, security testing basics, test-driven development (TDD)

**📚 Documentation Team**
- **Team Name**: Alchemist Knowledge Base
- **Lead**: @frank.taylor (Frank Taylor)
- **Email**: frank.taylor@alchemists.dev
- **Role**: Documentation Lead (Domain Owner, Primary Decision-Maker & User Advocate)
- **Profile**: Frank leads the Knowledge Base team, ensuring Project Alchemist is accessible and understandable to all users and contributors. He champions clear, comprehensive, and accurate documentation, driving content strategy and user experience for learning.
- **Members**:
  - @doc_writer1 (Grace Kim)
    - **Email**: grace.kim@alchemists.dev
    - **Role**: Technical Writer & UX Content Strategist (Focus: User Guides, API Docs, Accessibility)
    - **Profile**: Grace transforms complex technical concepts into clear, concise, and user-friendly documentation. She ensures our guides, examples, and API references are accurate and enhance the user journey.
- **Domain Ownership**:
  - Content strategy and information architecture for all project documentation
  - Creation and maintenance of user guides, tutorials, and examples
  - Development and upkeep of API documentation and reference materials
  - Management of the documentation site platform and tooling
  - Driving contributor experience through clear documentation
- **Focus**: Guides, examples, API documentation
- **Components**: Documentation site, examples, guides
- **Expertise**: Technical writing, user experience (UX), static site generators (e.g., Docusaurus, Next.js), content management, information architecture

### 🏷️ Labels and Workflow Indicators

#### **Department Labels (Domain of ownership)**
- `dept/leadership` 👔 - Leadership team decisions (Brenda's involvement)
- `dept/infrastructure` 🏗️ - Infrastructure and deployment (Infrastructure Team ownership)
- `dept/providers` 🔌 - Resource provider implementations (Resource Provider Team ownership)
- `dept/quality` 🧪 - Testing and quality assurance (Quality & Testing Team ownership)
- `dept/documentation` 📚 - Documentation and guides (Documentation Team ownership)
- `dept/cross-functional` 🤝 - Initiatives requiring multiple teams

#### **Role-Based Labels (Reviewer responsibility)**
- `role/lead` 👑 - Department Lead responsibilities (e.g., Alice, Charlie, Diana, Frank)
- `role/reviewer` 👀 - Designated team member for code review
- `role/maintainer` 🔧 - Package maintenance
- `role/contributor` 🤝 - Community contributors
- `role/final-approver` ⭐ - Strategic final approval (Brenda's specific role for high-level changes)
- `role/mentoring` 🌱 - Indicates a PR or task is for mentee growth/learning

#### **Hierarchy Level Labels (Impact/Risk assessment)**
- `level/strategic` 🎯 - Strategic decisions (Requires Brenda's final-approver review)
- `level/tactical` ⚡ - Tactical implementations (Department Lead/Reviewer approval)
- `level/operational` 🔨 - Operational tasks (Team member/Reviewer approval)

#### **PR/Issue Type Labels (Nature of the change)**
- `type/bug` 🐞 - Report a defect or issue
- `type/feature` ✨ - Implement a new capability
- `type/enhancement` 🚀 - Improve existing functionality
- `type/chore` 🧹 - Routine maintenance, build updates, etc.
- `type/refactor` ♻️ - Code restructuring without changing behavior
- `type/docs` 📖 - Documentation additions or changes
- `type/test` ✅ - Adding or updating tests
- `type/security` 🔒 - Security vulnerability or improvement

#### **Workflow Status Labels (New! To guide PR/Issue progression)**
- `status/triage` 🔍 - New issue/PR, needs initial assessment
- `status/ready-for-dev` ✅ - Approved for development
- `status/in-progress` 👨‍💻 - Actively being worked on
- `status/ready-for-review` 👀 - Code is ready for peer review
- `status/changes-requested` ✏️ - Review feedback needs addressing
- `status/approved` 👍 - Approved by required reviewers (awaiting merge or final approval)
- `status/blocked` 🛑 - Cannot proceed due to external dependency or issue
- `status/stale` 🕰️ - Inactive, needs attention or closure
- `status/merged` 🚀 - Successfully merged
- `status/closed` ❌ - Closed without merging

### 📋 Assignment Rules and Review Workflow

**Goal:** Empower teams to own their merges for most changes, routing strategic decisions to Brenda.

#### **Automatic Assignment Based on Component (Primary reviewers + backup)**
```yaml
# Infrastructure Components (Lead: @alice.smith)
packages/@alch/queue/*: @alice.smith, @infra_dev1
packages/@alch/tunnel/*: @alice.smith, @infra_dev2
src/backend/*: @alice.smith, @infra_dev2
.github/workflows/*: @alice.smith, @infra_dev1

# Provider Components (Lead: @charlie.brown)
alchemy/src/cloudflare/*: @charlie.brown, @provider_dev1
alchemy/src/docker/*: @charlie.brown, @provider_dev1
alchemy/src/github/*: @charlie.brown, @provider_dev1

# Documentation (Lead: @frank.taylor)
docs/*: @frank.taylor, @doc_writer1
examples/*: @frank.taylor, @doc_writer1
alchemy-web/*: @frank.taylor, @doc_writer1

# Testing (Lead: @diana.prince)
src/__tests__/*: @diana.prince, @qa_analyst1
**/*.test.ts: @diana.prince, @qa_analyst1
```

#### **Review Requirements Based on Hierarchy**

**General Principle:** All PRs require at least one `role/reviewer` approval from the relevant `dept/` team.

**Workflow:**
1. **Submission**: Developer opens PR (self-assigns `status/in-progress` and relevant `type/`)
2. **Initial Review**: Automated assignment or developer requests review from appropriate `dept/` team's `role/reviewer`. PR gets `status/ready-for-review`
3. **Department Lead Review (Tactical/Strategic)**: If the change is `level/tactical` or `level/strategic`, the `role/lead` of the relevant `dept/` must review and approve
4. **Strategic Final Approval (Brenda Only)**: If the change is `level/strategic`, *after* department lead approval, `role/final-approver` (@brendadeeznuts1111) is requested for final review and merge

```yaml
# Strategic Changes (`level/strategic`)
- Architecture decisions, major breaking changes, new core frameworks, substantial shifts in product direction
- **Workflow**: Requires 1 `dept/X` `role/reviewer` + `dept/X` `role/lead` approval **AND** `dept/leadership` `role/final-approver` (@brendadeeznuts1111) approval
- Labels: `dept/X`, `level/strategic`, `type/X`, `status/ready-for-review` -> `status/approved` (by lead) -> `status/approved` (by Brenda) -> `status/merged`

# Tactical Changes (`level/tactical`)
- New resource implementations, significant infrastructure improvements, major refactors impacting a single domain
- **Workflow**: Requires 1 `dept/X` `role/reviewer` + `dept/X` `role/lead` approval. **No Brenda review required**
- Labels: `dept/X`, `level/tactical`, `type/X`, `status/ready-for-review` -> `status/approved` (by reviewer/lead) -> `status/merged`

# Operational Changes (`level/operational`)
- Bug fixes, documentation updates, test improvements, minor enhancements, small refactors
- **Workflow**: Requires at least 1 `dept/X` `role/reviewer` approval
- Labels: `dept/X`, `level/operational`, `type/X`, `status/ready-for-review` -> `status/approved` (by reviewer) -> `status/merged`

# Cross-functional Changes (`dept/cross-functional`)
- Features or bug fixes that span multiple `dept/` domains
- **Workflow**: Requires at least one `role/reviewer` from *each* relevant department. If `level/strategic`, still requires Brenda's final approval
- Labels: `dept/cross-functional`, plus relevant `dept/X` labels, `level/X`, `type/X`
```

### 🔄 Escalation Path (Clearer Roles & Responsibilities)

The escalation path ensures issues are resolved at the lowest appropriate level, empowering teams while providing fallback.

1. **Developer/Contributor**: Initiates change/identifies issue
   - `role/contributor`
2. **Department Reviewer**: First line of review, provides feedback, ensures code quality and adherence to team standards
   - `role/reviewer` (within relevant `dept/X`)
3. **Department Lead**: For `level/tactical` changes or unresolved `level/operational` issues/conflicts. Approves merges for their domain (unless strategic). Mentors reviewers
   - `role/lead` (within relevant `dept/X`)
4. **Cross-functional Leads**: For `dept/cross-functional` changes, leads from all impacted teams collaborate. If unresolved, escalates to Leadership
   - Multiple `role/lead`
5. **Leadership Final Approver (Brenda)**: For `level/strategic` changes, or as a final escalation point for unresolved cross-functional conflicts. Provides final sign-off and ensures alignment with strategic vision
   - `role/final-approver` (@brendadeeznuts1111)

### 📊 Reporting Structure
```
Engineering Leadership (@brendadeeznuts1111 - Alchemists Council)
├── Infrastructure Team (Alchemist Core Infra - Lead: @alice.smith)
│   ├── @infra_dev1 (Bob Johnson) - CI/CD & DevOps Specialist
│   └── @infra_dev2 (Carol White) - Core Framework Architect
├── Resource Provider Team (Alchemist Integrations Hub - Lead: @charlie.brown)
│   └── @provider_dev1 (David Green) - Cloud Integration Specialist
├── Quality & Testing Team (Alchemist Quality Gate - Lead: @diana.prince)
│   └── @qa_analyst1 (Eve Adams) - Automation Engineer
└── Documentation Team (Alchemist Knowledge Base - Lead: @frank.taylor)
    └── @doc_writer1 (Grace Kim) - Technical Writer & UX Content Strategist
```

### 🎯 Department Responsibilities (Expanded for Ownership)

#### **Engineering Leadership (@brendadeeznuts1111 - Alchemists Council)**
- ✅ **Defines and maintains project vision and long-term strategy**
- ✅ **Final architectural decision-making and project governance**
- ✅ **Final merge approvals for `level/strategic` changes**
- ✅ Oversees cross-departmental alignment and conflict resolution
- ✅ Mentors Department Leads and fosters leadership growth
- ✅ Manages external partnerships and community relations

#### **Infrastructure Team (@alice.smith Lead - Alchemist Core Infra)**
- ✅ **Full ownership of CI/CD, deployment, core framework, and operational stability**
- ✅ **Primary review and merge authority for all `dept/infrastructure` `level/tactical` and `level/operational` changes**
- ✅ Proactive identification and resolution of performance bottlenecks
- ✅ Development and enforcement of secure infrastructure practices
- ✅ Maintenance of monitoring, logging, and alerting systems
- ✅ Provides infrastructure-as-code expertise to all teams

#### **Resource Provider Team (@charlie.brown Lead - Alchemist Integrations Hub)**
- ✅ **Full ownership of all cloud service integrations and their lifecycle**
- ✅ **Primary review and merge authority for all `dept/providers` `level/tactical` and `level/operational` changes**
- ✅ Ensures secure, performant, and reliable interactions with external APIs
- ✅ Manages provider versioning and compatibility
- ✅ Proactively researches and integrates new cloud services based on roadmap needs
- ✅ Develops internal tools to streamline provider development and testing

#### **Quality & Testing Team (@diana.prince Lead - Alchemist Quality Gate)**
- ✅ **Full ownership of project quality standards, test frameworks, and validation processes**
- ✅ **Primary review and merge authority for all `dept/quality` `level/tactical` and `level/operational` changes**
- ✅ Designs and implements comprehensive automated test suites (unit, integration, E2E, performance, security)
- ✅ Defines and manages release gating criteria within CI/CD pipelines
- ✅ Triages incoming bugs and works with development teams to ensure timely resolution
- ✅ Evangelizes testing best practices and provides training across teams

#### **Documentation Team (@frank.taylor Lead - Alchemist Knowledge Base)**
- ✅ **Full ownership of all project documentation, examples, and user learning experience**
- ✅ **Primary review and merge authority for all `dept/documentation` `level/tactical` and `level/operational` changes**
- ✅ Develops and maintains a clear and accessible documentation portal
- ✅ Ensures accuracy, completeness, and clarity of API documentation
- ✅ Creates compelling examples and tutorials to onboard new users and contributors
- ✅ Collects user feedback on documentation and drives continuous improvement

### 🛠️ Tools & Practices to Reinforce This Structure

#### **GitHub CODEOWNERS File**
Configure your `.github/CODEOWNERS` file to automatically request reviews from `@[team-lead]` and `@[team-members]` based on file paths. This formalizes the "Automatic Assignment" section.

#### **GitHub Issue/PR Templates**
Create templates that guide contributors to select appropriate labels (`dept/`, `level/`, `type/`) and clearly state who needs to approve for different change types.

#### **Regular Sync Meetings**
- **Team Syncs**: Daily/Weekly standups for each team to manage `status/in-progress` and `status/ready-for-review` tasks
- **Department Lead Sync**: Weekly sync for Department Leads to discuss cross-functional dependencies, tactical issues, and potential `level/strategic` items that might need Brenda's attention
- **Brenda's Strategic Review Session**: A dedicated weekly or bi-weekly slot for Brenda to review `level/strategic` PRs and discuss high-level roadmap items with leads

#### **Mentorship Program**
Implement a formal mentorship aspect where Leads/Senior members actively guide junior `role/contributor`s, potentially using the `role/mentoring` label on PRs for specific learning opportunities.

#### **Definition of Done (DoD)**
Each team should have a clear DoD checklist for PRs (e.g., "Tests written," "Documentation updated," "Code reviewed by X," "Passing CI").

#### **Code of Conduct**
Explicitly link to a project Code of Conduct for all contributors, emphasizing respectful collaboration, aligning with Alchemist's core principles.

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

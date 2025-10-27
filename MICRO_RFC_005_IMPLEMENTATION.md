# ✅ micro-rfc-005 IMPLEMENTATION CHECKLIST

| line | file | change |
|---|---|---|
| ☐ | `src/do/github-agent.ts` create | `export class GithubAgent { … }` ≤80 LOC |
| ☐ | `workers/github-webhook/index.ts` | add `export { GithubAgent }` re-export |
| ☐ | `workers/github-webhook/index.ts` | replace current handler with `env.GITHUB_DO.get(id).fetch(req.clone(), headers)` |
| ☐ | `alchemy.run.ts` append | `const ghAgentDO = await DurableObject("GithubAgent", { class: GithubAgent });` |
| ☐ | `alchemy.run.ts` append | `await Worker("github-webhook", { … bindings: { GITHUB_DO: ghAgentDO, … } });` |
| ☐ | `alchemy.run.ts` | confirm `profile: "ci"` and `stage: $env("STAGE")` are present |
| ☐ | `.env.example` | add `TELEGRAM_TOPIC_MOBILE=25781` and `TELEGRAM_TOPIC_FORUM=25782` |
| ☐ | `package.json` | bump minor → `0.5.0` (feature release) |
| ☐ | `rfcs/micro-rfc-005.md` | change status line `status: proposed → ready → accepted → merged → implemented` |

When every box is **ticked**, convert PR to **Ready** and tag `@alchemist/core`.

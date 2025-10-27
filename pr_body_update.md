### ✅  micro-rfc-006  ACCEPTED

| field | value |
|---|---|
| status | accepted |
| merged-by | @alchemist/core |
| merge-sha | TBD (filled by GitHub) |

#### 1.  Files that must appear in main
```
rfcs/micro-rfc-006.md                    # 40-line spec
tgk/commands/issue.ts                    # AI issue wizard + triage
tgk/commands/release.ts                  # AI release plan → approve → deploy
tgk/commands/customer.ts                 # AI customer notify
workers/tgk-orchestrator/index.ts        # AI/OPA/D12 worker  (≤80 LOC)
.github/workflows/issue-triage.yml       # auto-label new issues
.github/workflows/release.yml            # plan → approve → deploy → announce
infra/telegram/policies/release.rego     # OPA gate for releases
```

#### 2.  Post-merge smoke test
```bash
# 1.  create a dummy issue
echo '{"title":"Telegram pin race","body":"Two concurrent reviews"}' | \
  gh issue create --title "test race" --body -
# 2.  watch auto-label happen
./tgk issue triage $(gh issue list --limit 1 --json number -q .[0].number)
# expected: customer/internal, topic/state-pinning, impact/low
# 3.  create a release
./tgk release plan --type minor
# expected: AI drafts plan → Telegram topic "Alchemists Council" → /lgtm → deploy
```

#### 3.  Roll-back trigger
If **AI suggestion accuracy < 80 %** after 10 issues, disable auto-labelling and fall back to manual mode.

#### 4.  Telemetry tag
All orchestrator stubs emit `alc.orchestrator.action={issue|release|customer}` in Trace/Logpush for cost attribution.

---

**Approved** – convert PR to **Ready** and tag @alchemist/core for final stamp.

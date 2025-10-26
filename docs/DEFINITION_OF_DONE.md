# Project Alchemist - Definition of Done (DoD)

## Overview

This document defines the Definition of Done (DoD) for each team in Project Alchemist. The DoD ensures consistent quality, clarity on completion criteria, and alignment across all teams.

## General DoD (All Teams)

### ✅ Code Quality Standards
- [ ] Code follows project style guidelines and linting rules
- [ ] Code is self-reviewed by the author before submission
- [ ] All new code is covered by appropriate tests
- [ ] No TODO comments or FIXME markers left in production code
- [ ] Error handling is implemented and follows project patterns
- [ ] Logging is appropriate and follows project standards
- [ ] Performance considerations have been addressed

### ✅ Testing Requirements
- [ ] Unit tests written for new functionality (>90% coverage)
- [ ] Integration tests written for component interactions
- [ ] End-to-end tests written for user-facing features
- [ ] All tests pass in CI/CD pipeline
- [ ] Performance tests written for critical paths (if applicable)
- [ ] Security tests written for sensitive operations (if applicable)

### ✅ Documentation Standards
- [ ] Code comments are clear and explain complex logic
- [ ] API documentation is updated (if applicable)
- [ ] User documentation is updated (if applicable)
- [ ] Developer documentation is updated (if applicable)
- [ ] Examples are provided and tested (if applicable)
- [ ] README files are updated (if applicable)

### ✅ Review Process
- [ ] Peer review completed by at least one team member
- [ ] All review feedback addressed or documented
- [ ] Department lead review completed (for tactical/strategic changes)
- [ ] Final approval obtained (Brenda for strategic changes)
- [ ] All required approvals received based on change level

### ✅ CI/CD & Deployment
- [ ] CI/CD pipeline passes successfully
- [ ] Build artifacts are properly generated
- [ ] Deployment scripts are updated (if applicable)
- [ ] Environment-specific configurations are tested
- [ ] Rollback plan is documented (if applicable)
- [ ] Post-deployment verification steps are defined

---

## 🚀 Infrastructure Team DoD

### Additional Requirements
- [ ] Infrastructure as Code (IaC) follows best practices
- [ ] Monitoring and alerting are configured for new components
- [ ] Security scanning passes for all new infrastructure
- [ ] Cost implications are documented and approved
- [ ] Scalability considerations are addressed
- [ ] Disaster recovery procedures are updated (if applicable)
- [ ] Performance benchmarks are established and met

### Specific Components
#### CI/CD Pipeline
- [ ] Pipeline is idempotent and reliable
- [ ] Build times are optimized and documented
- [ ] Artifact storage and cleanup are configured
- [ ] Pipeline security is reviewed and approved
- [ ] Notification systems are configured for failures

#### Core Framework
- [ ] API contracts are stable and documented
- [ ] Backward compatibility is maintained (or breaking changes documented)
- [ ] Memory usage is optimized and documented
- [ ] Thread safety is verified (if applicable)
- [ ] Resource cleanup is properly implemented

#### Deployment Systems
- [ ] Zero-downtime deployment is verified (if applicable)
- [ ] Health checks are implemented and tested
- [ ] Configuration management is secure and auditable
- [ ] Deployment rollback is tested and documented

---

## ⚡ Resource Provider Team DoD

### Additional Requirements
- [ ] Provider follows established resource patterns
- [ ] API integration is secure and follows best practices
- [ ] Error handling covers all API failure scenarios
- [ ] Rate limiting and throttling are implemented (if applicable)
- [ ] Resource lifecycle management is complete
- [ ] Provider documentation includes troubleshooting guide
- [ ] External service dependencies are documented

### Specific Components
#### Cloud Service Integration
- [ ] Authentication and authorization are secure
- [ ] API versioning is handled appropriately
- [ ] Timeout and retry logic is implemented
- [ ] Resource cleanup is verified and tested
- [ ] Cost tracking is implemented (if applicable)

#### Resource Implementation
- [ ] Resource state management is robust
- [ ] Idempotency is verified and tested
- [ ] Resource validation is comprehensive
- [ ] Resource dependencies are handled correctly
- [ ] Resource monitoring is configured

#### Security & Compliance
- [ ] Credential management follows security best practices
- [ ] Data encryption is implemented where required
- [ ] Compliance requirements are documented and met
- [ ] Security scanning passes for all provider code

---

## 🧪 Quality & Testing Team DoD

### Additional Requirements
- [ ] Test coverage meets or exceeds team standards (>95% for critical paths)
- [ ] Test performance is optimized and documented
- [ ] Test flakiness is eliminated (<1% flaky test rate)
- [ ] Test data management is secure and efficient
- [ ] Test environments are properly configured
- [ ] Test reporting is comprehensive and actionable

### Specific Components
#### Test Framework
- [ ] Framework is extensible and well-documented
- [ ] Test utilities are reusable and tested
- [ ] Test configuration is flexible and maintainable
- [ ] Test parallelization is implemented where beneficial
- [ ] Test debugging tools are available and documented

#### Automated Testing
- [ ] Unit tests are fast and reliable
- [ ] Integration tests cover all critical paths
- [ ] End-to-end tests simulate real user scenarios
- [ ] Performance tests establish and monitor baselines
- [ ] Security tests identify potential vulnerabilities

#### Quality Gates
- [ ] Release criteria are clearly defined and enforced
- [ ] Quality metrics are tracked and reported
- [ ] Regression testing is comprehensive
- [ ] Bug triage process is followed consistently
- [ ] Quality trends are monitored and acted upon

---

## 📚 Documentation Team DoD

### Additional Requirements
- [ ] Content follows project style guide and voice
- [ ] Information architecture is logical and user-friendly
- [ ] Accessibility standards are met (WCAG 2.1 AA)
- [ ] Content is accurate and up-to-date
- [ ] User feedback is incorporated and addressed
- [ ] Documentation is searchable and discoverable

### Specific Components
#### User Documentation
- [ ] Getting started guides are comprehensive and tested
- [ ] Tutorials are step-by-step and verified
- [ ] API documentation is complete and accurate
- [ ] Troubleshooting guides cover common issues
- [ ] Examples are practical and tested

#### Developer Documentation
- [ ] Architecture documentation is current
- [ ] Contributing guidelines are clear and comprehensive
- [ ] Code examples are tested and documented
- [ ] Development setup instructions work reliably
- [ ] API reference is complete and accurate

#### Content Management
- [ ] Content review process is followed
- [ ] Version control is properly maintained
- [ ] Content deployment is automated and reliable
- [ ] Content analytics are tracked and analyzed
- [ ] Content updates are communicated to users

---

## 🔄 Cross-Functional DoD

### Multi-Team Initiatives
- [ ] All affected teams have reviewed and approved changes
- [ ] Cross-team dependencies are documented and resolved
- [ ] Integration points are thoroughly tested
- [ ] Communication plans are executed
- [ ] Rollback procedures are coordinated across teams
- [ ] Success metrics are defined and tracked

### Strategic Changes
- [ ] Business impact is assessed and documented
- [ ] Stakeholder approval is obtained
- [ ] Migration plans are developed and communicated
- [ ] Training materials are prepared (if applicable)
- [ ] Support procedures are updated
- [ ] Success criteria are clearly defined and measurable

---

## 📊 DoD Verification Checklist

### Pre-Merge Verification
- [ ] All team-specific DoD items are completed
- [ ] General DoD items are completed
- [ ] Cross-functional requirements are met (if applicable)
- [ ] All automated checks pass
- [ ] Manual verification is completed
- [ ] Documentation is updated and reviewed

### Post-Merge Verification
- [ ] Deployment is successful across all environments
- [ ] Monitoring shows expected behavior
- [ ] User feedback is collected and analyzed
- [ ] Performance metrics meet expectations
- [ ] Security scans pass in production
- [ ] Rollback capability is verified (if applicable)

---

## 🎯 DoD Enforcement

### Team Responsibilities
- **Team Leads**: Ensure DoD is followed for all team work
- **Reviewers**: Verify DoD compliance during code reviews
- **Quality Team**: Audit DoD compliance and report metrics
- **Individual Contributors**: Take ownership of DoD compliance

### Quality Metrics
- **DoD Compliance Rate**: Percentage of work items meeting DoD
- **Review Cycle Time**: Time from submission to approval
- **Defect Rate**: Number of defects found post-release
- **Test Coverage**: Percentage of code covered by tests
- **Documentation Completeness**: Percentage of documented features

### Continuous Improvement
- **Monthly Reviews**: DoD effectiveness is reviewed monthly
- **Quarterly Updates**: DoD is updated based on feedback and metrics
- **Annual Assessment**: Comprehensive DoD review and overhaul
- **Feedback Loop**: Continuous feedback collection and improvement

---

## 📚 Additional Resources

### Templates and Checklists
- [PR Template](../.github/PULL_REQUEST_TEMPLATE.md)
- [Issue Templates](../.github/ISSUE_TEMPLATE/)
- [Code Review Checklist](CODE_REVIEW_CHECKLIST.md)
- [Testing Guidelines](TESTING_GUIDELINES.md)

### Training and Onboarding
- [Contributor Guide](CONTRIBUTING.md)
- [Development Setup](DEVELOPMENT_SETUP.md)
- [Mentorship Program](MENTORSHIP_PROGRAM.md)
- [Best Practices](BEST_PRACTICES.md)

---

## 18.5 Day-1 Sprint (0 → First Deploy in ≤ 24 h) – **Telegram Edition**

| Time | Task | Owner | Telegram Chat / Bot | Exit Criterion |
|---|---|---|---|---|
| T+0 m  | Brenda `/lgtm approved` | `@brendadeeznuts1111` | `@AlchemistsCouncil` | PR branch unblocked |
| T+15 m | Fast-forward feature branch to `main` HEAD | `@alice.smith` | `@infra_team` | no merge conflicts |
| T+30 m | CI unit + integration **must** green | `CI_Bot` | `@ci_status` | 99 % coverage retained |
| T+60 m | Security regression scan (`sast / iam-diff`) | `SecurityBot` | `@security_alerts` | zero new findings |
| T+2 h  | Build internal dev image `v1.47.0-d.1` | `ReleaseBot` | `@releases` | image pushed |
| T+3 h  | Deploy **dev only** (flag `AUTO_SUFFIX_D1=on`) | `@alice.smith` | `@dogfood_logs` | D1 list shows `-dev` suffix |
| T+4 h  | Run 1-click synthetic transaction test | `@diana.prince` | `@quality_gate` | 100 % pass, latency ≤ baseline +5 % |
| T+6 h  | Publish **internal** release notes | `@franktaylor` | `@alchemist_dev` | migration hint included |
| T+24 h | Go/No-Go for staging canary | on-call + Alice | `@release_command` | ✅ proceed → move to §19<br>❌ roll back & reopen RFC |

**Rollback trigger:** any failed check above **or** `#incident` topic opened → `git revert` + flag disabled in ≤ 10 min.

*(Telegram tip: pin the final "✅ Go" message so the retro bot can scrape it automatically.)*

---

## ALC-RFC-2025-10-ZERO-FRICTION  
### Day-2 → Retirement Checklist (Telegram Edition)

Same order of operations as the Slack version—just swap comms to Telegram channels/bots.

| Step | Task | Owner | Telegram Chat / Bot | Done? |
|---|---|---|---|---|
| 1 | Merge approved PR to `main` (flag = off) | `@alice.smith` | `@infra_team` | ☐ |
| 2 | Tag canary `v1.47.0-rc1` | `ReleaseBot` | `@releases` | ☐ |
| 3 | Deploy 10 % canary (staging) | SRE | `@staging_canary` | ☐ |
| 4 | Watch canary metrics 24 h | `MetricsBot` | `@sre_alerts` | ☐ |
| 5 | Flip flag → 100 % prod | `@alice.smith` | `@release_command` | ☐ |
| 6 | Verify 14-day error-free window | `MetricsBot` | `@sre_alerts` | ☐ |
| 7 | Adoption ≥ 60 % (API calls) | `AnalyticsBot` | `@product_metrics` | ☐ |
| 8 | Publish external changelog | `@franktaylor` | `@alchemist_users` | ☐ |
| 9 | Schedule retro (2025-12-11) | `@diana.prince` | `@quality_gate` | ☐ |
| 10 | Run retro & file actions | facilitator | `@retro_notes` | ☐ |
| 11 | Add `console.warn` deprecation | `@alice.smith` | `@dev_warnings` | ☐ |
| 12 | Council `/lgtm retired` | `@brendadeeznuts1111` | `@AlchemistsCouncil` | ☐ |
| 13 | Bot tags `rfc-complete`, archives repo, closes epic | `RFC_Bot` | `@release_command` | ☐ |

**Pin the final "✅ retired" message in `@AlchemistsCouncil`—done!**

---

## 📡 **Telegram Layout Cheat-Sheet**  
### *(ALC-RFC-2025-10-ZERO-FRICTION)*

| Tier | Telegram Entity | Who's Inside | Max Members | Bot API | Use For |
|---|---|---|---|---|---|
| **Council** | **Super-Group** `@AlchemistsCouncil` | leads + council only | 200 k | ✔ | approvals, pinned phone-card |
| **Broadcast** | **Channel** `@alchemist_releases` | read-only feed | ∞ | ✔ | public changelog, metrics |
| **Ops** | **Group** `@infra_team` | engineers on-call | 200 k | ✔ | deploy logs, quick triage |
| **Bot-only** | **Channel** `@ci_status` | bots only | ∞ | ✔ | CI pass/fail, no noise |

**Rule of Thumb**  
Post **decisions** → Super-Group  
Post **logs** → Group  
Post **broadcasts** → Channel  
Let **bots** own the noisy stuff.

Pick one, paste the ID in the checklist, and the RFC automation will target the correct entity.

---

## 🤖 **Telegram Bot Setup for RFC Automation**  
### *(ALC-RFC-2025-10-ZERO-FRICTION)*

### 📝 **Bot Created**: `@alchemist_rfc_bot` (t.me/alchemist_rfc_bot)
### 🔑 **API Token**: `8333499645:AAEsGOqYc_3oVQoSpQESjcpDrQ0xj_PYpeE` *(Store securely in CI secrets)*

--------------------------------------------------------
### 🤖 1. WHAT YOU CREATE (once per org)
--------------------------------------------------------
| Thing | Telegram UI path | Purpose | BotFather keywords |
|---|---|---|---|
| **A. Bot** | BotFather → `/newbot` → `@alchemist_rfc_bot` | Send messages & pins | `/setjoingroup`, `/setcommands` |
| **B. Super-Group** | New Group → "Alchemists Council" → convert to super-group | Approvals & pinned phone-card | `/setadmin` to bot |
| **C. Channel** | New Channel → `@alchemist_releases` | Broadcast-only changelog | Add bot as **admin** w/ "Post Messages" |
| **D. Group** | New Group → `@infra_team` | Ops noise (logs, alerts) | Add bot as admin |
| **E. Bot-Only Channel** | New Channel → `@ci_status` → set "Only Admins can post" | CI pass/fail spam | Add only the bot |

--------------------------------------------------------
### 🔑 2. TOKENS & RIGHTS YOU NEED
--------------------------------------------------------
1. **HTTP-API token** (from BotFather) – store in env `TELEGRAM_BOT_TOKEN`
2. **Chat-ID list** – run once:
   ```bash
   curl https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates
   ```
   → grab `message.chat.id` for each entity (channels look like `-100xxxxxxxxxx`)
3. **Pin permission** – in **each** super-group, give bot "Pin Messages" right
4. **Command scope** – optional but nice:
   ```
   /setcommands @alchemist_rfc_bot
   revert - revert last deploy
   lgtm - council approval
   ```

--------------------------------------------------------
### 🧩 3. MINIMAL CI/CD INTEGRATION
--------------------------------------------------------
Add a **single reusable bash function** (or GitHub Action / GitLab job) that every repo calls:

```bash
#!/usr/bin/env bash
# notify-telegram.sh
set -eu
PHASE=$1        # day1 / day2 / retired
STATUS=$2       # start / success / failure
MSG=$3
TOKEN=${TELEGRAM_BOT_TOKEN}
CHAT=${TELEGRAM_CHAT_ID}   # passed from caller

curl -X POST \
  https://api.telegram.org/bot${TOKEN}/sendMessage \
  -d chat_id="${CHAT}" \
  -d text="${MSG}" \
  -d parse_mode=Markdown \
  -d disable_web_page_preview=true
```

**Call sites (example)**
```yaml
# GitHub Actions
- name: notify staging canary
  if: always()
  run: |
    ./notify-telegram.sh day2 ${{ job.status }} \
      "🟡 Canary 10 % → ${{ job.status }}
      Dashboard: https://alchemy.run/metrics/rfc-2025-10"
  env:
    TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    TELEGRAM_CHAT_ID: ${{ vars.TG_STAGING_CANARY }}   # -100xxxx
```

--------------------------------------------------------
### 📌 4. OPTIONAL BUT NICE
--------------------------------------------------------
* **Pin message** – add `&message_id=xxx` + call `/pinChatMessage`
* **Threaded replies** – use `reply_to_message_id` for long logs
* **Silence users** – set group to "Only Admins" if noise grows
* **Topic groups** – use "Forum" so each RFC gets its own topic

--------------------------------------------------------
### ✅ 5. DONE CRITERIA
--------------------------------------------------------
- [ ] Bot created, token stored in CI secret vault
- [ ] Chat-IDs exported as CI variables (`TG_COUNCIL`, `TG_RELEASES`, …)
- [ ] Bot is admin in every target entity with **Post + Pin** rights
- [ ] `notify-telegram.sh` committed to `alchemist/actions` repo
- [ ] One successful dry-run (post + pin) from CI to each room

**Once the checklist is green, the RFC automation can post, pin, and retire without human intervention—true zero-friction.**

---

### 18.6 Enterprise Telegram Automation (Enhanced Delta-RFC)

#### 1. Goal
Turn the basic "curl notify" into a **zero-maintenance, self-reporting, interactive** workflow that:
- keeps one **rich pinned card** per RFC
- creates **forum topics** automatically
- accepts **inline approvals** (`/lgtm` or button)
- posts **graphs & logs** without spam

#### 2. New Artefacts to Create (once per org)
| Entity | Telegram UI | Purpose | Rights needed |
|---|---|---|---|
| `@alchemist_core_bot` | BotFather → `/newbot` | Orchestration & commands | Pin, Delete, Manage Topics |
| `@alchemist_releases` | Channel | Public broadcast | Post only |
| `@alchemist_ci_status` | Channel | High-volume CI logs | Post only |
| `@alchemist_infra_team` | Super-Group (Forum) | Ops alerts | Pin + Topics |
| `@alchemist_council` | Super-Group (Forum) | Council votes | Pin + Topics |

#### 3. Secrets to Inject into CI
```bash
TELEGRAM_BOT_TOKEN          # from BotFather
TG_COUNCIL_CHAT_ID          # -100xxxxxxxx
TG_RELEASES_CHANNEL_ID      # -100yyyyyyyy
TG_INFRA_GROUP_ID           # -100zzzzzzzz
TG_CI_STATUS_ID             # -100aaaaaaaa
```

#### 4. Re-usable GitHub Action
```yaml
# alchemist/telegram-notifier@v3
name: 'Telegram Notifier'
inputs:
  action: { required: true, description: 'send_message | pin_card | approve_rfc | retire_rfc' }
  chat_id:  { required: true }
  rfc_id:   { required: false }
  title:    { required: false }
  description: { required: false }
  url:      { required: false }
  status:   { required: false, default: 'info' }
  token:    { required: true }
runs:
  using: 'node20'
  main: 'dist/index.js'
```
*(Code already bundled; publish to `alchemist/actions` repo.)*

#### 5. Minimal Call-Site (no bash)
```yaml
- uses: alchemist/telegram-notifier@v3
  with:
    action: pin_card
    chat_id: ${{ vars.TG_COUNCIL_CHAT_ID }}
    rfc_id: ALC-RFC-2025-10-ZERO-FRICTION
    title: "🚀 Ready for Council Vote"
    description: "Please review and hit **Approve** or type `/lgtm`"
    url: https://alchemy.run/rfcs/2025-10
    token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
```

#### 6. Security Hardening
- Token stored only in **GitHub Secrets** (never log echo)
- Bot rights = **least privilege** (no "add users", no "delete group")
- Action output **masked** in runner logs
- Optional **IP allow-list** in BotFather → only GitHub runners

#### 7. Rich UX Add-Ons
| Feature | API Method | When Used |
|---|---|---|
| **Forum Topic** | `createForumTopic` | on RFC `status/ready-for-review` |
| **Inline Keyboard** | `InlineKeyboardMarkup` | Approve / Metrics / Revert buttons |
| **MarkdownV2** | `parse_mode=MarkdownV2` | bold, italics, links |
| **Photo** | `sendPhoto` | Grafana snapshot on failure |
| **Thread** | `reply_to_message_id` | long CI logs under parent |

#### 8. Context-Aware Commands (Bot Code Snippet)
```javascript
// /lgtm or button press → moves RFC to status/approved
if (msg.text === '/lgtm' && chatId === COUNCIL_ID) {
  await approveRFC(rfcId, user);
  await updatePinCard(chatId, rfcId, "✅ Council Approved");
}
```

#### 9. Enhanced Done Criteria
- [ ] Bot created & token in GitHub Secrets
- [ ] All Chat-IDs exported as **vars** (not secrets)
- [ ] `alchemist/telegram-notifier@v3` published to marketplace
- [ ] One **dry-run** (pin + button + approve) succeeds
- [ ] Forum topic auto-created for this RFC
- [ ] No secret or Chat-ID leaks in CI logs

#### 10. Roll-Forward / Roll-Back
- **Roll-Forward**: merge the action, tag `v3`, update call-sites
- **Roll-Back**: revert to `alchemist/telegram-notifier@v2` (bash curl) in ≤ 5 min

**Once §18.6 is merged, the RFC phone-card becomes interactive, council approvals happen in-chat, and every metric snapshot lands threaded under the same pinned message—zero friction achieved.**

---

## 📡 **Enterprise Telegram Stack – Next Actions**

| Who | What | Where | When |
|---|---|---|---|
| `@alice.smith` | Create `@alchemist_core_bot` & grab token | BotFather | **Today** |
| `@alice.smith` | Convert Council group → **Forum** | Group Settings | **Today** |
| `@diana.prince` | Publish `alchemist/telegram-notifier@v3` | GitHub Marketplace | **This sprint** |
| `@brendadeeznuts1111` | Add secrets (`TELEGRAM_BOT_TOKEN`, `TG_*_ID`) | GitHub Org | **This sprint** |
| **All** | First dry-run on **this RFC** | `#infra_team` | **Before prod** |

**Roll-forward**: merge action → tag `v3` → update call-sites  
**Roll-back**: revert to `v2` bash curl (≤ 5 min)

*Pin this → archive once dry-run succeeds.*

---

**Remember: The Definition of Done is a living document. It should evolve as our project grows and our standards improve. All team members are encouraged to suggest improvements and participate in its ongoing development.** 🚀

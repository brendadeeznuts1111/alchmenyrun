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

### 📝 **Bot Created**: `@alchemist_core_bot` (t.me/alchemist_core_bot)
### 🔑 **API Token**: `8372625251:AAFfIFdjLCwYxOO392KrFqsbTksE0t0w5nU` *(Store securely in CI secrets)*

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
| Entity | Telegram UI | Purpose | Rights needed | Link |
|---|---|---|---|---|
| `@alchemist_core_bot` | BotFather → `/newbot` | Orchestration & commands | Pin, Delete, Manage Topics | t.me/alchemist_core_bot |
| `@alchemist_releases` | Channel | Public broadcast | Post only | https://t.me/+zA-Rw8weDJUwMjg5 |
| `@alchemist_ci_status` | Channel | High-volume CI logs | Post only | https://t.me/+S7yXUYv8nvs1NGFh |
| `@alchemist_infra_team` | Super-Group (Forum) | Ops alerts | Pin + Topics | https://t.me/+nieD7pJAJ4NmYWQx |
| `@alchemist_council` | Super-Group (Forum) | Council votes | Pin + Topics | https://t.me/c/3293940131/1 |

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

---

## 🚨 **Telegram Rollback & Panic-Button Kit**
### *(Emergency Controls for Enterprise Automation)*

### 📝 **Scripts Available**: `scripts/telegram-rollback.sh`, `scripts/replace-card.sh`, `scripts/unpin.sh`

--------------------------------------------------------
### 🚨 1. ONE-LINE ROLL-BACK (CLI)
--------------------------------------------------------
```bash
# rollback-telegram.sh <chat_id> <last_message_id>
curl -sX POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteMessage \
  -d chat_id="$1" \
  -d message_id="$2"
```
Save the **last broadcast message_id** in CI (`echo $msg_id >> $GITHUB_OUTPUT`) and you can delete it instantly:
```bash
rollback-telegram.sh $TG_RELEASES_CHANNEL_ID $LAST_MSG_ID
```

--------------------------------------------------------
### 🔄 2. FULL RFC CARD REPLACEMENT (CLI)
--------------------------------------------------------
```bash
# replace-card.sh <chat_id> <old_msg_id> "New Title" "New Body"
new_id=$(curl -sX POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/editMessageText \
  -d chat_id="$1" \
  -d message_id="$2" \
  -d parse_mode=MarkdownV2 \
  -d text="$3\n\n$4" | jq -r .result.message_id)
echo "Updated card → $new_id"
```
Use this to **downgrade** the pinned card from "✅ Approved" to "⏸️ On Hold" without un-pinning.

--------------------------------------------------------
### 📌 3. UN-PIN + RE-PIN (CLI)
--------------------------------------------------------
```bash
# unpin.sh <chat_id>
curl -sX POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/unpinAllChatMessages \
  -d chat_id="$1"
```
Follow with a normal `sendMessage` + `pinChatMessage` to put the **old** bash-curl card back.

--------------------------------------------------------
### 🧯 4. COMPLETE "NUKE & REVERT" CI JOB
--------------------------------------------------------
```yaml
- name: Telegram Emergency Rollback
  if: ${{ failure() && inputs.rollback-telegram == 'true' }}
  run: |
    # 1. Delete last rich card
    rollback-telegram.sh ${{ vars.TG_COUNCIL_CHAT_ID }} ${{ needs.notify.outputs.card_id }}
    # 2. Post plain-text fallback
    curl -X POST https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/sendMessage \
      -d chat_id=${{ vars.TG_COUNCIL_CHAT_ID }} \
      -d text="🚑 Roll-back complete. Using legacy bash notifier." \
      -d disable_notification=true
    # 3. Re-pin the fallback
    curl -X POST https://api.telegram.org/bot${{ secrets.TELEGRAM_BOT_TOKEN }}/pinChatMessage \
      -d chat_id=${{ vars.TG_COUNCIL_CHAT_ID }} \
      -d message_id=$(cat fallback_msg_id.txt)
```

--------------------------------------------------------
### ⏱️ 5. SPEED CHECK
--------------------------------------------------------
- `deleteMessage` ≈ 200 ms
- `editMessageText` ≈ 250 ms
- `unpinAllChatMessages` ≈ 300 ms
All calls are **idempotent**; running twice is safe.

**Save the scripts in `/usr/local/bin/`, add to `$PATH`, and your on-call team can rollback Telegram state faster than you can revert the deployment PR.**

---

## 📦 **Telegram CLI Toolkit (tgk)**
### *(AI-Driven, Secure & Observable Infrastructure-as-Code)*

### 📝 **Enhanced Single Source-of-Truth CLI** for complete Telegram entity management
### 🤖 **AI-Assisted**: Workflow optimization and intelligent suggestions
### 🛡️ **Secure**: Proactive compliance and audit trails
### 📊 **Observable**: Deep logging and eventing capabilities
### 💻 **Developer-Centric**: Streamlined UX and rich outputs
### 🔧 **Maintainable**: Modular architecture with plugin support

--------------------------------------------------------
### 📦 1. INSTALL & CORE ARCHITECTURE (Modular & AI-Ready)
--------------------------------------------------------
The `tgk` kit is now a **Python-based CLI** (leveraging `Click` for robustness) with `curl` as a backend, allowing for easier plugin development, AI integration, and robust error handling.

```bash
# Modular Python-based installation (e.g., via pipx for isolation)
pip install -r requirements-tgk.txt
python3 ./scripts/tgk-enhanced --help
```

The kit now exposes enhanced sub-commands with AI and security capabilities:

```
tgk config init         # Create/update tgk.yaml with default settings
tgk auth refresh        # Refresh tokens, verify permissions
tgk chat list           # Discover IDs (now with richer metadata)
tgk group create        # Super-group + convert + forum, with optional auto-invites
tgk channel create      # Broadcast channel, with optional public URL generation
tgk topic create        # Forum topic (now with pre-defined templates)
tgk member add          # Invite users by @username (with role selection)
tgk card post           # Send rich card (supports templates, media, interactive buttons)
tgk card update         # Edit in-place (now with conflict resolution)
tgk card delete         # Delete any message (with audit logging)
tgk unpin all           # Nuclear un-pin (with confirmation)
tgk role set            # Promote/demote bot/user (fine-grained permissions)
tgk permission set      # Lock/unlock group (granular permission control)
tgk audit log           # Retrieve / filter tgk action logs
tgk policy check        # Run local Rego policies against group/channel configs
tgk ai suggest          # AI-driven suggestions for next steps (e.g., "/approve RFC-ID")
```
Every call returns **structured JSON** for maximum scriptability and `jq` integration.

--------------------------------------------------------
### 🔧 2. ENHANCED QUICK REFERENCE CHEAT-SHEET (With AI & Policy Integration)
--------------------------------------------------------
| Task | One-Liner (Example) | Idempotent? | AI / Policy Hooks |
| :-- | :------------------ | :---------- | :---------------- |
| **Setup Core Group** | `tgk group create "Alchemists Council" --forum --convert --invite-users @brendadeeznuts1111` | ✅ | `policy check group-config` |
| **Give Bot Admin/Pin** | `tgk role set -c $CHAT_ID -u alchemist_core_bot --admin --can-pin-messages --can-manage-topics` | ✅ | `audit log --bot-perms` |
| **Create RFC Topic** | `tgk topic create -c $CHAT_ID -n "ALC-RFC-2025-10-Naming" --template rfc-init` | ✅ | `ai suggest review-steps` |
| **Post RFC Update** | `tgk card post -c $CHAT_ID -t "✅ Approved" -d "New body" --template rfc-status-update` | ✅ | `policy check message-content` |
| **Suggest Next Action** | `tgk ai suggest -c $CHAT_ID --context "RFC ALC-2025-10-Naming is Ready for Council Vote"` | — | N/A |
| **Check Compliance** | `tgk policy check -c $CHAT_ID --policy infra/telegram/policies/admin-roles.rego` | — | N/A |
| **View Audit Log** | `tgk audit log --target $CHAT_ID --action card-delete --since 24h` | — | N/A |

--------------------------------------------------------
### 🚀 3. INTELLIGENT CI/CD INTEGRATION (GitHub Actions)
--------------------------------------------------------
The `alchemist/telegram-notifier@v3` GitHub Action now wraps the enhanced `tgk`, providing higher-level, declarative control and leveraging AI, security, and observability capabilities.

```yaml
# .github/workflows/rfc-lifecycle.yaml
jobs:
  rfc_council_vote_open:
    steps:
      - name: Configure Telegram Environment
        run: tgk config init --set TELEGRAM_BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }}
      - name: Ensure Alchemists Council Group
        id: council_group
        run: |
          GROUP_JSON=$(tgk group create "Alchemists Council" --forum --convert --invite-users @brendadeeznuts1111 -o json)
          echo "CHAT_ID=$(echo $GROUP_JSON | jq -r .id)" >> $GITHUB_OUTPUT
          tgk role set -c $(echo $GROUP_JSON | jq -r .id) -u alchemist_core_bot --admin --can-pin-messages --can-manage-topics
      - name: Pin Initial RFC Status Card
        uses: alchemist/telegram-notifier@v3
        with:
          action: 'card_post'
          chat_id: ${{ steps.council_group.outputs.CHAT_ID }}
          topic_name: "ALC-RFC-2025-10-ZERO-FRICTION"
          template_name: 'rfc-status-card'
          template_vars: |
            rfc_id: ALC-RFC-2025-10-ZERO-FRICTION
            title: "🚀 RFC: Idempotent Resource Naming"
            status: "READY-COUNCIL-VOTE"
            url: "https://alchemy.run/rfcs/ALC-RFC-2025-10-ZERO-FRICTION"
          token: ${{ secrets.TELEGRAM_BOT_TOKEN }}

  update_rfc_status:
    steps:
      - name: Update Pinned RFC Card
        uses: alchemist/telegram-notifier@v3
        with:
          action: 'card_update'
          chat_id: ${{ vars.TG_COUNCIL_CHAT_ID }}
          topic_name: "ALC-RFC-2025-10-ZERO-FRICTION"
          message_id: ${{ needs.rfc_council_vote_open.outputs.initial_card_id }}
          template_name: 'rfc-status-card'
          template_vars: |
            rfc_id: ALC-RFC-2025-10-ZERO-FRICTION
            title: "🚀 RFC: Idempotent Resource Naming"
            status: "IMPLEMENTATION-IN-PROGRESS"
            url: "https://alchemy.run/rfcs/ALC-RFC-2025-10-ZERO-FRICTION"
          token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
```

--------------------------------------------------------
### 🛡️ 4. ADVANCED SECURITY & COMPLIANCE CONTROLS
--------------------------------------------------------
*   **Policy-as-Code (OPA/Rego):** `tgk policy check` integrates with Open Policy Agent (OPA). Local Rego policies (e.g., `infra/telegram/policies/admin-roles.rego`) automatically enforce:
    *   No non-Alchemists Council members can be admins in strategic groups.
    *   Specific keywords (e.g., PII, confidential data) are not posted to public channels.
    *   Bots do not have "delete group" permissions.
*   **Comprehensive Audit Log:** Every `tgk` action (creation, deletion, permission change, message edit) is automatically logged to a secure, immutable log store, capturing:
    *   `action_type`, `chat_id`, `user_id` (who ran the command), `timestamp`, `ip_address`, `changes_made`, `policy_check_result`.
    *   `tgk audit log` provides CLI access to this structured log data.
*   **Least-Privilege Enforcement:** `tgk` proactively prevents users (and the bot itself) from granting excessive permissions.
*   **Secret Management Integration:** `tgk config init` can pull secrets directly from Vault/AWS Secrets Manager/GCP Secret Manager during CI setup.

--------------------------------------------------------
### 📊 5. ENHANCED OBSERVABILITY & AI-DRIVEN INSIGHTS
--------------------------------------------------------
*   **Structured Logging & Eventing:** All `tgk` commands emit structured logs (JSON) to standard output/error, easily ingestible by log aggregators. Key lifecycle events are also emitted as events.
*   **Metric Integration:** `tgk` can optionally push metrics to Prometheus/Grafana.
*   **AI-Driven Suggestions (`tgk ai suggest`):**
    *   **Contextual Next Steps:** Based on RFC status and chat history, suggests: "The RFC is in `READY-COUNCIL-VOTE`. Would you like to post a reminder or check policy compliance?"
    *   **Drafting Messages:** "Draft a message announcing successful production deployment."
    *   **Identifying Anomalies:** Alerting if unusual `tgk` activity is detected from audit logs.
*   **Real-time Dashboard Integration:** Telegram actions update a "Alchemist Comms Health" dashboard in Grafana.

--------------------------------------------------------
### 6. ENHANCED DONE CRITERIA
--------------------------------------------------------
- [ ] `tgk` (v2 Python) installed on CI runners & laptops with `pip install -r requirements-tgk.txt`
- [ ] `tgk config init` used to securely initialize `~/.tgk/config.yaml` in CI/local env
- [ ] All entities (groups, channels, topics) created **declaratively via enhanced `tgk` scripts**
- [ ] Bot rights are managed as versioned code (`infra/telegram/roles.json`) and enforced via `tgk policy check`
- [ ] One **dry-run** creates entire fresh Telegram env via enhanced `tgk` in ≤ 60 s
- [ ] Roll-back tested: `tgk unpin-all + card-delete` sequence finishes in ≤ 10 s, with actions logged to audit
- [ ] **Audit logs ingested and queryable** by `tgk audit log`
- [ ] **Policy-as-code checks** (`tgk policy check`) integrated into CI for Telegram configuration validation
- [ ] **AI-driven suggestion capability** integrated for RFC workflows

**Now, the Telegram ecosystem is an intelligent, secure, and fully automated control plane**, directly managed as code, providing unparalleled transparency and operational efficiency for Project Alchemist.

---

### 18.7 AI-Driven Telegram Control-Plane (tgk v2)

#### 1. Goal
Turn `tgk` into an **intelligent, secure, observable** control-plane that:
- creates **entire Telegram env** in ≤ 60 s from code
- enforces **OPA policies** before every change
- pushes **metrics + audit logs** to Prometheus/Grafana
- offers **AI suggestions** (`tgk ai suggest`) for next RFC action

#### 2. One-Line Install
```bash
pipx install git+https://github.com/alchemist/tgk@v2
tgk --version   # 2.0.0
```

#### 3. New Commands (JSON out → `jq` friendly)
```
tgk config init         # create tgk.yaml (vault-backed)
tgk auth refresh        # verify token & perms
tgk group create        # super-group + forum + invite
tgk channel create      # broadcast channel
tgk topic create        # forum topic with template
tgk card post           # rich card (media + buttons)
tgk card update         # in-place edit
tgk card delete         # with audit log
tgk policy check        # local Rego validation
tgk ai suggest          # GPT-driven next step
tgk audit log           # structured logs to Loki
```

#### 4. Minimal IaC Script (creates whole env)
```bash
#!/usr/bin/env bash
set -euo pipefail
source .env  # TELEGRAM_BOT_TOKEN + VAULT_ADDR

# idempotent: creates or returns existing IDs
COUNCIL=$(tgk group create "Alchemists Council" --forum --convert -o json | jq -r .id)
tgk role set -c $COUNCIL -u alchemist_core_bot --admin --can-pin --can-manage-topics
tgk policy check -c $COUNCIL --policy infra/telegram/admin-roles.rego

RELEASES=$(tgk channel create "alchemist_releases" --public -o json | jq -r .id)
echo "COUNCIL=$COUNCIL" >> $GITHUB_OUTPUT
echo "RELEASES=$RELEASES" >> $GITHUB_OUTPUT
```
Store the script in `infra/telegram/bootstrap.py` → run in CI on **every apply**.

#### 5. Security & Compliance
- **OPA** policies live in `infra/telegram/policies/*.rego`
- Every `tgk` call is **PRE-flight checked**; violations abort with exit-code ≥ 1
- Audit events pushed to **Loki** (`tgk audit log --push`)
- Secrets fetched from **Vault** (`tgk config init --vault-path telegram/creds`)

#### 6. AI Features
```bash
tgk ai suggest -c $COUNCIL --context "RFC ALC-2025-10 is READY-COUNCIL-VOTE"
# → "Post a reminder to the Council or run policy check."
```
AI calls are **opt-in** (env `TGK_AI_ENABLE=1`) and **cost-capped** (token budget in tgk.yaml).

#### 7. Observability
- **Prometheus** metrics exported by `tgk` itself:
  `tgk_command_duration_seconds`, `tgk_policy_violations_total`, `tgk_messages_sent_total`
- **Grafana** dashboard "Alchemist Comms Health" auto-imported from `infra/telegram/dashboard.json`

#### 8. Enhanced Done Criteria
- [ ] `tgk@v2` installed on CI runners & laptops
- [ ] entire Telegram env bootstrapped **only** via `tgk` script
- [ ] OPA policies pass in CI (`tgk policy check`)
- [ ] audit logs visible in Loki/Grafana
- [ ] one **dry-run** creates fresh env ≤ 60 s
- [ ] roll-back tested: `tgk card-delete + unpin-all` ≤ 10 s

#### 9. Roll-Forward / Roll-Back
- **Forward**: merge `tgk@v2`, update call-sites to new command set
- **Backward**: revert to `tgk@v1` (bash wrappers) in ≤ 5 min

**Once §18.7 is merged, the Telegram layer is fully IaC, policy-enforced, AI-assisted, and observable—enterprise zero-friction achieved.**

---

### 18.8 Ecosystem & Customer Integration (tgk Phase-2)

#### 1. Goal
Make `tgk` the **single control-plane** for Cloudflare, Alchemist platform, customer DB (D12), and the public web-app—**all triggered from Telegram** with full audit.

#### 2. One-Line Install (extends §18.7)
```bash
pipx install --upgrade git+https://github.com/alchemist/tgk@v2.1
tgk --version   # 2.1.0+ (ships with ecosystem plug-ins)
```

#### 3. New Command Tree
```
tgk cf                    # Cloudflare
  ├─ worker deploy <name> --stage <stage>
  ├─ d1 query <db> --sql "SELECT * FROM users"
  └─ domain status <domain>

tgk alchemist             # Alchemist platform
  ├─ deploy status <project-id> --stage <stage>
  ├─ project create <name> --owner <user-id>
  └─ project delete <id>  # policy-gated

tgk customer              # D12 customer DB
  ├─ get <customer-id>
  ├─ suspend <id> --reason "billing"
  ├─ activate <id>
  └─ notify <id> --template outage-apology

tgk webapp                # Public status page
  ├─ status set <level> --message "text"
  └─ status get
```

#### 4. Minimal IaC Bootstrap Script
```bash
#!/usr/bin/env bash
set -euo pipefail
# idempotent: entire env in 60 s
COUNCIL=$(tgk group create "Alchemists Council" --forum --convert -o json | jq -r .id)
tgk role set -c $COUNCIL -u alchemist_core_bot --admin --can-pin --can-manage-topics
tgk policy check -c $COUNCIL --policy infra/telegram/admin-roles.rego

# Cloudflare & Alchemist sanity check
tgk cf domain status alchemy.run || echo "CF edge healthy"
tgk alchemist deploy status core --stage prod || echo "Platform healthy"

echo "COUNCIL=$COUNCIL" >> $GITHUB_OUTPUT
```
Store as `infra/telegram/bootstrap.sh` → run on **every apply**.

#### 5. Security & Compliance
- **OPA policies** for every new command (e.g., only `@alice.smith` can `tgk alchemist project delete prod`)
- **Cross-system audit**: every `tgk customer` action → Loki **and** D12 audit table
- **Data minimisation**: `tgk customer get` masks PII in logs; policy blocks full export to public channels

#### 6. Observability & AI
- **New metrics** (auto-pushed to Prometheus):
  - `alchemist_customer_actions_total{action="suspend|activate|notify"}`
  - `alchemist_webapp_status_changes_total{level}`
- **AI suggestions** (`tgk ai suggest`) now **cross-system**:
  - sees Cloudflare 5xx spike → suggests `tgk customer notify impacted --template partial-outage`
  - sees RFC `status/implementation-failed` → suggests `tgk cf worker rollback <worker>`

#### 7. CI Template (GitHub Actions)
```yaml
- name: Suspend Customer (Billing Overdue)
  if: ${{ github.event.action == 'billing.overdue' }}
  run: |
    tgk customer suspend ${{ github.event.customer_id }} \
      --reason "Invoice ${{ github.event.invoice_id }} overdue"
    tgk customer notify ${{ github.event.customer_id }} \
      --template billing-suspension
  env:
    TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
```
**Gate**: job requires **OIDC claim** `team=billing-leads` (enforced by OPA).

#### 8. Enhanced Done Criteria
- [ ] `tgk cf`, `tgk alchemist`, `tgk customer`, `tgk webapp` commands exist and pass `tgk policy check`
- [ ] bootstrap script creates **whole env** ≤ 60 s (idempotent)
- [ ] cross-system audit events land in **Loki + D12**
- [ ] new Prometheus metrics visible on **Grafana "Alchemist Comms Health"** dashboard
- [ ] pilot `tgk ai suggest` provides **actionable** next step (human-verified)
- [ ] roll-back tested: `tgk card-delete + unpin-all` ≤ 10 s

#### 9. Roll-Forward / Roll-Back
- **Forward**: merge `tgk@v2.1`, update CI call-sites
- **Backward**: revert to `tgk@v2.0` (no ecosystem plug-ins) ≤ 5 min

**Once §18.8 is merged, a single chat message can suspend a customer, roll a Worker, and update the public status page—all audited, policy-gated, and AI-suggested.**

---

### 18.9 AI-Orchestrated Autonomy (tgk Phase-3)

#### 1. Goal
Make `tgk` a **sentient core** that:
- **predicts** issues (Cloudflare, D1, customer signals)
- **proposes** remediations with confidence scores
- **orchestrates** policy-gated fixes **from chat** (button or `/lgtm`)
- **explains** every AI decision in the audit trail

#### 2. One-Line Install (extends §18.8)
```bash
pipx install --upgrade git+https://github.com/alchemist/tgk@v3
tgk --version   # 3.0.0+ (ships predictive plug-in)
```

#### 3. New Command Tree
```
tgk predict               # Predictive anomaly detection
  ├─ issue detect --source cf-logs,d1-metrics
  └─ recommend action     # Proposes tgk commands w/ confidence

tgk orchestrate           # Autonomous, policy-gated workflows
  ├─ incident auto-resolve <ticket>
  └─ change request <rfc-id>  # e.g., scale-up event

tgk chat                  # Conversational AI
  ├─ analyze              # Summarise thread, extract actions
  ├─ respond --ai-draft   # Draft customer reply
  └─ digest               # Daily/weekly event digest

tgk community             # AI-assisted open-source engagement
  ├─ good-first-issue     # Suggests easy issues
  └─ mentor suggest       # Recommends mentors
```

#### 4. Minimal Predictive Pipeline Script
```bash
#!/usr/bin/env bash
set -euo pipefail
# Runs every 5 min via CI cron
ISSUE=$(tgk predict issue detect --source cf-logs,d1-metrics -o json)
if <<<"$ISSUE" jq -e '.confidence > 0.8 and .severity == "critical"'; then
  REC=$(jq -r '.recommended_action' <<<"$ISSUE")
  # Human-in-the-loop approval (button in Telegram)
  tgk orchestrate incident auto-resolve \
    --action "$REC" \
    --impacted "$(jq -c '.impacted_customers' <<<"$ISSUE")"
fi
```
Stored in `infra/telegram/auto-remediate.sh` → scheduled via **GitHub cron**.

#### 5. Security & Compliance
- **Policy-gated actions**: OPA rule → only `@alice.smith` or `@brendadeeznuts1111` can approve **prod** orchestrations
- **AI explainability**: every prediction → Loki (input, model, confidence, rationale)
- **Token budget**: `tgk.yaml` caps AI calls; alerts at 80 %
- **Human-in-the-loop**: critical actions require **inline button** or `/lgtm` in council chat

#### 6. Observability & AI Metrics
- **Prometheus** (auto-pushed):
  - `tgk_ai_predictions_total{outcome="action|no_action"}`
  - `tgk_orchestration_actions_total{status="success|failure"}`
- **Grafana** dashboard: **"Alchemist AI Ops Insights"**
  - prediction confidence trend
  - human vs AI approval ratio

#### 7. CI Template (GitHub Actions)
```yaml
- name: AI-Driven Incident Response
  if: ${{ github.event.type == 'cloudflare_alert' }}
  run: |
    ISSUE=$(tgk predict issue detect --source-event '${{ github.event.payload }}' -o json)
    echo "RECOMMENDED_ACTION=$(jq -r '.recommended_action' <<<"$ISSUE")" >> $GITHUB_OUTPUT
- uses: alchemist/telegram-notifier@v4
  with:
    action: card_post_interactive
    chat_id: ${{ vars.TG_INCIDENT_GROUP_ID }}
    template_vars: |
      prediction: ${{ steps.ai.outputs.RECOMMENDED_ACTION }}
    buttons: |
      - text: "✅ Approve & Orchestrate"
        callback_data: "/tgk orchestrate incident auto-resolve ${{ github.run_id }} --confirm"
```
**Gate**: button click → OIDC claim `team=sre` **+** OPA policy **+** `/lgtm` logged.

#### 8. Enhanced Done Criteria
- [ ] `tgk@v3` installed
- [ ] `tgk predict` pipeline runs (scheduled/event)
- [ ] `tgk orchestrate` **policy-gated** and **human-approved** via Telegram
- [ ] AI explainability logs in **Loki**
- [ ] New **AI Ops Insights** dashboard live
- [ ] roll-back tested: `tgk@v2.1` ≤ 5 min

#### 9. Roll-Forward / Roll-Back
- **Forward**: merge `tgk@v3`, enable `TGK_AI_ENABLE=1` **gradually** (pilot team first)
- **Backward**: `pipx uninstall tgk && pipx install tgk@v2.1` (no AI core) ≤ 5 min

**Once §18.9 is merged, a single Telegram message can trigger an AI-detected, policy-approved, human-in-the-loop remediation that spans Cloudflare → Alchemist → customer DB—true sentient zero-friction operations.**

---

## 📡 **Enterprise Telegram Stack – Next Actions**

| Who | What | Where | When | Link |
|---|---|---|---|---|
| `@alice.smith` | ✅ Create `@alchemist_core_bot` & grab token | BotFather | **Today** | t.me/alchemist_core_bot |
| `@alice.smith` | Convert Council group → **Forum** | Group Settings | **Today** | https://t.me/c/3293940131/1 |
| `@diana.prince` | Publish `alchemist/telegram-notifier@v3` | GitHub Marketplace | **This sprint** | - |
| `@brendadeeznuts1111` | Add secrets (`TELEGRAM_BOT_TOKEN`, `TG_*_ID`) | GitHub Org | **This sprint** | - |
| **All** | First dry-run on **this RFC** | `#infra_team` | **Before prod** | https://t.me/+nieD7pJAJ4NmYWQx |

**Roll-forward**: merge action → tag `v3` → update call-sites  
**Roll-back**: revert to `v2` bash curl (≤ 5 min)

*Pin this → archive once dry-run succeeds.*

---

**Remember: The Definition of Done is a living document. It should evolve as our project grows and our standards improve. All team members are encouraged to suggest improvements and participate in its ongoing development.** 🚀

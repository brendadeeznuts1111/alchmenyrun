# 🔍 Scope System PR Review Requirements & Team Contacts

## 📋 Expected PR Review Requirements

Based on our CODEOWNERS configuration, the scope system PR should automatically request reviews from the following team members:

### 🎯 Primary Reviewers (Infrastructure Team)
| GitHub Handle | Role | Telegram Contact | Email | Required For |
|---------------|------|------------------|--------|--------------|
| `@alice.smith` | Infrastructure Lead | @alice_smith (ID: 987654321) | alice.smith@infra.cloudflare.com | All scope files |
| `@infra_dev2` | Senior Infra Dev | @infra_dev2 (ID: 444555666) | dev2@infra.cloudflare.com | `src/scope/*` files |

### 🔄 Secondary Reviewers (Scripts & Workflows)
| GitHub Handle | Role | Telegram Contact | Email | Required For |
|---------------|------|------------------|--------|--------------|
| `@infra_dev1` | Infra Dev | @infra_dev1 (ID: 111222333) | dev1@infra.cloudflare.com | Scripts & workflows |

### 📚 Cross-Functional Reviewers
| GitHub Handle | Team | Telegram Contact | Email | Required For |
|---------------|------|------------------|--------|--------------|
| `@frank.taylor` | Documentation Lead | @frank_taylor (ID: 333444555) | frank.taylor@docs.cloudflare.com | Deployment checklist |
| `@diana.prince` | Quality Lead | @diana_prince (ID: 999000111) | diana.prince@quality.cloudflare.com | GitHub workflows |

### 👑 Strategic Reviewers (CODEOWNERS Changes)
| GitHub Handle | Role | Telegram Contact | Email | Required For |
|---------------|------|------------------|--------|--------------|
| `@brendadeeznuts1111` | Leadership | @brendadeeznuts1111 (ID: 123456789) | brendadeeznuts1111@cloudflare.com | CODEOWNERS changes |

## 📞 Complete Team Contact Directory

### 🏗️ **Infrastructure Team (Alchemist Core Infra)**
**Team Lead:** Alice Smith
- **GitHub:** @alice.smith
- **Telegram:** @alice_smith (ID: 987654321)
- **Email:** alice.smith@infra.cloudflare.com
- **Domain:** infra.cloudflare.com

**Team Members:**
- **Dev1:** @infra_dev1 | @infra_dev1 (ID: 111222333) | dev1@infra.cloudflare.com
- **Dev2:** @infra_dev2 | @infra_dev2 (ID: 444555666) | dev2@infra.cloudflare.com

**Responsibilities:** Core infrastructure, CI/CD, deployments, scope system

### 🔌 **Resource Provider Team (Alchemist Integrations Hub)**
**Team Lead:** Charlie Brown
- **GitHub:** @charlie.brown
- **Telegram:** @charlie_brown (ID: 777888999)
- **Email:** charlie.brown@integrations.cloudflare.com
- **Domain:** integrations.cloudflare.com

**Team Members:**
- **Provider Dev:** @provider_dev1 | @provider_dev1 (ID: 000111222) | provider@integrations.cloudflare.com

**Responsibilities:** Cloud provider integrations, API clients

### 📖 **Documentation Team (Alchemist Knowledge Base)**
**Team Lead:** Frank Taylor
- **GitHub:** @frank.taylor
- **Telegram:** @frank_taylor (ID: 333444555)
- **Email:** frank.taylor@docs.cloudflare.com
- **Domain:** docs.cloudflare.com

**Team Members:**
- **Writer:** @doc_writer1 | @doc_writer1 (ID: 666777888) | writer@docs.cloudflare.com

**Responsibilities:** Documentation, examples, guides, READMEs

### 🧪 **Quality & Testing Team (Alchemist Quality Gate)**
**Team Lead:** Diana Prince
- **GitHub:** @diana.prince
- **Telegram:** @diana_prince (ID: 999000111)
- **Email:** diana.prince@quality.cloudflare.com
- **Domain:** quality.cloudflare.com

**Team Members:**
- **QA Analyst:** @qa_analyst1 | @qa_analyst1 (ID: 222333444) | qa@quality.cloudflare.com

**Responsibilities:** Testing, quality assurance, CI/CD validation

### 👑 **Leadership Team (Alchemist Core Council)**
**Executive Lead:** Brendan Dee
- **GitHub:** @brendadeeznuts1111
- **Telegram:** @brendadeeznuts1111 (ID: 123456789)
- **Email:** brendadeeznuts1111@cloudflare.com
- **Domain:** cloudflare.com (leadership)

**RFC Council Members:** All team leads above participate in strategic decisions

## 📊 PR Review Matrix for Scope System

### Files Changed → Required Reviewers

| File Pattern | Primary | Secondary | Cross-Functional | Strategic |
|-------------|---------|-----------|------------------|-----------|
| `src/scope/*` | @alice.smith, @infra_dev2 | - | - | - |
| `scripts/scope-*.ts` | @alice.smith, @infra_dev2 | - | - | - |
| `SCOPE_DEPLOYMENT_CHECKLIST.md` | @alice.smith, @infra_dev2 | - | @frank.taylor | - |
| `.github/workflows/scope-cleanup.yml` | @alice.smith | @infra_dev1 | @diana.prince | - |
| `.github/CODEOWNERS` | @brendadeeznuts1111 | - | @alice.smith, @charlie.brown, @diana.prince, @frank.taylor | - |

### 📈 Review Timeline Expectations

| Reviewer Type | Response Time | Approval Time |
|---------------|---------------|---------------|
| **Infrastructure Team** | < 4 hours | < 8 hours |
| **Cross-Functional Teams** | < 24 hours | < 48 hours |
| **Leadership** | < 12 hours | < 24 hours |

## 🚨 Escalation Contacts

### For Urgent Reviews
1. **Infrastructure Issues:** @alice.smith (Telegram: @alice_smith)
2. **System Down:** @brendadeeznuts1111 (Telegram: @brendadeeznuts1111)
3. **CI/CD Blockers:** @infra_dev1 (Telegram: @infra_dev1)

### Emergency Contacts
- **Primary:** brendadeeznuts1111@cloudflare.com
- **Infrastructure:** alice.smith@infra.cloudflare.com
- **Quality:** diana.prince@quality.cloudflare.com

## 📱 Telegram Channels & Groups

### Team Channels
- **#alchemy-infra** - Infrastructure team discussions
- **#alchemy-quality** - Quality and testing updates
- **#alchemy-docs** - Documentation coordination
- **#alchemy-leadership** - Strategic discussions

### Alert Channels
- **#alchemy-alerts** - System alerts and notifications
- **#alchemy-deployments** - Deployment status updates
- **#alchemy-reviews** - PR review coordination

## 📧 Email Domains & Routing

### Cloudflare Subdomains
- **infra.cloudflare.com** - Infrastructure team
- **integrations.cloudflare.com** - Provider integrations
- **docs.cloudflare.com** - Documentation team
- **quality.cloudflare.com** - Quality assurance
- **cloudflare.com** - Leadership and executives

### Email Routing Rules
- **Team leads** receive all notifications for their domain
- **Individual contributors** receive notifications for assigned files
- **Leadership** receives notifications for strategic changes
- **Cross-functional reviews** are routed based on CODEOWNERS patterns

## ✅ Validation Checklist

### Pre-PR Checks
- [ ] Run `bun run codeowners:validate` to verify reviewer assignments
- [ ] Test scope system: `bun run scope:comprehensive:test`
- [ ] Update this document if adding new team members

### Post-PR Actions
- [ ] Notify team leads via Telegram for urgent reviews
- [ ] Monitor review status in GitHub
- [ ] Escalate if reviews are delayed beyond expected timelines

---

## 📞 Quick Reference

**For immediate help with scope system PR:**
1. **Infrastructure:** @alice_smith (Telegram) or alice.smith@infra.cloudflare.com
2. **Documentation:** @frank_taylor (Telegram) or frank.taylor@docs.cloudflare.com
3. **Quality:** @diana_prince (Telegram) or diana.prince@quality.cloudflare.com
4. **Leadership:** @brendadeeznuts1111 (Telegram) or brendadeeznuts1111@cloudflare.com

**🎯 Expected reviewers for scope system PR:** @alice.smith, @infra_dev2, @infra_dev1, @frank.taylor, @diana.prince

*Last updated: October 27, 2025*

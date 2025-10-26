---
title: "{{ title }}"
authors: "{{ authors }}"
type: security
required_approvers: 2
max_review_days: 5
policy_pack_name: security-stream
prometheus_labels:
  - security
  - compliance
  - risk-assessment
---

# {{ title }}

**Authors**: {{ authors }}  
**Type**: Security RFC  
**Review Deadline**: {{ max_review_days }} days from submission  
**Required Approvers**: {{ required_approvers }} (1 security-lead + 1 SRE)

## Executive Summary

{{ executive_summary }}

## Threat Model

### Threat Landscape
- [ ] External threats (malicious actors, malware)
- [ ] Internal threats (insider risk, privilege escalation)
- [ ] Supply chain threats (dependencies, third-party services)
- [ ] Data exposure threats (PII, sensitive data)

### Risk Assessment
| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| {{ threat_1 }} | {{ likelihood_1 }} | {{ impact_1 }} | {{ mitigation_1 }} |
| {{ threat_2 }} | {{ likelihood_2 }} | {{ impact_2 }} | {{ mitigation_2 }} |

## Security Requirements

### Functional Requirements
- [ ] Authentication mechanisms meet NIST 800-63B standards
- [ ] Authorization follows principle of least privilege
- [ ] Data encryption at rest and in transit
- [ ] Audit logging for all security-relevant actions

### Non-Functional Requirements
- [ ] Security testing in CI/CD pipeline
- [ ] Regular security assessments (quarterly)
- [ ] Incident response procedures documented
- [ ] Compliance with relevant regulations (GDPR, SOC2, etc.)

## Implementation Details

### Architecture Changes
{{ architecture_changes }}

### Security Controls
{{ security_controls }}

### Data Flow
{{ data_flow }}

## Testing & Validation

### Security Testing
- [ ] Static Application Security Testing (SAST)
- [ ] Dynamic Application Security Testing (DAST)
- [ ] Penetration testing
- [ ] Dependency scanning

### Compliance Validation
- [ ] GDPR compliance check
- [ ] SOC2 controls validation
- [ ] Industry-specific compliance (if applicable)

## Roll-back Plan

### Roll-back Triggers
- Security vulnerability discovered
- Compliance violation detected
- Performance degradation > 20%
- Critical functionality failure

### Roll-back Procedure
1. **Time to Roll-back**: ≤ 5 minutes
2. **Steps**:
   - {{ rollback_step_1 }}
   - {{ rollback_step_2 }}
   - {{ rollback_step_3 }}
3. **Verification**:
   - {{ rollback_verification }}

## Monitoring & Alerting

### Security Metrics
- Authentication failure rate
- Authorization denial rate
- Security incident count
- Vulnerability scan results

### Alerting Thresholds
- Critical: Security incident detected
- Warning: Unusual access patterns
- Info: Regular security scan results

## Deployment Strategy

### Phased Rollout
1. **Phase 1**: Internal testing ({{ phase_1_timeline }})
2. **Phase 2**: Limited user group ({{ phase_2_timeline }})
3. **Phase 3**: Full deployment ({{ phase_3_timeline }})

### Security Gates
- [ ] Security review approved
- [ ] Penetration test passed
- [ ] Compliance sign-off received
- [ ] Incident response team ready

## Post-Implementation

### Security Review Schedule
- **30-day review**: Security effectiveness assessment
- **90-day review**: Threat model update
- **Annual review**: Complete security audit

### Success Metrics
- Zero security incidents in first 90 days
- 100% compliance with security requirements
- Security testing coverage > 95%

## Approvals

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Lead | | | |
| SRE Lead | | | |
| Product Owner | | | |

---

**Security RFC Checklist**:
- [ ] Threat model completed
- [ ] Risk assessment documented
- [ ] Security requirements defined
- [ ] Implementation details specified
- [ ] Testing strategy outlined
- [ ] Roll-back plan documented
- [ ] Monitoring configured
- [ ] Deployment strategy defined
- [ ] Post-implementation review scheduled
- [ ] All required approvals obtained

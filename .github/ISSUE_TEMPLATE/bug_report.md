---
name: 🐞 Bug Report
description: Report a defect or issue in Project Alchemist
title: "[DOMAIN][SCOPE][TYPE] Brief description of the bug"
labels: ["type/bug"]
assignees: []

---

# 🐞 Bug Report

## 🏷️ Classification & Labels

### Department Classification
- [ ] `dept/leadership` 👔 - Leadership team decisions (Brenda's involvement)
- [ ] `dept/infrastructure` 🏗️ - Infrastructure and deployment (Infrastructure Team ownership)
- [ ] `dept/providers` 🔌 - Resource provider implementations (Resource Provider Team ownership)
- [ ] `dept/quality` 🧪 - Testing and quality assurance (Quality & Testing Team ownership)
- [ ] `dept/documentation` 📚 - Documentation and guides (Documentation Team ownership)
- [ ] `dept/cross-functional` 🤝 - Initiatives requiring multiple teams

### Change Level (Impact Assessment)
- [ ] `level/strategic` 🎯 - Strategic decisions (Requires Brenda's final-approver review)
  - *Architecture decisions, major breaking changes, new core frameworks*
- [ ] `level/tactical` ⚡ - Tactical implementations (Department Lead/Reviewer approval)
  - *New resource implementations, significant infrastructure improvements, major refactors*
- [ ] `level/operational` 🔨 - Operational tasks (Team member/Reviewer approval)
  - *Bug fixes, documentation updates, test improvements, minor enhancements*

### Additional Labels
- [ ] `status/triage` 🔍 - New issue, needs initial assessment
- [ ] `status/blocked` 🛑 - Cannot proceed due to external dependency
- [ ] `role/mentoring` 🌱 - Good for mentee learning opportunity

---

## 📝 Bug Description

### **What is the bug?**
<!-- Provide a clear and concise description of what the bug is -->

### **What did you expect to happen?**
<!-- Describe the expected behavior -->

### **What actually happened?**
<!-- Describe the actual behavior, including error messages -->

### **How does this impact users?**
<!-- Explain the impact on user experience or system functionality -->

---

## 🔄 Reproduction Steps

### **Steps to reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

### **Minimal reproduction example**
<!-- Provide code or configuration that reproduces the issue -->

### **Environment details**
- **OS**: [e.g. macOS, Windows, Linux]
- **Node.js version**: [e.g. 18.x, 20.x]
- **Alchemy version**: [e.g. 0.76.1]
- **Browser**: [e.g. Chrome, Firefox, Safari]
- **Cloud provider**: [e.g. Cloudflare, AWS, GCP]

---

## 📊 Impact Assessment

### **Severity Level**
- [ ] 🔴 **Critical** - System down, data loss, security breach
- [ ] 🟠 **High** - Major feature broken, significant user impact
- [ ] 🟡 **Medium** - Partial functionality, workaround available
- [ ] 🟢 **Low** - Minor issue, cosmetic, minimal impact

### **Affected Components**
- [ ] Core framework
- [ ] CLI tools
- [ ] Resource providers
- [ ] Documentation
- [ ] Examples
- [ ] CI/CD pipeline
- [ ] Testing framework

### **Number of users affected**
- [ ] All users
- [ ] Most users
- [ ] Some users
- [ ] Few users
- [ ] Unknown

---

## 🔍 Technical Details

### **Error messages**
<!-- Paste full error messages, stack traces, or logs -->

### **Screenshots**
<!-- Add screenshots to help explain your problem -->

### **Additional context**
<!-- Add any other context about the problem here -->

### **Related documentation**
<!-- Link to relevant documentation sections -->

---

## 🔗 Related Context

### **Related Issues**
<!-- Link to any related issues using #number format -->
- Related to #
- Depends on #
- Blocks #

### **Previous occurrences**
<!-- Has this happened before? Link to previous instances -->

### **Recent changes**
<!-- Any recent changes that might have caused this -->

---

## 👥 Assignment & Resolution

### **Suggested Team Assignment**
<!-- Based on the department classification above -->
- [ ] Infrastructure Team (@alice.smith)
- [ ] Resource Provider Team (@charlie.brown)
- [ ] Quality & Testing Team (@diana.prince)
- [ ] Documentation Team (@frank.taylor)
- [ ] Leadership (@brendadeeznuts1111)

### **Proposed Resolution Timeline**
- [ ] Immediate (within 24 hours) - Critical issues
- [ ] High priority (within 3 days) - High severity
- [ ] Medium priority (within 1 week) - Medium severity
- [ ] Low priority (within 2 weeks) - Low severity

### **Acceptance Criteria**
- [ ] Bug is identified and root cause understood
- [ ] Fix is implemented and tested
- [ ] Regression tests are added
- [ ] Documentation is updated (if applicable)
- [ ] Fix is deployed to production
- [ ] Users are notified of the fix

---

## 🧪 Testing & Verification

### **Test Strategy**
- [ ] Unit tests to verify fix
- [ ] Integration tests to verify fix
- [ ] End-to-end tests to verify fix
- [ ] Manual testing required
- [ ] Performance testing required

### **Verification Steps**
<!-- List steps to verify the fix works -->

---

## 📚 Additional Information

### **Workarounds**
<!-- Describe any temporary workarounds for users -->

### **Security Considerations**
<!-- Any security implications of this bug -->

### **Performance Impact**
<!-- Any performance implications of this bug -->

### **Mentorship Opportunity**
<!-- Is this a good learning opportunity for mentees? -->

---

**Thank you for helping improve Project Alchemist! 🚀**

### Next Steps
1. **Triage**: Issue will be reviewed and assigned to appropriate team
2. **Assessment**: Impact and severity will be evaluated
3. **Planning**: Fix will be prioritized based on impact
4. **Implementation**: Assigned team will implement and test the fix
5. **Verification**: Fix will be verified and deployed
6. **Communication**: Users will be notified of the resolution
## 💬 Additional Notes

<!-- Any additional context, questions, or concerns -->
<!-- 
Example:
- This might be related to the recent Resource pattern changes
- Consider adding more comprehensive type guard tests
- May need to update documentation if behavior changes
-->

---

**🏷️ Labels**: bug,severity-medium,component-providers  
**👥 Assignees**: @brendadeeznuts1111  
**📊 Size**: [ ] XS [ ] S [ ] M [ ] L [ ] XL  
**🎯 Priority**: Medium/High

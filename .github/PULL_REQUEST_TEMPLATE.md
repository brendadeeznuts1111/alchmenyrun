## 🎯 PR Title (Required Format)
<!-- PR titles MUST follow: [DOMAIN][SCOPE][TYPE] Imperative description -->
<!-- Example: [INFRA][QUEUE][FEAT] Add dead-letter queue support -->

**Title**: `[    ][    ][    ] `

### Title Components
- **[DOMAIN]**: `INFRA`, `PROVIDERS`, `QUALITY`, `DOCS` (maps to `dept/` labels)
- **[SCOPE]**: Component name (e.g., `QUEUE`, `DOCKER-PROVIDER`, `API-DOCS`)
- **[TYPE]**: `FEAT`, `BUG`, `REFACTOR`, `DOCS`, `TEST` (maps to `type/` labels)

---

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

### Change Type
- [ ] `type/bug` 🐞 - Report a defect or issue
- [ ] `type/feature` ✨ - Implement a new capability
- [ ] `type/enhancement` 🚀 - Improve existing functionality
- [ ] `type/chore` 🧹 - Routine maintenance, build updates, etc.
- [ ] `type/refactor` ♻️ - Code restructuring without changing behavior
- [ ] `type/docs` 📖 - Documentation additions or changes
- [ ] `type/test` ✅ - Adding or updating tests
- [ ] `type/security` 🔒 - Security vulnerability or improvement

### Special Labels
- [ ] `role/mentoring` 🌱 - Indicates this PR is for mentee growth/learning
- [ ] `status/blocked` 🛑 - Cannot proceed due to external dependency

## 📋 Review Requirements

### Required Approvers (based on classification)
- **Strategic Changes**: 1 `dept/X` `role/reviewer` + `dept/X` `role/lead` + `role/final-approver` (@brendadeeznuts1111)
- **Tactical Changes**: 1 `dept/X` `role/reviewer` + `dept/X` `role/lead` (No Brenda review required)
- **Operational Changes**: At least 1 `dept/X` `role/reviewer` approval
- **Cross-functional**: At least one `role/reviewer` from each relevant department

### Review Workflow
1. **Submission**: PR created with appropriate labels above
2. **Initial Review**: Automated CODEOWNERS assignment requests reviews
3. **Department Review**: Relevant team members review and approve
4. **Lead Review**: Department lead reviews tactical/strategic changes
5. **Final Approval**: Brenda reviews strategic changes only
6. **Merge**: PR merged after all required approvals

## 📝 Description

### What does this PR do?
<!-- Provide a clear and concise description of the changes -->

### Why is this change needed?
<!-- Explain the problem this change solves or the benefit it provides -->

### How does this change work?
<!-- Brief technical explanation of the implementation -->

### Which teams are affected?
<!-- List all departments that need to be aware of this change -->

## 🧪 Testing

### Test Strategy
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] End-to-end tests added/updated
- [ ] Manual testing completed
- [ ] Performance testing completed (if applicable)

### Test Results
<!-- Describe test results and any known issues -->

### Definition of Done Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated (if applicable)
- [ ] Tests written and passing
- [ ] CI/CD pipeline passing
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Breaking changes documented (if any)

### **Required Reviewers**
<!-- Based on department assignment -->
- **Department Lead**: @username
- **Technical Review**: @username
- **Final Approval**: @username

### **Review Focus Areas**
<!-- What reviewers should focus on -->
- 
- 
- 

### **Self-Review Completed**
- [ ] Reviewed my own code
- [ ] Checked for obvious bugs
- [ ] Verified requirements are met
- [ ] Confirmed no breaking changes (or documented them)

---

## 🔗 Related Issues & Dependencies

### **Closes/Resolves**
<!-- Link to related issues -->
Closes #

### **Dependencies**
<!-- List any dependencies or blockers -->
- 
- 

### **Related PRs**
<!-- Link to related pull requests -->
- 
- 

### **Epic/Feature Link**
<!-- Link to larger feature or epic -->
- 

---

## 📊 Deployment & Release

### **Deployment Notes**
<!-- Any special deployment instructions -->
- 
- 

### **Release Notes**
<!-- What should be included in release notes -->
<!-- 
Example:
- Added advanced Alchemy patterns to JobQueue resource
- Implemented type guard functions for runtime validation
- Added conditional deletion flags for data resources
-->

### **Breaking Changes**
<!-- List any breaking changes and migration steps -->
- 
- 

---

## 🎯 Success Criteria

### **Definition of Done**
- [ ] All requirements implemented
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Code review approved
- [ ] CI/CD pipeline successful
- [ ] Ready for production deployment

### **Expected Outcome**
<!-- What success looks like -->
<!-- 
Example:
- JobQueue is now a first-class Alchemy resource
- All advanced patterns implemented
- Zero breaking changes for existing users
- Improved type safety and developer experience
-->

---

## 💬 Additional Notes

<!-- Any additional context, questions, or concerns -->
<!-- 
Example:
- This establishes patterns for future resource providers
- Consider applying similar patterns to other @alch packages
- Monitor performance in production after release
-->

---

**🏷️ Labels**: enhancement,infrastructure  
**👥 Assignees**: @brendadeeznuts1111  
**📊 Size**: [ ] XS [ ] S [ ] M [ ] L [ ] XL  
**🎯 Priority**: High/Medium/Low

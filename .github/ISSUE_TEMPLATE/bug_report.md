---
name: 🐛 Bug Report
about: Report a bug or issue with Alchemy
title: 'bug: [brief description of the issue]'
labels: bug
assignees: ''

---

## 🐛 Bug Description
<!-- Clear and concise description of the bug -->

### **Current Behavior**
<!-- What is currently happening -->
<!-- 
Example:
When creating a JobQueue with the new advanced patterns, the type guard function `isJobQueue()` returns false for valid JobQueue objects.
-->

### **Expected Behavior**
<!-- What should be happening -->
<!-- 
Example:
The `isJobQueue()` function should return true for objects that have the correct `type: 'job-queue'` property and structure.
-->

---

## 🔍 Reproduction Steps

### **Steps to Reproduce**
<!-- Detailed steps to reproduce the issue -->
1. 
2. 
3. 
4. 

### **Minimal Reproducible Example**
<!-- Code snippet that reproduces the issue -->
```typescript
// Add code here
```

### **Environment**
- **OS**: [e.g., macOS, Linux, Windows]
- **Node.js/Bun Version**: [e.g., Bun 1.3.0]
- **Alchemy Version**: [e.g., v0.76.1]
- **Provider**: [e.g., Cloudflare, Docker, GitHub]

---

## 📊 Impact Assessment

### **Severity**
- [ ] 🔴 **Critical** - Blocks development/production
- [ ] 🟡 **High** - Major functionality broken
- [ ] 🟠 **Medium** - Partial functionality affected
- [ ] 🟢 **Low** - Minor issue or inconvenience

### **Affected Components**
<!-- Check all that apply -->
- [ ] 🏗️ **Infrastructure** - CI/CD, deployment, core framework
- [ ] 🔌 **Resource Providers** - Specific provider implementations
- [ ] 🧪 **Testing** - Test frameworks or test suites
- [ ] 📚 **Documentation** - Guides, examples, API docs
- [ ] 👔 **CLI Tools** - Command-line interface

### **User Impact**
<!-- Who is affected by this bug -->
- [ ] All users
- [ ] Users of specific provider(s): 
- [ ] Users with specific configuration:
- [ ] Development team only

---

## 🛠️ Technical Details

### **Error Messages**
<!-- Include full error messages, stack traces, etc. -->
```
Paste error messages here
```

### **Logs**
<!-- Relevant log output -->
```
Paste logs here
```

### **Screenshots**
<!-- Add screenshots if applicable -->
<!-- Drag and drop screenshots here -->

---

## 🔗 Related Context

### **Related Issues**
<!-- Link to related issues or PRs -->
- 

### **Regression**
- [ ] This is a regression (worked in previous version)
- [ ] Last known working version: 

### **Workarounds**
<!-- Any temporary workarounds -->
<!-- 
Example:
Currently, users can work around this by manually checking the `type` property instead of using the `isJobQueue()` function.
-->

---

## 👥 Assignment & Priority

### **Suggested Assignee**
<!-- Based on component expertise -->
- [ ] @brendadeeznuts1111 (Infrastructure/Providers)
- [ ] Department lead for affected component
- [ ] Anyone available

### **Priority Recommendation**
- [ ] 🔴 **High** - Critical functionality broken
- [ ] 🟡 **Medium** - Important but not blocking
- [ ] 🟢 **Low** - Can be addressed in next cycle

### **Estimated Fix Time**
- [ ] < 1 hour (Simple fix)
- [ ] 1-4 hours (Moderate complexity)
- [ ] 1-2 days (Complex investigation)
- [ ] > 2 days (Major architectural issue)

---

## ✅ Acceptance Criteria

### **Definition of Fixed**
- [ ] Bug no longer occurs
- [ ] Tests pass (including new test cases)
- [ ] No regressions introduced
- [ ] Documentation updated if needed
- [ ] Fix verified in multiple environments

### **Test Cases**
<!-- What should be tested to verify the fix -->
- [ ] Reproduction case no longer fails
- [ ] Edge cases handled correctly
- [ ] Performance impact acceptable
- [ ] Integration with other components works

---

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

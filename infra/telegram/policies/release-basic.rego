package tgk.release

default allow = false

# Basic release approval requirements
approval_requirements = {
  "patch": {"tech-lead": 1},
  "minor": {"tech-lead": 1, "security": 1}, 
  "major": {"tech-lead": 2, "security": 1, "product": 1}
}

# Allow deployment if sufficient approvals
allow {
  input.action == "deploy"
  input.release.type == "patch"
  count(input.approvals) >= 1
}

allow {
  input.action == "deploy"
  input.release.type == "minor"  
  count(input.approvals) >= 2
  has_approval("tech-lead")
  has_approval("security")
}

allow {
  input.action == "deploy"
  input.release.type == "major"
  count(input.approvals) >= 4
  count_approvals("tech-lead") >= 2
  has_approval("security") 
  has_approval("product")
}

# Helper functions
has_approval(role) {
  input.approvals[_].role == role
}

count_approvals(role) = count {
  approvals := [a | a := input.approvals[_]; a.role == role]
  count := count(approvals)
}

# High-risk releases need additional approvals
deny[msg] {
  input.action == "deploy"
  input.release.riskLevel == "high"
  count(input.approvals) < 3
  msg := "High-risk releases require at least 3 approvals"
}

deny[msg] {
  input.action == "deploy" 
  input.release.type == "major"
  input.release.urgency == "critical"
  count(input.approvals) < 2
  msg := "Critical major releases require at least 2 approvals"
}

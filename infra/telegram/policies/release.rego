package release

# Major releases require @alchemist/core approval
deny["major_release_needs_core_approval"] {
  input.release.type == "major"
  not core_approved
}

# At least 2 approvals required for any release
deny["insufficient_approvals"] {
  count(input.release.approvers) < 2
}

# High impact releases need additional scrutiny
deny["high_impact_needs_additional_review"] {
  input.release.impact == "high"
  count(input.release.approvers) < 3
}

# Critical impact releases are blocked without core approval
deny["critical_release_blocked"] {
  input.release.impact == "critical"
  not core_approved
}

# Helper function to check if @alchemist/core has approved
core_approved {
  input.release.approvers[_] == "@alchemist/core"
}

# Allow policy - if no denies match, then allow
allow {
  count(deny) == 0
}

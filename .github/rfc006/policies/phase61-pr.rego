# Phase-6.1 PR Policy Enforcement
# Prevents merge actions when CI checks are failing or reviews are insufficient

package tgk.pr

import future.keywords.if
import future.keywords.in

# Default deny - explicit allow required
default allow := false

# Allow merge only if all conditions met
allow if {
    input.action == "merge"
    input.gh_status == "success"  # CI must pass
    count_approved_reviews(input.gh_reviews) >= 2  # At least 2 approvals
    not has_blocking_reviews(input.gh_reviews)  # No blocking reviews
    input.gh_mergeable == true  # Branch must be mergeable
}

# Allow approve action with fewer restrictions
allow if {
    input.action == "approve"
    input.gh_status in ["success", "pending"]  # CI can be running
    not has_blocking_reviews(input.gh_reviews)
}

# Allow comment/request-changes with no restrictions (for discussion)
allow if {
    input.action in ["comment", "request-changes"]
}

# Helper functions
count_approved_reviews(reviews) := count([r | r := reviews[_]; r.state == "APPROVED"])

has_blocking_reviews(reviews) if {
    some r in reviews
    r.state in ["CHANGES_REQUESTED", "BLOCKED"]
}

# Additional policy checks for security
allow if {
    input.action == "merge"
    input.security_checks_passed == true
    input.vulnerability_scan_passed == true
    not input.contains_sensitive_data
}

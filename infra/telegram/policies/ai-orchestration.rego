# AI Orchestration Policies
package alchemist.ai

# Only SRE team can approve production orchestrations
deny[msg] {
  input.orchestration_target == "production"
  not input.user_team == "sre"
  msg := sprintf("Only SRE team can approve production orchestrations, user %s is in team %s", [input.user, input.user_team])
}

# AI predictions above 0.9 confidence can auto-approve for non-prod
allow {
  input.confidence > 0.9
  input.orchestration_target != "production"
}

# Critical customer-impacting issues can be escalated
escalate[msg] {
  input.impacted_customers > 100
  input.severity == "critical"
  msg := sprintf("Critical issue impacting %d customers - requires immediate executive approval", [input.impacted_customers])
}

# AI explainability requirements
require_explanation {
  input.orchestration_type == "customer_impacting"
  input.explanation_confidence < 0.8
}

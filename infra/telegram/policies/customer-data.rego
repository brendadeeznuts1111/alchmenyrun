# Example policy: Customer data access restrictions
package alchemist.customer

# Deny customer data access to non-authorized channels
deny[msg] {
  input.action == "get"
  input.channel_type == "public"
  msg := sprintf("Customer data cannot be accessed in public channels for customer %s", [input.customer_id])
}

# Deny customer suspension without reason
deny[msg] {
  input.action == "suspend"
  not input.reason
  msg := sprintf("Customer suspension requires a reason for customer %s", [input.customer_id])
}

# Warn on high-frequency customer actions
warn[msg] {
  input.customer_actions_last_hour > 10
  msg := sprintf("High frequency of customer actions (%d in last hour) for customer %s", [input.customer_actions_last_hour, input.customer_id])
}

# Allow only billing team to suspend customers
deny[msg] {
  input.action == "suspend"
  not input.user_team == "billing-leads"
  msg := sprintf("Only billing team can suspend customers, user %s is in team %s", [input.user, input.user_team])
}

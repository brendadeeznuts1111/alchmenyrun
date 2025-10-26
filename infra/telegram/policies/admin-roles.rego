# Example policy: Admin role restrictions
package alchemist.telegram

# Deny if bot has delete permissions
deny[msg] {
  input.permissions.can_delete_messages == true
  msg := sprintf("Bot should not have delete message permissions in chat %d", [input.id])
}

# Warn if too many admins
warn[msg] {
  admin_count := count([user | user := input.members[_]; user.status == "administrator"])
  admin_count > 5
  msg := sprintf("Too many administrators (%d > 5) in chat %d", [admin_count, input.id])
}

package tgk.email.routing

# Allow routing for valid domains
allow_routing {
    input.domain == "infra"
}

allow_routing {
    input.domain == "docs"
}

allow_routing {
    input.domain == "qa"
}

allow_routing {
    input.domain == "integrations"
}

allow_routing {
    input.domain == "exec"
}

# Block routing for unknown domains
deny_routing {
    not allow_routing
}

# Validate priority levels
valid_priority {
    input.hierarchy == "p0"
}

valid_priority {
    input.hierarchy == "p1"
}

valid_priority {
    input.hierarchy == "p2"
}

valid_priority {
    input.hierarchy == "p3"
}

valid_priority {
    input.hierarchy == "blk"
}

# Validate event types
valid_type {
    input.type == "pr"
}

valid_type {
    input.type == "issue"
}

valid_type {
    input.type == "deploy"
}

valid_type {
    input.type == "alert"
}

valid_type {
    input.type == "review"
}

# Business hours routing (example policy)
business_hours_ok {
    input.meta == "gh"  # GitHub notifications can come anytime
}

business_hours_ok {
    input.hierarchy == "blk"  # Blockers can come anytime
}

business_hours_ok {
    now := time.now_ns()
    hour := (now / 1000000000) % 86400 / 3600
    hour >= 9  # 9 AM
    hour <= 17  # 5 PM
}

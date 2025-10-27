#!/usr/bin/env bash
# tgk Metrics Collection Script
# Collects and exports Prometheus metrics for forum operations

set -euo pipefail

METRICS_FILE="${TGK_METRICS_FILE:-/tmp/tgk-metrics.prom}"
PUSHGATEWAY_URL="${TGK_PUSHGATEWAY_URL:-http://prometheus:9091}"

# Initialize metrics file
cat > "$METRICS_FILE" << 'EOF'
# HELP tgk_forum_topics_total Total number of forum topics by state
# TYPE tgk_forum_topics_total gauge

# HELP tgk_forum_polish_applied_total Total number of forum polish operations applied
# TYPE tgk_forum_polish_applied_total counter

# HELP tgk_forum_polish_errors_total Total number of forum polish errors
# TYPE tgk_forum_polish_errors_total counter

# HELP tgk_forum_audit_duration_seconds Duration of forum audit operations
# TYPE tgk_forum_audit_duration_seconds histogram

# HELP tgk_forum_polish_duration_seconds Duration of forum polish operations
# TYPE tgk_forum_polish_duration_seconds histogram
EOF

# Function to update gauge metric
update_gauge() {
    local metric_name="$1"
    local labels="$2"
    local value="$3"
    
    echo "${metric_name}{${labels}} ${value}" >> "$METRICS_FILE"
}

# Function to increment counter
increment_counter() {
    local metric_name="$1"
    local labels="$2"
    local increment="${3:-1}"
    
    echo "${metric_name}{${labels}} ${increment}" >> "$METRICS_FILE"
}

# Function to record histogram
record_histogram() {
    local metric_name="$1"
    local labels="$2"
    local value="$3"
    
    echo "${metric_name}_sum{${labels}} ${value}" >> "$METRICS_FILE"
    echo "${metric_name}_count{${labels}} 1" >> "$METRICS_FILE"
}

# Collect forum metrics from audit file
collect_forum_metrics() {
    local audit_file="$1"
    
    if [ ! -f "$audit_file" ]; then
        echo "❌ Audit file not found: $audit_file" >&2
        return 1
    fi
    
    local total_topics polished_topics custom_topics
    total_topics=$(jq -r '.total_topics' "$audit_file")
    polished_topics=$(jq -r '.polished_topics' "$audit_file")
    custom_topics=$(jq -r '.custom_topics' "$audit_file")
    
    update_gauge "tgk_forum_topics_total" "state=\"polished\"" "$polished_topics"
    update_gauge "tgk_forum_topics_total" "state=\"custom\"" "$custom_topics"
    update_gauge "tgk_forum_topics_total" "state=\"total\"" "$total_topics"
}

# Collect polish metrics from ledger
collect_polish_metrics() {
    local ledger_file="${1:-.tgk/meta/forum-polish.jsonl}"
    
    if [ ! -f "$ledger_file" ]; then
        echo "⚠️  Ledger file not found: $ledger_file" >&2
        return 0
    fi
    
    # Count total polish operations
    local total_polish_ops
    total_polish_ops=$(wc -l < "$ledger_file" | tr -d ' ')
    
    # Get most recent operation
    local last_entry
    last_entry=$(tail -1 "$ledger_file")
    
    local renamed repinned failed reason
    renamed=$(echo "$last_entry" | jq -r '.renamed // 0')
    repinned=$(echo "$last_entry" | jq -r '.repinned // 0')
    failed=$(echo "$last_entry" | jq -r '.failed // 0')
    reason=$(echo "$last_entry" | jq -r '.reason // "unknown"')
    
    increment_counter "tgk_forum_polish_applied_total" "reason=\"$reason\"" "$total_polish_ops"
    
    if [ "$failed" -gt 0 ]; then
        increment_counter "tgk_forum_polish_errors_total" "reason=\"$reason\"" "$failed"
    fi
}

# Push metrics to Pushgateway
push_metrics() {
    if [ ! -f "$METRICS_FILE" ]; then
        echo "❌ Metrics file not found: $METRICS_FILE" >&2
        return 1
    fi
    
    if command -v curl >/dev/null 2>&1; then
        curl -X POST \
            --data-binary "@${METRICS_FILE}" \
            "${PUSHGATEWAY_URL}/metrics/job/tgk/instance/forum-polish" \
            2>/dev/null || echo "⚠️  Failed to push metrics to Pushgateway" >&2
    else
        echo "⚠️  curl not available - metrics not pushed" >&2
    fi
}

# Main execution
main() {
    local command="${1:-}"
    
    case "$command" in
        "collect")
            shift
            local audit_file="${1:-}"
            if [ -z "$audit_file" ]; then
                echo "❌ Usage: tgk-metrics.sh collect <audit-file>" >&2
                exit 1
            fi
            collect_forum_metrics "$audit_file"
            collect_polish_metrics
            echo "✅ Metrics collected to: $METRICS_FILE"
            ;;
        "push")
            push_metrics
            echo "✅ Metrics pushed to: $PUSHGATEWAY_URL"
            ;;
        "collect-and-push")
            shift
            local audit_file="${1:-}"
            if [ -z "$audit_file" ]; then
                echo "❌ Usage: tgk-metrics.sh collect-and-push <audit-file>" >&2
                exit 1
            fi
            collect_forum_metrics "$audit_file"
            collect_polish_metrics
            push_metrics
            echo "✅ Metrics collected and pushed"
            ;;
        *)
            cat << 'EOF'
tgk-metrics.sh - Metrics Collection for tgk Forum Operations

Usage: tgk-metrics.sh <command> [options]

Commands:
    collect <audit-file>        Collect metrics from audit file
    push                        Push metrics to Pushgateway
    collect-and-push <audit-file>  Collect and push in one step

Environment Variables:
    TGK_METRICS_FILE           Path to metrics file (default: /tmp/tgk-metrics.prom)
    TGK_PUSHGATEWAY_URL        Pushgateway URL (default: http://prometheus:9091)

Examples:
    tgk-metrics.sh collect /tmp/forum-audit.json
    tgk-metrics.sh push
    tgk-metrics.sh collect-and-push /tmp/forum-audit.json
EOF
            exit 1
            ;;
    esac
}

main "$@"

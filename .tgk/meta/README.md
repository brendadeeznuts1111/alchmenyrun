# tgk Metadata Directory

This directory contains audit logs and metadata for tgk operations.

## Files

### `forum-polish.jsonl`
JSONL (JSON Lines) file containing audit trail for forum polish operations.

Each line is a JSON object with the following structure:
```json
{
  "timestamp": "2025-10-27T00:00:00Z",
  "action": "polish",
  "renamed": 12,
  "repinned": 12,
  "failed": 0,
  "reason": "quarterly-polish"
}
```

**Fields:**
- `timestamp`: ISO 8601 timestamp of the operation
- `action`: Type of operation (always "polish" for forum polish)
- `renamed`: Number of topics successfully renamed
- `repinned`: Number of topics successfully re-pinned
- `failed`: Number of topics that failed to rename
- `reason`: Human-readable reason for the polish operation

### `topic-renames.jsonl`
JSONL file containing audit trail for individual topic rename operations.

Each line is a JSON object with the following structure:
```json
{
  "timestamp": "2025-10-27T00:00:00Z",
  "action": "create",
  "stream": "security-discussion",
  "topic": "🛡️ sec-security-discussion",
  "owner": "@alice",
  "type": "security"
}
```

**Fields:**
- `timestamp`: ISO 8601 timestamp of the operation
- `action`: Type of operation ("create", "rename", "archive")
- `stream`: Stream name
- `topic`: Topic name (after rename)
- `owner`: Topic owner handle
- `type`: Stream type (security, sre, data, product, etc.)

## Usage

These files are automatically created and updated by tgk commands:
- `tgk forum polish --apply` updates `forum-polish.jsonl`
- `tgk stream create` updates `topic-renames.jsonl`

## Querying

Use `jq` to query the audit logs:

```bash
# Get all polish operations in the last 30 days
jq -s 'map(select(.timestamp > (now - 30*86400 | strftime("%Y-%m-%dT%H:%M:%SZ"))))' .tgk/meta/forum-polish.jsonl

# Count total topics renamed
jq -s 'map(.renamed) | add' .tgk/meta/forum-polish.jsonl

# Get all security stream topics
jq -s 'map(select(.type == "security"))' .tgk/meta/topic-renames.jsonl
```

## Retention

Audit logs are retained indefinitely and committed to git for full traceability.

## Security

These files may contain sensitive information (chat IDs, user handles). Ensure proper access controls are in place.

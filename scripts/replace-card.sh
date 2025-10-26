#!/usr/bin/env bash
# replace-card.sh - Update existing Telegram message content
# Usage: ./replace-card.sh <chat_id> <message_id> "New Title" "New Body"
#
# Updates an existing Telegram message with new content (useful for status changes)
# Returns the updated message ID for tracking

set -eu

if [ $# -ne 4 ]; then
  echo "Usage: $0 <chat_id> <message_id> \"New Title\" \"New Body\""
  echo "Example: $0 -1001234567890 12345 \"🚨 ALERT\" \"System down\""
  exit 1
fi

CHAT_ID="$1"
MESSAGE_ID="$2"
TITLE="$3"
BODY="$4"

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN environment variable not set"
  exit 1
fi

echo "Updating message $MESSAGE_ID in chat $CHAT_ID..."

# Format the message with title and body
FORMATTED_TEXT="${TITLE}

${BODY}"

# Update the message via Telegram Bot API
response=$(curl -sX POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText" \
  -d chat_id="${CHAT_ID}" \
  -d message_id="${MESSAGE_ID}" \
  -d parse_mode="MarkdownV2" \
  -d text="${FORMATTED_TEXT}")

# Extract the new message ID from the response
new_message_id=$(echo "$response" | jq -r '.result.message_id' 2>/dev/null || echo "")

if [ -n "$new_message_id" ] && [ "$new_message_id" != "null" ]; then
  echo "✅ Updated card → message_id: $new_message_id"
  # Output just the message ID for scripting
  echo "$new_message_id"
else
  echo "❌ Failed to update message. Response: $response"
  exit 1
fi

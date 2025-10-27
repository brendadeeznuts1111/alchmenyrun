#!/usr/bin/env bash
# rollback-telegram.sh - Emergency Telegram message deletion script
# Usage: ./rollback-telegram.sh <chat_id> <message_id>
#
# Deletes a specific Telegram message for emergency rollback scenarios
# Requires TELEGRAM_BOT_TOKEN environment variable to be set

set -eu

if [ $# -ne 2 ]; then
  echo "Usage: $0 <chat_id> <message_id>"
  echo "Example: $0 -1001234567890 12345"
  exit 1
fi

CHAT_ID="$1"
MESSAGE_ID="$2"

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN environment variable not set"
  exit 1
fi

echo "Deleting message $MESSAGE_ID from chat $CHAT_ID..."

# Delete the message via Telegram Bot API
response=$(curl -sX POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage" \
  -d chat_id="${CHAT_ID}" \
  -d message_id="${MESSAGE_ID}")

# Check if the deletion was successful
if echo "$response" | grep -q '"ok":true'; then
  echo "✅ Message $MESSAGE_ID deleted successfully from chat $CHAT_ID"
else
  echo "❌ Failed to delete message. Response: $response"
  exit 1
fi

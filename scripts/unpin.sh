#!/usr/bin/env bash
# unpin.sh - Remove all pinned messages from a Telegram chat
# Usage: ./unpin.sh <chat_id>
#
# Unpins all currently pinned messages in the specified chat
# Useful for emergency cleanup or switching between different pinning strategies

set -eu

if [ $# -ne 1 ]; then
  echo "Usage: $0 <chat_id>"
  echo "Example: $0 -1001234567890"
  exit 1
fi

CHAT_ID="$1"

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN environment variable not set"
  exit 1
fi

echo "Unpinning all messages in chat $CHAT_ID..."

# Unpin all messages via Telegram Bot API
response=$(curl -sX POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/unpinAllChatMessages" \
  -d chat_id="${CHAT_ID}")

# Check if the unpinning was successful
if echo "$response" | grep -q '"ok":true'; then
  echo "✅ All messages unpinned successfully from chat $CHAT_ID"
  echo "💡 Tip: Follow with sendMessage + pinChatMessage to pin a replacement"
else
  echo "❌ Failed to unpin messages. Response: $response"
  exit 1
fi

#!/usr/bin/env bash
# notify-telegram.sh - Reusable Telegram notification script for RFC automation
# Usage: ./notify-telegram.sh <phase> <status> <message>
#
# Arguments:
#   PHASE: day1 / day2 / retired
#   STATUS: start / success / failure
#   MSG: Message content (supports Markdown)
#
# Environment variables:
#   TELEGRAM_BOT_TOKEN: Bot API token from BotFather
#   TELEGRAM_CHAT_ID: Target chat/channel ID (e.g., -100xxxxxxxxxx for channels)

set -eu

PHASE=$1        # day1 / day2 / retired
STATUS=$2       # start / success / failure
MSG=$3
TOKEN=${TELEGRAM_BOT_TOKEN}
CHAT=${TELEGRAM_CHAT_ID}   # passed from caller

# Validate required environment variables
if [ -z "$TOKEN" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN environment variable not set"
  exit 1
fi

if [ -z "$CHAT" ]; then
  echo "Error: TELEGRAM_CHAT_ID environment variable not set"
  exit 1
fi

# Add status emoji based on status
case $STATUS in
  "start")
    EMOJI="🚀"
    ;;
  "success")
    EMOJI="✅"
    ;;
  "failure")
    EMOJI="❌"
    ;;
  *)
    EMOJI="📢"
    ;;
esac

# Format message with phase and status
FORMATTED_MSG="$EMOJI **$PHASE** - $STATUS
$MSG"

# Send message via Telegram Bot API with topic and pinning support
MESSAGE_ID=$(curl -X POST \
  "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d chat_id="${CHAT}" \
  -d text="${FORMATTED_MSG}" \
  -d parse_mode=Markdown \
  -d disable_web_page_preview=true \
  -d message_thread_id="${TELEGRAM_TOPIC_FORUM:-}" \
  --silent \
  --show-error \
  --fail | jq -r '.result.message_id')

echo "Message sent to Telegram chat $CHAT, message ID: $MESSAGE_ID"

# Pin message if it's a status update or RFC review
if [[ "$PHASE" == "RFC Review" || "$PHASE" == "Forum Polish" ]]; then
  curl -X POST \
    "https://api.telegram.org/bot${TOKEN}/pinChatMessage" \
    -d chat_id="${CHAT}" \
    -d message_id="${MESSAGE_ID}" \
    -d disable_notification=true \
    --silent \
    --show-error \
    --fail
  echo "Message pinned in forum topic $TELEGRAM_TOPIC_FORUM"
fi

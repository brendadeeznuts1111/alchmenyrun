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

# Send message via Telegram Bot API
curl -X POST \
  "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d chat_id="${CHAT}" \
  -d text="${FORMATTED_MSG}" \
  -d parse_mode=Markdown \
  -d disable_web_page_preview=true \
  --silent \
  --show-error \
  --fail

echo "Message sent to Telegram chat $CHAT"

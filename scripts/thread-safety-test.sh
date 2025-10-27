#!/usr/bin/env bash
# Thread-safety proof for micro-rfc-005

echo "🧪 THREAD-SAFETY PROOF - micro-rfc-005"
echo "====================================="
echo ""

# Worker URL (replace with actual deployed worker URL)
WORKER_URL="https://github-webhook.<your-worker>.workers.dev"

echo "📋 Configuration:"
echo "   Worker URL: $WORKER_URL"
echo "   Test Topic: forum-polish"
echo ""

echo "🚀 Sending two concurrent hooks to same topic..."
echo ""

# Send two events ½ s apart to the same topic
echo "First hook (review event)..."
curl -X POST "$WORKER_URL/forum-polish" \
  -H "Content-Type: application/json" \
  -d '{"action":"review","number":999}' &

sleep 0.5

echo "Second hook (push event)..."
curl -X POST "$WORKER_URL/forum-polish" \
  -H "Content-Type: application/json" \
  -d '{"action":"push","number":999}'

wait

echo ""
echo "✅ Thread-safety test completed!"
echo ""
echo "🎯 Expected Telegram Result:"
echo "   ✅ Only the second message (push) is pinned"
echo "   ✅ The first message (review) is absent from pin bar"
echo "   ✅ DO single-threaded execution prevents race condition"
echo ""
echo "📊 If both messages are pinned = race condition → DO not serialising"
echo "🏆 If only second is pinned = micro-rfc-005 is working!"

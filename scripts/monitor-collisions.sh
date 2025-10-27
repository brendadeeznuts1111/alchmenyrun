#!/bin/bash

# Collision Elimination Monitoring Script
# Tracks deployment success rates and naming conflicts

set -e

echo "🔍 Collision Elimination Monitoring Report"
echo "=========================================="

# Get recent workflow runs
echo "📊 Recent Deployment Status (Last 50 runs):"
gh run list --limit 50 --json conclusion,workflowName,headBranch,databaseId \
  | jq -r '.[] | "\(.databaseId) \(.conclusion) \(.workflowName) \(.headBranch)"' \
  | head -20

echo ""
echo "🎯 Success Rate Analysis:"
success_count=$(gh run list --limit 50 --json conclusion | jq '[.[] | select(.conclusion == "success")] | length')
total_count=$(gh run list --limit 50 --json conclusion | jq '. | length')
success_rate=$((success_count * 100 / total_count))

echo "✅ Success Rate: ${success_rate}% (${success_count}/${total_count})"

echo ""
echo "🚨 Collision Detection (Last 30 days):"
echo "Searching for naming conflicts in workflow logs..."

# Get failed runs and check for collision errors
failed_runs=$(gh run list --limit 30 --json databaseId,conclusion | jq -r '.[] | select(.conclusion == "failure") | .databaseId')

collision_count=0
for run_id in $failed_runs; do
  if gh run view "$run_id" --log 2>/dev/null | grep -q -i "already exists\|409\|conflict\|name.*exists"; then
    collision_count=$((collision_count + 1))
    echo "❌ Collision found in run: $run_id"
  fi
done

echo ""
echo "📈 Collision Metrics:"
echo "🎯 Collisions detected: $collision_count"
if [ $collision_count -eq 0 ]; then
  echo "✅ ZERO COLLISIONS - Stage-unique pattern working perfectly!"
else
  echo "⚠️  Collisions still occurring - investigate failed runs"
fi

echo ""
echo "🔄 Stage Distribution Analysis:"
echo "Analyzing resource creation across stages..."

# Check for stage-specific resource creation patterns
echo "📋 Stage-specific resources created:"
gh run list --limit 10 --json databaseId,conclusion,workflowName \
  | jq -r '.[] | select(.workflowName == "Deploy Application") | .databaseId' \
  | while read run_id; do
    echo "Checking run $run_id for stage patterns..."
    gh run view "$run_id" --log 2>/dev/null | grep -E "(preview|prod|pr-[0-9]+)" | head -3 || true
  done

echo ""
echo "🎯 Recommendations:"
if [ $collision_count -eq 0 ] && [ $success_rate -ge 95 ]; then
  echo "✅ EXCELLENT: Zero collisions with high success rate"
  echo "🚀 Ready to extend pattern to more resources"
elif [ $collision_count -eq 0 ]; then
  echo "✅ GOOD: Zero collisions but success rate could improve"
  echo "📊 Monitor other failure types"
else
  echo "⚠️  ACTION NEEDED: Collisions still detected"
  echo "🔧 Review failed runs and ensure stage-unique pattern adoption"
fi

echo ""
echo "📊 Monitoring Complete - $(date)"

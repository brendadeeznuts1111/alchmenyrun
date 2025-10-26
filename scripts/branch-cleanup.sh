#!/usr/bin/env bash
# Clean up old merged branches

set -e

echo "🧹 Cleaning up merged branches..."

# Fetch latest and prune
git fetch --prune origin

# Find merged branches (excluding main and current branch)
MERGED_BRANCHES=$(git branch -r --merged origin/main | \
  grep -v "main" | \
  grep -v "HEAD" | \
  sed 's/origin\///' || true)

if [ -z "$MERGED_BRANCHES" ]; then
  echo "✨ No merged branches to clean up"
  exit 0
fi

echo "Found merged branches:"
echo "$MERGED_BRANCHES"
echo ""

# Confirm deletion
read -p "Delete these branches? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "$MERGED_BRANCHES" | xargs -I {} git push origin --delete {} || echo "⚠️  Some branches may already be deleted"
  echo "✅ Cleanup complete"
else
  echo "❌ Cleanup cancelled"
fi

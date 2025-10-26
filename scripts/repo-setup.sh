#!/usr/bin/env bash
# Repo setup script for production-grade branch protection and cleanup

set -e

REPO="brendadeeznuts1111/alchmenyrun"

echo "🔧 Setting up repository hygiene for $REPO"

# 1. Enable auto-merge and delete-branch-on-merge
echo "📋 Enabling auto-merge and delete-branch-on-merge..."
gh repo edit "$REPO" \
  --enable-auto-merge \
  --delete-branch-on-merge

# 2. Protect main branch
echo "🛡️  Setting up branch protection for main..."
gh api "repos/$REPO/branches/main/protection" -X PUT \
  --field required_status_checks='{"strict":true,"contexts":["test"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

echo "✅ Branch protection configured"

# 3. Clean up merged branches
echo "🧹 Cleaning up merged branches..."
git fetch --prune
MERGED_BRANCHES=$(git branch -r --merged origin/main | grep -v "main" | sed 's/origin\///' || true)

if [ -n "$MERGED_BRANCHES" ]; then
  echo "Found merged branches to delete:"
  echo "$MERGED_BRANCHES"
  echo "$MERGED_BRANCHES" | xargs -I {} git push origin --delete {} || echo "Some branches may already be deleted"
else
  echo "No merged branches to clean up"
fi

# 4. Create release tag
echo "🏷️  Creating release tag..."
CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
echo "Current version: $CURRENT_VERSION"
echo "To create a new tag, run: git tag v2.0.0-kit-beta && git push origin v2.0.0-kit-beta"

echo "✨ Repository setup complete!"

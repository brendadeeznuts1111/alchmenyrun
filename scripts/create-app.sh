#!/usr/bin/env bash
# Create a new Alchemy app from template

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/create-app.sh <app-name>"
  echo "Example: ./scripts/create-app.sh my-demo"
  exit 1
fi

APP_NAME="$1"
APP_DIR="./apps/$APP_NAME"

echo "🚀 Creating new Alchemy app: $APP_NAME"

# Create app directory
mkdir -p "$APP_DIR"

# Copy template files
echo "📦 Copying template files..."
cp -r templates/app/* "$APP_DIR/"

# Update package.json name
if command -v sed &> /dev/null; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/my-alchemy-app/$APP_NAME/g" "$APP_DIR/package.json"
  else
    # Linux
    sed -i "s/my-alchemy-app/$APP_NAME/g" "$APP_DIR/package.json"
  fi
fi

# Update config name
if command -v sed &> /dev/null; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/my-app/$APP_NAME/g" "$APP_DIR/alchemy.config.ts"
  else
    sed -i "s/my-app/$APP_NAME/g" "$APP_DIR/alchemy.config.ts"
  fi
fi

echo "✅ App created at: $APP_DIR"
echo ""
echo "Next steps:"
echo "  cd $APP_DIR"
echo "  bun install"
echo "  bun run dev"

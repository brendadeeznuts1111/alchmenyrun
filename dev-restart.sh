#!/bin/bash

# Clean restart for Alchemy development
echo "🧹 Cleaning up previous workerd processes..."
pkill -f workerd || true

echo "🏗️ Building CSS..."
bun run build:css

echo "🚀 Starting fresh Alchemy development server..."
bun run alchemy:dev

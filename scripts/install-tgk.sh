#!/usr/bin/env bash
# tgk v4.4.0 Installation Script
# One-line install: curl -Ls https://alch.run/tgk4-4 | bash

set -euo pipefail

VERSION="4.4.0"
INSTALL_DIR="${HOME}/.local/bin"
TGK_URL="https://raw.githubusercontent.com/alchemist/alchmenyrun/main/scripts/tgk"
BACKUP_DIR="${HOME}/.tgk/backups"

echo "🚀 Installing tgk v${VERSION}..."
echo ""

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "${HOME}/.tgk/meta"

# Backup existing installation if present
if [ -f "${INSTALL_DIR}/tgk" ]; then
    BACKUP_FILE="${BACKUP_DIR}/tgk-$(date +%Y%m%d-%H%M%S).bak"
    echo "📦 Backing up existing tgk to: $BACKUP_FILE"
    cp "${INSTALL_DIR}/tgk" "$BACKUP_FILE"
fi

# Download latest tgk script
echo "⬇️  Downloading tgk v${VERSION}..."
if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$TGK_URL" -o "${INSTALL_DIR}/tgk"
elif command -v wget >/dev/null 2>&1; then
    wget -q "$TGK_URL" -O "${INSTALL_DIR}/tgk"
else
    echo "❌ Error: curl or wget required for installation"
    exit 1
fi

# Make executable
chmod +x "${INSTALL_DIR}/tgk"

# Verify installation
if [ -x "${INSTALL_DIR}/tgk" ]; then
    echo "✅ tgk v${VERSION} installed successfully!"
    echo ""
    echo "📍 Installation location: ${INSTALL_DIR}/tgk"
    echo ""
    
    # Check if in PATH
    if echo "$PATH" | grep -q "${INSTALL_DIR}"; then
        echo "✅ ${INSTALL_DIR} is in your PATH"
    else
        echo "⚠️  ${INSTALL_DIR} is not in your PATH"
        echo ""
        echo "Add to your shell profile (~/.bashrc, ~/.zshrc, or ~/.config/fish/config.fish):"
        echo ""
        echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo ""
    fi
    
    # Check dependencies
    echo "🔍 Checking dependencies..."
    
    MISSING_DEPS=()
    
    if ! command -v jq >/dev/null 2>&1; then
        MISSING_DEPS+=("jq")
    fi
    
    if ! command -v curl >/dev/null 2>&1; then
        MISSING_DEPS+=("curl")
    fi
    
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        echo "⚠️  Missing dependencies: ${MISSING_DEPS[*]}"
        echo ""
        echo "Install with:"
        echo "  macOS:   brew install ${MISSING_DEPS[*]}"
        echo "  Ubuntu:  sudo apt-get install ${MISSING_DEPS[*]}"
        echo "  Fedora:  sudo dnf install ${MISSING_DEPS[*]}"
    else
        echo "✅ All dependencies satisfied"
    fi
    
    echo ""
    echo "🎉 Installation complete!"
    echo ""
    echo "📚 Quick Start:"
    echo "  1. Set your bot token:"
    echo "     export TELEGRAM_BOT_TOKEN='your_bot_token_here'"
    echo ""
    echo "  2. Test installation:"
    echo "     tgk --version"
    echo ""
    echo "  3. Run forum audit:"
    echo "     tgk forum audit -c <council_id> -o json"
    echo ""
    echo "  4. Polish forum topics:"
    echo "     tgk forum polish --dry-run --audit audit.json"
    echo "     tgk forum polish --apply --audit audit.json --reason 'quarterly-polish'"
    echo ""
    echo "📖 Documentation: https://github.com/alchemist/alchmenyrun/blob/main/docs/TGK_GUIDE.md"
    echo ""
else
    echo "❌ Installation failed"
    exit 1
fi

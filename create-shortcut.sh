#!/bin/bash

# Plugin Vault Shortcut Creator
# This script creates a symbolic link to your WebDAV server

echo "🎵 Plugin Vault Shortcut Creator"
echo "================================"

# Create a shortcut in your home directory
SHORTCUT_PATH="$HOME/PluginVault"
MOUNT_PATH="/Volumes/PluginVault"  # Default mount location

echo "📁 Creating shortcut: $SHORTCUT_PATH"
echo "🔗 Linking to: $MOUNT_PATH"

# Check if the mount point exists
if [ -d "$MOUNT_PATH" ]; then
    # Create symbolic link
    ln -sf "$MOUNT_PATH" "$SHORTCUT_PATH"
    echo "✅ Shortcut created successfully!"
    echo "📁 You can now access your plugins at: $SHORTCUT_PATH"
else
    echo "⚠️  Mount point not found at: $MOUNT_PATH"
    echo "💡 Make sure to connect via Finder first:"
    echo "   1. Open Finder"
    echo "   2. Press Cmd + K"
    echo "   3. Enter: https://pluginvault-backend-production.up.railway.app/webdav"
    echo "   4. Connect with admin/password"
fi 
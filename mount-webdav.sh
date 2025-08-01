#!/bin/bash

# Plugin Vault WebDAV Mount Script
# This script mounts your WebDAV server to a local directory

echo "🎵 Plugin Vault WebDAV Mount Script"
echo "===================================="

# Create mount directory
MOUNT_DIR="$HOME/PluginVault"
echo "📁 Creating mount directory: $MOUNT_DIR"
mkdir -p "$MOUNT_DIR"

# WebDAV URL and credentials
WEBDAV_URL="https://pluginvault-backend-production.up.railway.app/webdav"
USERNAME="admin"
PASSWORD="password"

echo "🌐 Mounting WebDAV server..."
echo "URL: $WEBDAV_URL"
echo "Username: $USERNAME"
echo "Password: $PASSWORD"

# Mount the WebDAV server
mount_webdav "$WEBDAV_URL" "$MOUNT_DIR" -u "$USERNAME" -p "$PASSWORD"

if [ $? -eq 0 ]; then
    echo "✅ WebDAV server mounted successfully!"
    echo "📁 Mount location: $MOUNT_DIR"
    echo ""
    echo "🎵 Now you can:"
    echo "1. Set your DAW's custom plugin folder to: $MOUNT_DIR"
    echo "2. Upload plugins via Cyberduck to the server"
    echo "3. Your DAW will automatically find the plugins!"
    echo ""
    echo "🔧 To unmount later:"
    echo "   umount $MOUNT_DIR"
else
    echo "❌ Failed to mount WebDAV server"
    echo "💡 Try mounting manually:"
    echo "   mount_webdav $WEBDAV_URL $MOUNT_DIR"
fi 
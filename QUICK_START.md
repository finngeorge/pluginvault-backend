# Plugin Vault - Quick Start Guide

## 🎯 What We Built

A **WebDAV server** for hosting audio production plugins (VST, VST3, AU, AAX, Standalone) that allows you to access your plugins from any studio via macOS.

## 🚀 Get Started in 5 Minutes

### 1. Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Test the server
node test.js
```

### 2. Connect from macOS

1. **Open Finder**
2. **Press `Cmd + K`** (Connect to Server)
3. **Enter URL**: `http://localhost:3000/webdav/plugins`
4. **Use credentials**: `admin` / `password`

### 3. Upload Your First Plugin

Visit: `http://localhost:3000/admin`

-   Select plugin type (VST, VST3, AU, AAX, Standalone)
-   Upload your plugin file
-   Access it from any studio!

## 🌐 Deploy to Production

### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Option 2: Use our deployment script

```bash
# Deploy to Railway
./deploy.sh railway

# Deploy to Heroku
./deploy.sh heroku

# Build Docker image
./deploy.sh docker
```

## 📁 Supported Plugin Types

-   **VST** - Virtual Studio Technology
-   **VST3** - Virtual Studio Technology 3
-   **AU** - Audio Units (macOS)
-   **AAX** - Avid Audio eXtension
-   **Standalone** - Standalone applications

## 🔗 Connection Methods

### macOS Finder

```
URL: https://your-domain.com/webdav/plugins
Username: admin
Password: password
```

### Terminal (macOS)

```bash
mount_webdav https://your-domain.com/webdav/plugins /Volumes/PluginVault
```

### WebDAV Clients

-   **Cyberduck** (Free)
-   **FileZilla** (Free)
-   **Transmit** (macOS)

## 📊 API Endpoints

```bash
# Health check
GET /api/health

# List all plugins
GET /api/plugins

# Upload plugin
POST /api/plugins/upload
Content-Type: multipart/form-data
Body: plugin=@file.vst3&type=vst3

# Delete plugin
DELETE /api/plugins/vst3/plugin.vst3
```

## 🔧 Admin Interface

Visit `http://localhost:3000/admin` for:

-   📤 Upload plugins
-   📁 Browse plugin library
-   📊 View statistics
-   🗑️ Delete plugins

## 🛡️ Security Features

-   ✅ Basic authentication
-   ✅ Rate limiting
-   ✅ CORS protection
-   ✅ File size limits (500MB)
-   ✅ Security headers

## 📈 Production Checklist

-   [ ] Change default credentials
-   [ ] Set up HTTPS
-   [ ] Configure environment variables
-   [ ] Set up monitoring
-   [ ] Implement backups
-   [ ] Test WebDAV connection

## 🆘 Need Help?

1. **Check logs**: `npm start`
2. **Run tests**: `node test.js`
3. **Test WebDAV**: `curl -u admin:password http://localhost:3000/webdav/plugins/`
4. **Read docs**: See `README.md` and `DEPLOYMENT.md`

## 🎵 Ready to Rock!

Your Plugin Vault is now ready to host your audio plugins and make them accessible from any studio. Upload your plugins and start making music! 🎸

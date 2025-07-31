# Plugin Vault Deployment Guide

This guide will help you deploy your Plugin Vault WebDAV server to production.

## 🚀 Quick Deploy Options

### 1. Railway (Recommended)

Railway is perfect for audio files and provides excellent performance for large plugin uploads.

**Steps:**

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

**Environment Variables to set in Railway:**

```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://app--plugin-vault-be37ceb5.base44.app
JWT_SECRET=your-production-secret-here
WEBDAV_USERNAME=your-username
WEBDAV_PASSWORD=your-secure-password
```

### 2. Render

Render offers a free tier and easy deployment.

**Steps:**

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables

### 3. Heroku

**Steps:**

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Deploy: `git push heroku main`

### 4. DigitalOcean App Platform

**Steps:**

1. Connect your GitHub repository
2. Choose Node.js environment
3. Set build command: `npm install`
4. Set run command: `npm start`

## 🔧 Local Development

### Prerequisites

-   Node.js 16+
-   npm or yarn

### Setup

```bash
# Clone repository
git clone <your-repo-url>
cd pluginvault-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Testing

```bash
# Run tests
node test.js

# Test WebDAV connection
curl -u admin:password http://localhost:3000/webdav/plugins/
```

## 🌐 Production Configuration

### Environment Variables

Create a `.env` file or set these in your deployment platform:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://app--plugin-vault-be37ceb5.base44.app

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
WEBDAV_USERNAME=admin
WEBDAV_PASSWORD=your-secure-password

# Storage
PLUGINS_DIR=./plugins
MAX_FILE_SIZE=500MB

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Checklist

-   [ ] Change default credentials (`admin`/`password`)
-   [ ] Use HTTPS in production
-   [ ] Set up proper authentication
-   [ ] Configure file size limits
-   [ ] Set up monitoring and logging
-   [ ] Implement virus scanning for uploads
-   [ ] Set up automated backups

## 📁 File Structure

```
pluginvault-backend/
├── plugins/           # Plugin storage
│   ├── vst/
│   ├── vst3/
│   ├── au/
│   ├── aax/
│   └── standalone/
├── public/           # Admin interface
├── server.js         # Main server file
├── package.json
├── Dockerfile        # For containerized deployment
└── railway.json      # Railway configuration
```

## 🔗 Connection Methods

### macOS Finder

1. Open Finder
2. Press `Cmd + K`
3. Enter WebDAV URL: `https://your-domain.com/webdav/plugins`
4. Use credentials: `admin` / `password`

### Terminal (macOS)

```bash
# Mount WebDAV server
mount_webdav https://your-domain.com/webdav/plugins /Volumes/PluginVault
```

### WebDAV Clients

-   **Cyberduck**: Free, cross-platform
-   **FileZilla**: Free, good for large files
-   **Transmit**: macOS native, excellent performance

### API Access

```bash
# Health check
curl https://your-domain.com/api/health

# List plugins
curl https://your-domain.com/api/plugins

# Upload plugin
curl -X POST https://your-domain.com/api/plugins/upload \
  -F "plugin=@/path/to/plugin.vst3" \
  -F "type=vst3"
```

## 📊 Monitoring

### Health Checks

-   Endpoint: `/api/health`
-   Expected response: `{"status":"healthy",...}`

### Logs

Monitor these logs for issues:

-   Server startup
-   File uploads/downloads
-   Authentication attempts
-   Error messages

### Performance Metrics

-   File upload success rate
-   Response times
-   Storage usage
-   Concurrent connections

## 🔄 Updates and Maintenance

### Updating the Server

1. Pull latest changes: `git pull origin main`
2. Install dependencies: `npm install`
3. Restart server: `npm restart`

### Backup Strategy

-   Regular backups of the `plugins/` directory
-   Database backups (if using database)
-   Configuration backups

### Scaling Considerations

-   Use CDN for static files
-   Implement caching for frequently accessed plugins
-   Consider database for metadata storage
-   Set up load balancing for high traffic

## 🆘 Troubleshooting

### Common Issues

**Server won't start:**

-   Check Node.js version (requires 16+)
-   Verify all dependencies are installed
-   Check port availability

**WebDAV connection fails:**

-   Verify credentials
-   Check firewall settings
-   Ensure HTTPS is configured

**File uploads fail:**

-   Check file size limits
-   Verify disk space
-   Check file permissions

**CORS errors:**

-   Verify `FRONTEND_URL` environment variable
-   Check CORS configuration in server.js

### Getting Help

1. Check server logs for error messages
2. Test endpoints with curl
3. Verify environment variables
4. Check deployment platform status

## 📞 Support

For issues and questions:

-   Check the troubleshooting section
-   Review server logs
-   Test with the provided test script
-   Create an issue on GitHub

# Plugin Vault Backend

A WebDAV server for hosting audio production plugins (VST, VST3, AU, AAX, Standalone) that allows you to access your plugins from any studio via macOS.

## Features

-   🌐 **WebDAV Server**: Access plugins directly from macOS Finder
-   📁 **Plugin Organization**: Automatic categorization by plugin type
-   🔐 **Authentication**: Secure access with username/password
-   📊 **API Endpoints**: RESTful API for plugin management
-   🛡️ **Security**: Rate limiting, CORS, and security headers
-   📱 **Cross-Platform**: Works with any WebDAV client

## Supported Plugin Types

-   **VST** - Virtual Studio Technology
-   **VST3** - Virtual Studio Technology 3
-   **AU** - Audio Units (macOS)
-   **AAX** - Avid Audio eXtension
-   **Standalone** - Standalone applications

## Quick Start

### Prerequisites

-   Node.js 16+
-   npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd pluginvault-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Start the server:

```bash
npm run dev
```

The server will be available at:

-   **WebDAV**: `http://localhost:3000/webdav`
-   **API**: `http://localhost:3000/api`
-   **Admin**: `http://localhost:3000/admin`

## Usage

### Connecting from macOS

1. **Finder Method**:

    - Open Finder
    - Press `Cmd + K` (Connect to Server)
    - Enter: `http://localhost:3000/webdav`
    - Use credentials: `admin` / `password`

2. **Terminal Method**:

```bash
# Mount the WebDAV server
mount_webdav http://localhost:3000/webdav /Volumes/PluginVault
```

### API Endpoints

#### Health Check

```bash
GET /api/health
```

#### List All Plugins

```bash
GET /api/plugins
```

#### Upload Plugin

```bash
POST /api/plugins/upload
Content-Type: application/json

{
  "type": "vst3",
  "name": "my-plugin.vst3",
  "data": "base64-encoded-file-data"
}
```

#### Delete Plugin

```bash
DELETE /api/plugins/vst3/my-plugin.vst3
```

## Directory Structure

```
pluginvault-backend/
├── plugins/
│   ├── vst/
│   ├── vst3/
│   ├── au/
│   ├── aax/
│   └── standalone/
├── server.js
├── package.json
└── README.md
```

## Deployment

### Local Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Recommended Deployment Platforms

1. **Railway** (Recommended for audio files):

    - Easy deployment
    - Good for large files
    - Automatic HTTPS

2. **Render**:

    - Free tier available
    - Good performance
    - Easy setup

3. **Heroku**:

    - Reliable
    - Good documentation
    - Add-ons available

4. **DigitalOcean App Platform**:
    - Scalable
    - Good for production
    - Reasonable pricing

### Environment Variables

Set these in your deployment platform:

```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://app--plugin-vault-be37ceb5.base44.app
JWT_SECRET=your-production-secret
WEBDAV_USERNAME=your-username
WEBDAV_PASSWORD=your-secure-password
```

## Security Considerations

-   Change default credentials in production
-   Use HTTPS in production
-   Implement proper authentication
-   Consider adding database for user management
-   Set up proper file size limits
-   Implement virus scanning for uploaded files

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check `FRONTEND_URL` in `.env`
2. **File Upload Fails**: Check file size limits
3. **WebDAV Connection Fails**: Verify credentials and URL
4. **Permission Denied**: Check file permissions in plugins directory

### Logs

Check server logs for detailed error information:

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

-   Create an issue on GitHub
-   Check the troubleshooting section
-   Review the API documentation

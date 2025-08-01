const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const dotenv = require('dotenv');
const { WebDAVServer, v2 } = require('webdav-server');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for WebDAV compatibility
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://app--plugin-vault-be37ceb5.base44.app',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create plugins directory if it doesn't exist
const pluginsDir = path.join(__dirname, 'plugins');
fs.ensureDirSync(pluginsDir);

// Create subdirectories for different plugin types
const pluginTypes = ['vst', 'vst3', 'au', 'aax', 'standalone'];
pluginTypes.forEach(type => {
  fs.ensureDirSync(path.join(pluginsDir, type));
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || 'vst';
    const typeDir = path.join(pluginsDir, type);
    fs.ensureDirSync(typeDir);
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Create WebDAV server
const webdavServer = new WebDAVServer({
  httpAuthentication: new v2.HTTPDigestAuthentication('Plugin Vault', {
    'admin': 'password'
  }),
  autoLoad: false,
  autoSave: false
});

// Mount the plugins directory
webdavServer.setFileSystem('/plugins', new v2.PhysicalFileSystem(pluginsDir));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    pluginTypes: pluginTypes,
    totalPlugins: getPluginCount()
  });
});

// Get plugin statistics
function getPluginCount() {
  let total = 0;
  pluginTypes.forEach(type => {
    const typeDir = path.join(pluginsDir, type);
    if (fs.existsSync(typeDir)) {
      const files = fs.readdirSync(typeDir);
      total += files.length;
    }
  });
  return total;
}

// Get all plugins
app.get('/api/plugins', (req, res) => {
  try {
    const plugins = {};
    pluginTypes.forEach(type => {
      const typeDir = path.join(pluginsDir, type);
      if (fs.existsSync(typeDir)) {
        const files = fs.readdirSync(typeDir);
        plugins[type] = files.map(file => ({
          name: file,
          path: `/plugins/${type}/${file}`,
          size: fs.statSync(path.join(typeDir, file)).size,
          modified: fs.statSync(path.join(typeDir, file)).mtime
        }));
      } else {
        plugins[type] = [];
      }
    });
    res.json(plugins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve plugins' });
  }
});

// Upload plugin via multipart form
app.post('/api/plugins/upload', upload.single('plugin'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const type = req.body.type || 'vst';
    if (!pluginTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid plugin type' });
    }
    
    res.json({ 
      message: 'Plugin uploaded successfully',
      path: `/plugins/${type}/${req.file.originalname}`,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload plugin' });
  }
});

// Upload plugin via base64 data
app.post('/api/plugins/upload-base64', async (req, res) => {
  try {
    const { type, name, data } = req.body;
    
    if (!pluginTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid plugin type' });
    }
    
    const filePath = path.join(pluginsDir, type, name);
    const buffer = Buffer.from(data, 'base64');
    
    await fs.writeFile(filePath, buffer);
    
    res.json({ 
      message: 'Plugin uploaded successfully',
      path: `/plugins/${type}/${name}`,
      size: buffer.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload plugin' });
  }
});

// Delete plugin
app.delete('/api/plugins/:type/:name', async (req, res) => {
  try {
    const { type, name } = req.params;
    
    if (!pluginTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid plugin type' });
    }
    
    const filePath = path.join(pluginsDir, type, name);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    await fs.remove(filePath);
    res.json({ message: 'Plugin deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete plugin' });
  }
});

// WebDAV endpoint
app.use('/webdav', (req, res) => {
  webdavServer.executeRequest(req, res);
});

// Serve static files (for admin interface)
app.use('/admin', express.static(path.join(__dirname, 'public')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Plugin Vault Server running on port ${PORT}`);
  console.log(`📁 Plugins directory: ${pluginsDir}`);
  console.log(`🌐 WebDAV endpoint: http://localhost:${PORT}/webdav`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
  console.log(`🔧 Admin interface: http://localhost:${PORT}/admin`);
  console.log(`🔐 WebDAV credentials: admin / password`);
});

module.exports = app; 
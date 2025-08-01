const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const dotenv = require('dotenv');
const methodOverride = require('method-override');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware - DISABLE for WebDAV compatibility
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  dnsPrefetchControl: false,
  frameguard: false,
  hidePoweredBy: false,
  hsts: false,
  ieNoOpen: false,
  noSniff: false,
  permittedCrossDomainPolicies: false,
  referrerPolicy: false,
  xssFilter: false
}));

// CORS - Allow all origins for WebDAV
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'HEAD', 'OPTIONS', 'PROPFIND', 'PUT', 'DELETE', 'MKCOL', 'COPY', 'MOVE', 'LOCK', 'UNLOCK'],
  allowedHeaders: ['*']
}));

// Method override for WebDAV methods
app.use(methodOverride('_method'));

// Rate limiting with proper configuration for proxy
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true
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

// WebDAV authentication middleware
app.use('/webdav', (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== 'Basic YWRtaW46cGFzc3dvcmQ=') { // admin:password
    res.setHeader('WWW-Authenticate', 'Basic realm="Plugin Vault"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
});

// WebDAV OPTIONS request - CRITICAL for macOS Finder
app.options('/webdav/*', (req, res) => {
  // Set all required headers for macOS Finder
  res.setHeader('Allow', 'GET, HEAD, OPTIONS, PROPFIND, PUT, DELETE, MKCOL, COPY, MOVE, LOCK, UNLOCK');
  res.setHeader('DAV', '1, 2');
  res.setHeader('MS-Author-Via', 'DAV');
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Server', 'Plugin Vault WebDAV Server');
  res.status(200).end();
});

// WebDAV OPTIONS request for root
app.options('/webdav', (req, res) => {
  res.setHeader('Allow', 'GET, HEAD, OPTIONS, PROPFIND, PUT, DELETE, MKCOL, COPY, MOVE, LOCK, UNLOCK');
  res.setHeader('DAV', '1, 2');
  res.setHeader('MS-Author-Via', 'DAV');
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Server', 'Plugin Vault WebDAV Server');
  res.status(200).end();
});

// WebDAV HEAD request
app.head('/webdav/*', (req, res) => {
  const urlPath = req.url.replace('/webdav', '').replace(/^\/+/, '');
  const filePath = path.join(pluginsDir, urlPath);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).end();
  }
  
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Last-Modified', stat.mtime.toUTCString());
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('DAV', '1, 2');
  res.status(200).end();
});

// WebDAV HEAD request for root
app.head('/webdav', (req, res) => {
  const stat = fs.statSync(pluginsDir);
  res.setHeader('Content-Length', '0');
  res.setHeader('Last-Modified', stat.mtime.toUTCString());
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('DAV', '1, 2');
  res.status(200).end();
});

// WebDAV PROPFIND request for root - STANDARD METHOD
app.propfind('/webdav', (req, res) => {
  const stat = fs.statSync(pluginsDir);
  const files = fs.readdirSync(pluginsDir);
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/webdav</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:getlastmodified>${stat.mtime.toUTCString()}</D:getlastmodified>
        <D:getcontentlength>0</D:getcontentlength>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  ${files.map(file => {
    const fullPath = path.join(pluginsDir, file);
    const fileStat = fs.statSync(fullPath);
    const isDirectory = fileStat.isDirectory();
    return `<D:response>
    <D:href>/webdav/${file}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>${isDirectory ? '<D:collection/>' : ''}</D:resourcetype>
        <D:getcontentlength>${isDirectory ? '0' : fileStat.size}</D:getcontentlength>
        <D:getlastmodified>${fileStat.mtime.toUTCString()}</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
  }).join('')}
</D:multistatus>`;
  
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('DAV', '1, 2');
  res.setHeader('Allow', 'GET, HEAD, OPTIONS, PROPFIND, PUT, DELETE, MKCOL, COPY, MOVE, LOCK, UNLOCK');
  res.status(207).send(xml);
});

// WebDAV PROPFIND request (directory listing) - STANDARD METHOD
app.propfind('/webdav/*', (req, res) => {
  const urlPath = req.url.replace('/webdav', '').replace(/^\/+/, '');
  const filePath = path.join(pluginsDir, urlPath);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(filePath);
    const baseUrl = req.url.replace(/\/+$/, ''); // Remove trailing slashes
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${baseUrl}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:getlastmodified>${stat.mtime.toUTCString()}</D:getlastmodified>
        <D:getcontentlength>0</D:getcontentlength>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  ${files.map(file => {
    const fullPath = path.join(filePath, file);
    const fileStat = fs.statSync(fullPath);
    const isDirectory = fileStat.isDirectory();
    return `<D:response>
    <D:href>${baseUrl}/${file}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>${isDirectory ? '<D:collection/>' : ''}</D:resourcetype>
        <D:getcontentlength>${isDirectory ? '0' : fileStat.size}</D:getcontentlength>
        <D:getlastmodified>${fileStat.mtime.toUTCString()}</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
  }).join('')}
</D:multistatus>`;
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('DAV', '1, 2');
    res.setHeader('Allow', 'GET, HEAD, OPTIONS, PROPFIND, PUT, DELETE, MKCOL, COPY, MOVE, LOCK, UNLOCK');
    res.status(207).send(xml);
  } else {
    res.status(404).json({ error: 'Not a directory' });
  }
});

// Fallback: Handle PROPFIND as POST request (for platforms that block PROPFIND)
app.post('/webdav', (req, res) => {
  if (req.headers['x-http-method-override'] === 'PROPFIND') {
    const stat = fs.statSync(pluginsDir);
    const files = fs.readdirSync(pluginsDir);
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/webdav</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:getlastmodified>${stat.mtime.toUTCString()}</D:getlastmodified>
        <D:getcontentlength>0</D:getcontentlength>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  ${files.map(file => {
    const fullPath = path.join(pluginsDir, file);
    const fileStat = fs.statSync(fullPath);
    const isDirectory = fileStat.isDirectory();
    return `<D:response>
    <D:href>/webdav/${file}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>${isDirectory ? '<D:collection/>' : ''}</D:resourcetype>
        <D:getcontentlength>${isDirectory ? '0' : fileStat.size}</D:getcontentlength>
        <D:getlastmodified>${fileStat.mtime.toUTCString()}</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
  }).join('')}
</D:multistatus>`;
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('DAV', '1, 2');
    res.setHeader('Allow', 'GET, HEAD, OPTIONS, PROPFIND, PUT, DELETE, MKCOL, COPY, MOVE, LOCK, UNLOCK');
    res.status(207).send(xml);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});

// WebDAV GET request for root
app.get('/webdav', (req, res) => {
  // Check if this is a WebDAV request
  if (req.headers['x-webdav-request'] === 'true' || req.headers['depth']) {
    const stat = fs.statSync(pluginsDir);
    const files = fs.readdirSync(pluginsDir);
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/webdav</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:getlastmodified>${stat.mtime.toUTCString()}</D:getlastmodified>
        <D:getcontentlength>0</D:getcontentlength>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  ${files.map(file => {
    const fullPath = path.join(pluginsDir, file);
    const fileStat = fs.statSync(fullPath);
    const isDirectory = fileStat.isDirectory();
    return `<D:response>
    <D:href>/webdav/${file}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>${isDirectory ? '<D:collection/>' : ''}</D:resourcetype>
        <D:getcontentlength>${isDirectory ? '0' : fileStat.size}</D:getcontentlength>
        <D:getlastmodified>${fileStat.mtime.toUTCString()}</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
  }).join('')}
</D:multistatus>`;
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('DAV', '1, 2');
    res.setHeader('Allow', 'GET, HEAD, OPTIONS, PROPFIND, PUT, DELETE, MKCOL, COPY, MOVE, LOCK, UNLOCK');
    res.status(207).send(xml);
  } else {
    // Regular GET request - return JSON
    const files = fs.readdirSync(pluginsDir);
    const fileList = files.map(file => {
      const fullPath = path.join(pluginsDir, file);
      const fileStat = fs.statSync(fullPath);
      return {
        name: file,
        size: fileStat.size,
        isDirectory: fileStat.isDirectory(),
        modified: fileStat.mtime
      };
    });
    res.setHeader('DAV', '1, 2');
    res.json(fileList);
  }
});

// WebDAV GET request for subdirectories
app.get('/webdav/*', (req, res) => {
  const urlPath = req.url.replace('/webdav', '').replace(/^\/+/, '');
  const filePath = path.join(pluginsDir, urlPath);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    // Check if this is a WebDAV request
    if (req.headers['x-webdav-request'] === 'true' || req.headers['depth']) {
      const files = fs.readdirSync(filePath);
      const baseUrl = req.url.replace(/\/+$/, ''); // Remove trailing slashes
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${baseUrl}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:getlastmodified>${stat.mtime.toUTCString()}</D:getlastmodified>
        <D:getcontentlength>0</D:getcontentlength>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  ${files.map(file => {
    const fullPath = path.join(filePath, file);
    const fileStat = fs.statSync(fullPath);
    const isDirectory = fileStat.isDirectory();
    return `<D:response>
    <D:href>${baseUrl}/${file}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>${isDirectory ? '<D:collection/>' : ''}</D:resourcetype>
        <D:getcontentlength>${isDirectory ? '0' : fileStat.size}</D:getcontentlength>
        <D:getlastmodified>${fileStat.mtime.toUTCString()}</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
  }).join('')}
</D:multistatus>`;
      
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('DAV', '1, 2');
      res.setHeader('Allow', 'GET, HEAD, OPTIONS, PROPFIND, PUT, DELETE, MKCOL, COPY, MOVE, LOCK, UNLOCK');
      res.status(207).send(xml);
    } else {
      // Regular GET request - return JSON
      const files = fs.readdirSync(filePath);
      const fileList = files.map(file => {
        const fullPath = path.join(filePath, file);
        const fileStat = fs.statSync(fullPath);
        return {
          name: file,
          size: fileStat.size,
          isDirectory: fileStat.isDirectory(),
          modified: fileStat.mtime
        };
      });
      res.setHeader('DAV', '1, 2');
      res.json(fileList);
    }
  } else {
    // Serve file with proper headers
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('DAV', '1, 2');
    res.download(filePath);
  }
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
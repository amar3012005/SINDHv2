require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.MCP_PORT || 5001;
const TARGET_API = process.env.API_URL || 'http://localhost:5000';
const LOG_DIR = path.join(__dirname, 'mcp-logs');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Create log stream
const accessLogStream = fs.createWriteStream(
  path.join(LOG_DIR, 'access.log'),
  { flags: 'a' }
);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(morgan('combined', { stream: accessLogStream }));

// Request logging middleware
app.use((req, res, next) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  };
  
  console.log('\n=== MCP Request ===');
  console.log(`[${logData.timestamp}] ${logData.method} ${logData.url}`);
  console.log('Headers:', JSON.stringify(logData.headers, null, 2));
  console.log('Query:', JSON.stringify(logData.query, null, 2));
  console.log('Body:', JSON.stringify(logData.body, null, 2));
  
  // Save to request log
  fs.appendFileSync(
    path.join(LOG_DIR, 'requests.log'),
    JSON.stringify(logData, null, 2) + '\n\n',
    { flag: 'a' }
  );
  
  next();
});

// Proxy configuration
const apiProxy = createProxyMiddleware({
  target: TARGET_API,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // Remove /api prefix if needed
  },
  onProxyReq: (proxyReq, req, res) => {
    // Log proxy request
    console.log('\n=== Proxying Request ===');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${TARGET_API}${req.originalUrl}`);
    
    // Log request body for POST/PUT requests
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log response status
    console.log('\n=== Received Response ===');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`);
    
    // Log response headers
    console.log('Response Headers:', JSON.stringify(proxyRes.headers, null, 2));
    
    // Log response body
    let body = [];
    proxyRes.on('data', (chunk) => {
      body.push(chunk);
    });
    
    proxyRes.on('end', () => {
      try {
        const responseBody = Buffer.concat(body).toString();
        console.log('Response Body:', responseBody);
        
        // Save response to log file
        const logEntry = {
          timestamp: new Date().toISOString(),
          statusCode: proxyRes.statusCode,
          method: req.method,
          url: req.originalUrl,
          response: responseBody ? JSON.parse(responseBody) : {},
          headers: proxyRes.headers
        };
        
        fs.appendFileSync(
          path.join(LOG_DIR, 'responses.log'),
          JSON.stringify(logEntry, null, 2) + '\n\n',
          { flag: 'a' }
        );
      } catch (error) {
        console.error('Error logging response:', error);
      }
    });
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({
      error: 'Proxy Error',
      message: err.message
    });
  }
});

// Apply proxy to all API routes
app.use('/api', apiProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'MCP Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('MCP Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n=== MCP Debug Server Running ===`);
  console.log(`MCP Server URL: http://localhost:${PORT}`);
  console.log(`Proxying to: ${TARGET_API}`);
  console.log(`Logs directory: ${LOG_DIR}`);
  console.log(`\nTo use this server:`);
  console.log(`1. Update your frontend's base URL to: http://localhost:${PORT}/api`);
  console.log('2. All API requests will be logged to the console and log files');
  console.log('3. Check the mcp-logs directory for detailed request/response logs');
  console.log('\nPress Ctrl+C to stop the server\n');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n=== Stopping MCP Server ===');
  process.exit(0);
});

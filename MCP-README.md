# MCP (Master Control Program) Debug Server

A debugging proxy server for the SINDH platform that logs all API requests and responses between the frontend and backend.

## Features

- 🚀 Proxies all API requests to your backend server
- 📝 Logs detailed request/response information
- 🔍 Inspect headers, bodies, and query parameters
- 💾 Saves logs to files for later analysis
- 🛠️ Easy to integrate with existing frontend

## Prerequisites

- Node.js 14+ installed
- npm or yarn package manager
- Backend server running (default: http://localhost:5000)

## Installation

1. Install dependencies:
   ```bash
   npm install express cors morgan http-proxy-middleware dotenv
   ```

2. Create a `.env` file in the project root:
   ```env
   MCP_PORT=5001
   API_URL=http://localhost:5000
   NODE_ENV=development
   ```

## Usage

1. Start the MCP server:
   ```bash
   node mcp-server.js
   ```

2. Update your frontend's API base URL to point to the MCP server:
   ```javascript
   // Example for axios
   const api = axios.create({
     baseURL: 'http://localhost:5001/api',
     // other config...
   });
   ```

3. Make API requests as usual - all traffic will be logged to the console and files.

## Logs Directory

Logs are stored in the `mcp-logs/` directory:

- `access.log` - Standard HTTP access logs
- `requests.log` - Detailed request information
- `responses.log` - Detailed response information

## Configuration

Environment variables:

- `MCP_PORT` - Port to run the MCP server on (default: 5001)
- `API_URL` - URL of your backend API (default: http://localhost:5000)
- `NODE_ENV` - Set to 'production' to disable detailed logging

## Example Output

```
=== MCP Request ===
[2023-10-15T12:34:56.789Z] POST /api/auth/login
Headers: {"host":"localhost:5001", ...}
Body: {"email":"user@example.com","password":"********"}

=== Proxying Request ===
[2023-10-15T12:34:56.790Z] POST /api/auth/login -> http://localhost:5000/api/auth/login

=== Received Response ===
[2023-10-15T12:34:56.900Z] POST /api/auth/login -> 200
Response Headers: {"content-type":"application/json", ...}
Response Body: {"token":"...","user":{...}}
```

## Tips

- Check the console output for real-time debugging
- Use the log files for analyzing historical requests
- The MCP server can be left running during development
- Add custom middleware in `mcp-server.js` for additional functionality

## License

MIT

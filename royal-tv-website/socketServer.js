/**
 * 📂 socketServer.js
 * ----------------------------------------
 * 🔧 Entry-point for initializing and running your dedicated Socket.IO server.
 *
 * ✅ Handles:
 *   - Environment configuration via dotenv.
 *   - Dynamic HTTP/HTTPS server setup depending on environment.
 *   - Secure CORS configuration for client origins.
 *   - Initialization and configuration of Socket.IO instance.
 *   - Optional admin UI setup for socket management.
 *   - Global state management (online users, active rooms).
 *   - Modular connection handling via `connectionHandler`.
 */
// Load environment variables safely
import dotenv from 'dotenv';
dotenv.config();

// HTTP and HTTPS modules for server setup
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';

// File system access for reading certificate files
import { readFileSync, existsSync } from 'fs';

// Socket.IO for real-time communication
import { Server } from 'socket.io';

// Prisma for database interaction
import { PrismaClient } from '@prisma/client';

// Optional admin UI for monitoring and managing Socket.IO
import { instrument } from '@socket.io/admin-ui';

// Modular handler to manage connections and socket events
import connectionHandler from './src/socket/connectionHandler.js';

// Initialize Prisma client (for database queries)
const prisma = new PrismaClient();

// Determine environment mode (production or development)
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';
const PORT = process.env.SOCKET_PORT || 3001;

// Paths for TLS certificates in production (HTTPS)
const CERT_PATH = process.env.TLS_CERT_PATH || '/etc/letsencrypt/live/royal-tv.tv';
const keyFile = `${CERT_PATH}/privkey.pem`;
const certFile = `${CERT_PATH}/fullchain.pem`;

// Server setup based on environment and available TLS certificates
let server, protocol;

if (isProd && existsSync(keyFile) && existsSync(certFile)) {
  // HTTPS setup for secure production environment
  protocol = 'https';
  server = createHttpsServer({
    key: readFileSync(keyFile),
    cert: readFileSync(certFile)
  });
  console.log('🔐 Running in HTTPS mode');
} else {
  // Fallback to HTTP for development or missing certificates
  protocol = 'http';
  server = createHttpServer();
  console.log(
    isProd ? '⚠️ TLS certs missing; running in HTTP mode' : '⚙️ Running in HTTP (development mode)'
  );
}

// Configure allowed origins for security (CORS)
const defaultOrigin = isProd ? 'https://royal-tv.tv' : 'http://localhost:3000';
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS || defaultOrigin)
  .split(',')
  .map((o) => o.trim());

console.log('🌐 Allowed origins for CORS:', CLIENT_ORIGINS);

// Initialize Socket.IO server
const io = new Server(server, {
  path: '/socket.io',
  cors: { origin: CLIENT_ORIGINS, credentials: true }
});

// Optional: Configure Socket.IO Admin UI for debugging and management
if (process.env.ENABLE_ADMIN_UI === 'true') {
  instrument(io, {
    auth: {
      type: 'basic',
      username: process.env.SOCKET_ADMIN_USER,
      password: process.env.SOCKET_ADMIN_PASS
    },
    mode: isProd ? 'production' : 'development'
  });
  console.log('🔧 Admin UI is enabled');
} else {
  console.log('🔒 Admin UI is disabled');
}

// Define global state object to keep track of user statuses and rooms
const globalState = {
  onlineUsers: {},
  activeUsersInRoom: {},
  activeUsersInBubbleRoom: {}
};

// Server identification (for logging clarity)
const runningServer = isProd ? 'royal-tv.tv' : 'localhost';

// Handle new socket connections
io.on('connection', (socket) => {
  connectionHandler(io, socket, prisma, globalState);

  // Initial data handling moved into modular event handlers for clarity and organization
});

// Start the server and listen on specified port
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO running on ${protocol}://${runningServer}:${PORT} [${NODE_ENV}]`);
});

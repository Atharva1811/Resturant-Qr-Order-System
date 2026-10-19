import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { socketService } from './services/socket.service.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO with server
socketService.initialize(server);

server.listen(config.port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Servora QR Backend running on port ${config.port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📡 Socket.IO Real-time Engine active`);
  console.log(`📨 Brevo Transactional Email: ${config.brevo.apiKey ? 'Configured' : 'Dev Mock Mode Active'}`);
  console.log(`======================================================\n`);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    console.log('HTTP and Socket.IO server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

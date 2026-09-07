import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { initSocketIO } from './sockets';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO on HTTP Server
initSocketIO(server);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`\n=================================================`);
  console.log(`🚀 ProjectX API Server running on port ${config.port} (0.0.0.0)`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🤖 AI Microservice URL: ${config.aiServiceUrl}`);
  console.log(`=================================================\n`);
});

export { server, app };

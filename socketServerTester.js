import logger from '@/lib/core/logger';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*', credentials: false }
});

instrument(io, { auth: false });

io.on('connection', (socket) => {
  logger.log('Connected:', socket.id);
});

const PORT = 4001;
httpServer.listen(PORT, () => {
  logger.log(`Socket.IO server running at http://localhost:${PORT}`);
  logger.log(`Admin UI: http://localhost:${PORT}/admin`);
});

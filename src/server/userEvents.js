// 👥 src/server/events/userEvents.js
/**
 * registerUserEvents
 * ------------------
 * Tracks global online-users and cleans up on disconnect.
 */
import logger from '../lib/core/logger.js';

export default function registerUserEvents(io, socket, globalState) {
  // Client asks for full online list
  socket.on('request_online_users', () => {
    socket.emit('online_users_update', Object.values(globalState.onlineUsers));
  });

  // On disconnect, remove from all lists & broadcast
  socket.on('disconnect', () => {
    const { user_id, name } = socket.userData;
    delete globalState.onlineUsers[user_id];
    io.emit('online_users_update', Object.values(globalState.onlineUsers));

    // Remove from all live rooms
    for (const room of Object.keys(globalState.activeUsersInLiveRoom)) {
      globalState.activeUsersInLiveRoom[room] = globalState.activeUsersInLiveRoom[room].filter(
        (activeUsers) => activeUsers.user_id !== user_id
      );
      io.to(room).emit('room_users_update', {
        conversation_id: room,
        users: globalState.activeUsersInLiveRoom[room]
      });
    }

    logger.log(`❌ Disconnected: ${name}`);
  });
}

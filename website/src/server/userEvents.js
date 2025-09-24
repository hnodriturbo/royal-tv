/**
 * ========== src/server/events/userEvents.js ==========
 *
 * 👥 User/presence helpers (NO disconnect binding here).
 *
 * 🧠 Purpose:
 *  • Serve on-demand presence snapshots to the client
 *
 */
export default function registerUserEvents(io, socket, globalState) {
  // 🙋 Client asks for full online list (DEV: open to all for now)
  socket.on('request_online_users', () => {
    // 📤 Send as-is array (already de-duped on connect)
    socket.emit('online_users_update', globalState.onlineUsers);

    // 🔒 TODO: Gate this to admins only later:
    // if (socket.userData?.role !== 'admin') { socket.emit('online_users_error', { error: 'forbidden' }); return; }
    // io.to('admins').emit('online_users_update', globalState.onlineUsers);
  });
}

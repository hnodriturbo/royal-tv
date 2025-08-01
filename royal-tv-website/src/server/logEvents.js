/**
 * =========================================
 * /src/server/logEvents.js
 * -----------------------------------------
 * Socket.IO event handler for logging page
 * visits to the Prisma Log table. Handles
 * both users and guests, autofills fields
 * from socket context for security.
 * =========================================
 */

import prisma from '../lib/prisma.js'; // 🗄️ Prisma client
console.log('🔍 Prisma check:', prisma);

export default function registerLogEvents(io, socket) {
  // 🪵 Log every page visit received from the client
  socket.on('log_page_visit', async (payload) => {
    try {
      // 👤 Get user or guest info from socket context
      const { user_id, role } = socket.userData || {};
      const guest_id = role === 'guest' ? user_id : null;
      const ip_address =
        socket.handshake.headers['x-forwarded-for']?.split(',')[0] || socket.handshake.address;
      const userAgent = socket.handshake.headers['user-agent'];

      // 📋 Create log entry in DB
      await prisma.log.create({
        data: {
          user_id: role !== 'guest' ? user_id : null, // 🧑‍💻 Only set for real users
          guest_id: guest_id || null, // 🕵️ Set for guests
          event: payload.event || 'page_visit', // 🏷️ What happened
          page: payload.page, // 🌍 Which page
          description: payload.description || null, // ✍️ Description from frontend
          ip_address, // 🖥️ Real IP (from backend only)
          userAgent // 🧭 Browser info
        }
      });

      // 🟢 Optionally, emit a confirmation to client
      // socket.emit("page_logged", { success: true });

      // 📋 Debug log
      if (process.env.SOCKET_LOGS === 'true') {
        console.log(
          `🪵 [SOCKET] ${role} ${user_id || guest_id} visited ${payload.page} (${payload.description})`
        );
      }
    } catch (err) {
      console.error('❌ [SOCKET] Error logging page visit:', err);
    }
  });
}

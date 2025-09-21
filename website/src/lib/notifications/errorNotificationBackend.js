/* 🧩 Helper: Notify admins about failures via socket server */
/**
 * ==================== errorNotificationBackend.js ====================
 * 🔔 Backend Error Notification Helper
 * - Sends error notifications from backend scripts or API routes
 * - Uses socketServer's HTTP bridge (POST /emit/errorNotification)
 * - Sends to admin only, user only, or both
 * =====================================================================
 */

import axios from 'axios';

function buildErrorPayload(errorTitle, errorMessage, errorDetails) {
  return {
    errorTitle: String(errorTitle || 'Unspecified Error Title'),
    errorMessage: String(errorMessage || 'Unspecified error message'),
    errorDetails: String(errorDetails || '')
  };
}

/**
 * Send error notification to socket server bridge
 * @param {'admin'|'user'|'both'} target
 * @param {Object} userLike - must include user_id, name
 * @param {string} errorTitle
 * @param {string} errorMessage
 * @param {string} errorDetails
 */
export async function sendBackendErrorNotification(
  target,
  userLike,
  errorTitle,
  errorMessage,
  errorDetails
) {
  const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';
  const payload = {
    target,
    user: userLike,
    error: buildErrorPayload(errorTitle, errorMessage, errorDetails)
  };

  try {
    await axios.post(`${SOCKET_SERVER_URL}/emit/errorNotification`, payload);
    console.log(`📡 Backend error notification sent → ${target}`);
  } catch (err) {
    console.error('❌ Failed to send backend error notification:', err.message);
  }
}

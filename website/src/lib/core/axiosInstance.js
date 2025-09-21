/**
 *   ========================= axiosInstance.js =========================
 * 🛰️
 * PROJECT AXIOS INSTANCE – PRODUCTION READY
 * - Sets baseURL from env (default: localhost for dev)
 * - Adds Authorization, x-user-id, x-sender-id to every request (if available)
 * - Handles error logging cleanly in prod/dev
 * =====================================================================
 */
import axios from 'axios';
import { getSession } from 'next-auth/react';

// 🌐 Create Axios instance with base config
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AXIOS_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 🛡️ Request Interceptor: Adds auth and custom user headers
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // 👤 Get session for user and token info
      const session = await getSession();

      // 🔑 Add Authorization header if token exists
      if (session?.user?.token) {
        config.headers.Authorization = `Bearer ${session.user.token}`;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Axios] Auth header set:', config.headers.Authorization);
        }
      }

      // 🆔 Always add x-user-id and x-sender-id if available
      if (session?.user?.user_id) {
        config.headers['x-user-id'] = session.user.user_id;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Axios] x-user-id set:', session.user.user_id);
        }
      }
      if (session?.user?.sender_id) {
        config.headers['x-sender-id'] = session.user.sender_id;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Axios] x-sender-id set:', session.user.sender_id);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Axios Request Interceptor Error]', error.message);
      }
      // In prod, optionally send this to your error logger (e.g., Sentry)
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Axios Request Interceptor] Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// 🚦 Response Interceptor: Handles all responses & errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Axios Error]', error);
    return Promise.reject(error);
  }
);

export default axiosInstance;

/**
 * =================== useNotifyCustomErrors.js ===================
 * 🔔
 * Royal TV – Custom Error Notification Helpers (Frontend)
 * - Only for special, explicit errors you craft yourself.
 * - Always uses { errorTitle, errorMessage, errorDetails }.
 * - Sends to: Admin only, User only, or Both.
 * ================================================================
 */

'use client'; // 🧭 Hook runs on client

import { useCallback } from 'react';
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications';

// 🧱 Builder: always returns the exact error shape your templates expect
function buildNotificationError(errorTitle, errorMessage, errorDetails) {
  // 🧼 Guard against undefined values while staying explicit
  return {
    errorTitle: String(errorTitle || 'Unspecified Error Title'),
    errorMessage: String(errorMessage || 'Unspecified error message'),
    errorDetails: String(errorDetails || '')
  };
}

export function useNotifyCustomErrors() {
  // 🎛️ Pull the three creators from your existing notifications hook
  const {
    createAdminErrorNotification,
    createUserErrorNotification,
    createErrorNotificationForBoth
  } = useCreateNotifications();

  // 🦸 Admin-only (object-in)
  const notifyAdminCustomError = useCallback(
    (userLike, customErrorObject) => {
      // 📨 Fire as-is; you promised to always pass the correct shape
      createAdminErrorNotification(userLike, customErrorObject);
    },
    [createAdminErrorNotification]
  );

  // 👤 User-only (object-in)
  const notifyUserCustomError = useCallback(
    (userLike, customErrorObject) => {
      createUserErrorNotification(userLike, customErrorObject);
    },
    [createUserErrorNotification]
  );

  // 🤝 Both (object-in)
  const notifyBothCustomError = useCallback(
    (userLike, customErrorObject) => {
      createErrorNotificationForBoth(userLike, customErrorObject);
    },
    [createErrorNotificationForBoth]
  );

  // 🦸 Admin-only (args-in convenience)
  const notifyAdminCustomErrorFromArgs = useCallback(
    (userLike, errorTitle, errorMessage, errorDetails) => {
      const payload = buildNotificationError(errorTitle, errorMessage, errorDetails);
      createAdminErrorNotification(userLike, payload);
    },
    [createAdminErrorNotification]
  );

  // 👤 User-only (args-in convenience)
  const notifyUserCustomErrorFromArgs = useCallback(
    (userLike, errorTitle, errorMessage, errorDetails) => {
      const payload = buildNotificationError(errorTitle, errorMessage, errorDetails);
      createUserErrorNotification(userLike, payload);
    },
    [createUserErrorNotification]
  );

  // 🤝 Both (args-in convenience)
  const notifyBothCustomErrorFromArgs = useCallback(
    (userLike, errorTitle, errorMessage, errorDetails) => {
      const payload = buildNotificationError(errorTitle, errorMessage, errorDetails);
      createErrorNotificationForBoth(userLike, payload);
    },
    [createErrorNotificationForBoth]
  );

  // 🛎️ Public API – pick the style you prefer (object-in or args-in)
  return {
    // 📦 Object-in versions
    notifyAdminCustomError,
    notifyUserCustomError,
    notifyBothCustomError,

    // ✍️ Args-in versions (quick one-liners)
    notifyAdminCustomErrorFromArgs,
    notifyUserCustomErrorFromArgs,
    notifyBothCustomErrorFromArgs,

    // 🧱 Export the builder in case you want to prebuild an object elsewhere
    buildNotificationError
  };
}

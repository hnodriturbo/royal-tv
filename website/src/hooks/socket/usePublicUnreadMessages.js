/**
 * ============== usePublicUnreadMessages (client) ==============
 * 🔔 Live unread counters for public chat
 * --------------------------------------------------------------
 * Args:
 *   • public_conversation_id?: string   // per-room user count (badge)
 *   • adminGlobal?: boolean             // admin sees global count
 *
 * Returns:
 *   • unreadCount: number
 *   • markAllPublicRead(): void         // marks room as read (if id given)
 *
 * Behavior:
 *   • When mounted with a room id: auto-mark read once (can be removed).
 *   • Listens for push updates from the server after sends/reads/deletes.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

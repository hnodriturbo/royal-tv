/**
 * ============== usePublicTypingIndicator (client) ==============
 * ⌨️ Typing indicator for a public room (remote + local)
 * --------------------------------------------------------------
 * Args:
 *   • public_conversation_id: string
 *
 * Returns:
 *   • isSomeoneTyping: boolean
 *   • typingUserInfo: { name, role, user_id?, public_identity_id? } | null
 *   • isTypingLocal: boolean
 *   • handleInputChange(e): string
 *   • handleInputFocus()
 *   • handleInputBlur()
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

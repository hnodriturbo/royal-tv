/* // File: src/app/api/auth/[...nextauth]/route.js
import { handlers } from '@/lib/core/auth';

export const GET = handlers.GET;
export const POST = handlers.POST;
 */

// src/app/api/auth/[...nextauth]/route.js
// 🧪 Minimal bridge: re-export handlers only — NO top-level work!

export { GET, POST } from '@/lib/core/auth';

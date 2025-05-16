'use client';

import useAuthGuard from '@/hooks/useAuthGuard';

// ✅ AuthGuard component that blocks access unless the user has correct role
const AuthGuard = ({ role, children }) => {
  const { isAllowed } = useAuthGuard(role);

  // 🔒 Block rendering if user is not allowed (will be redirected by the hook)
  if (!isAllowed) return null;

  return children;
};

export default AuthGuard;

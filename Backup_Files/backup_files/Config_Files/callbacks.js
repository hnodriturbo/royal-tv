export async function jwtCallback({ token, user }) {
  if (user) {
    token = {
      ...token,
      ...user,
      expiry:
        token.expiry ||
        Math.floor(Date.now() / 1000) +
          (user.rememberMe ? 24 * 60 * 60 : 1 * 60 * 60),
    };
    token.role = user.role;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime > (token.expiry || 0)) {
    return {
      name: 'Guest',
      role: 'guest',
    }; // ✅ Ensures NextAuth always has a valid session
  }
  console.log('JWT Callback - Token:', token);
  return token;
}

export async function sessionCallback({ session, token }) {
  if (token) {
    session.user = {
      ...session.user,
      user_id: token.user_id,
      role: token.role,
      token: token, // Optional: include entire token if needed
    };
  }
  console.log('Session Callback - Session:', session);
  return session;
}

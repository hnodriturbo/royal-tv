// =============================================================
// ===== lib/utils/generateUsername.js ==========================

// 🧠 Generates random username for each subscription (combination of 8 letters or numbers)
export default function generateRandomUsername() {
  // 🔤 All possible characters
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // 📝 Start empty
  let username = '';

  // repeat 8 times
  for (let i = 0; i < 8; i++) {
    const randomCharacter = Math.floor(Math.random() * characters.length); // Pick a letter

    // Add the letter to the username
    username += characters[randomCharacter];
  }

  // Return the 8 letter/number username
  return username;
}

// ✅ More complicated professional way:

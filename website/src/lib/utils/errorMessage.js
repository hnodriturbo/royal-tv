// File: src/lib/utils/errorMessage.js
export function getErrorMessage(e, fallback = '') {
  try {
    if (!e) return fallback;
    // Axios-style error payloads
    const data = e?.response?.data;
    if (typeof data === 'string' && data.trim()) return data.trim();
    if (data && typeof data.error === 'string' && data.error.trim()) return data.error.trim();
    if (Array.isArray(data?.errors) && data.errors.length) {
      return data.errors.map(String).join(', ');
    }
    // Generic Error
    if (e?.message && String(e.message).trim()) return String(e.message).trim();
    // Fallback to any safe stringification
    const s = JSON.stringify(data ?? e);
    return s && s !== '{}' ? s : fallback;
  } catch {
    return fallback;
  }
}

export function formatErrorSuffix(e) {
  const msg = getErrorMessage(e, '');
  return msg ? `: ${msg}` : '';
}

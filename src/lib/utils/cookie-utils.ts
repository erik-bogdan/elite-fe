// Cookie utility functions for anonymous user ID

const ANONYMOUS_USER_ID_COOKIE = 'elite_anonymous_user_id';
const COOKIE_EXPIRY_DAYS = 365; // Store for 1 year

/**
 * Get or generate anonymous user ID from cookie
 * Returns the UUID stored in cookie, or generates a new one and stores it
 */
export function getOrCreateAnonymousUserId(): string {
  if (typeof window === 'undefined') {
    // SSR: return empty string, will be generated on client
    return '';
  }

  // Try to get existing cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === ANONYMOUS_USER_ID_COOKIE && value) {
      return value;
    }
  }

  // Generate new UUID
  const newUuid = generateUUID();
  
  // Store in cookie
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  document.cookie = `${ANONYMOUS_USER_ID_COOKIE}=${newUuid}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

  return newUuid;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}




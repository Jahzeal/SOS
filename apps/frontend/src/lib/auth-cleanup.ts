/**
 * Comprehensive Auth & Cache Cleanup Utility
 * Clears LocalStorage, SessionStorage, Cookies, and CacheStorage on logout.
 */
export async function clearAuthSessionAndCaches() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Clear LocalStorage keys
    localStorage.removeItem('vf_access_token');
    localStorage.removeItem('vf_user');
    localStorage.removeItem('vf_cached_plans');
    localStorage.removeItem('vf_pricing_template');
    
    // Clear all other application keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('vf_') || key.startsWith('nox_') || key.includes('auth') || key.includes('token') || key.includes('user'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Error clearing localStorage:', e);
  }

  try {
    // 2. Clear SessionStorage
    sessionStorage.clear();
  } catch (e) {
    console.warn('Error clearing sessionStorage:', e);
  }

  try {
    // 3. Clear all accessible cookies
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
      }
    }
  } catch (e) {
    console.warn('Error clearing cookies:', e);
  }

  try {
    // 4. Clear CacheStorage (Service Worker caches)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (e) {
    console.warn('Error clearing cache storage:', e);
  }
}

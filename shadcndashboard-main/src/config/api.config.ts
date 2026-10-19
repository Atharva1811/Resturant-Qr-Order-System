/**
 * Central API & Test Mode Configuration for Servora
 *
 * Rules:
 * 1. Never invent fake production URLs or assume a backend exists in production.
 * 2. If VITE_API_URL or VITE_API_BASE_URL is not set in production, baseUrl is empty.
 * 3. Frontend-only Test Mode is disabled by default in production.
 * 4. Test mode can be explicitly enabled via VITE_TEST_MODE=true or ?testMode=true / localStorage.
 */

export const TEST_MODE_STORAGE_KEY = 'servora_test_mode';

export function getApiBaseUrl(): string {
  const envUrl = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    ''
  ).trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // In local development, default to localhost:5000/api if running local server
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }

  // In production, do NOT invent a fake URL. Return empty if unconfigured.
  return '';
}

export function isBackendConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

export function isTestMode(): boolean {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_TEST_MODE === 'true';
  }

  // Check URL query parameters for dynamic evaluation (e.g. ?testMode=true or ?testMode=false)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('testMode') === 'true') {
      localStorage.setItem(TEST_MODE_STORAGE_KEY, 'true');
      return true;
    }
    if (params.get('testMode') === 'false') {
      localStorage.removeItem(TEST_MODE_STORAGE_KEY);
      return false;
    }
  } catch {
    // Ignore URL parsing errors
  }

  // Check LocalStorage
  try {
    const stored = localStorage.getItem(TEST_MODE_STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // Ignore localStorage errors
  }

  // Fallback to build-time environment variable (default: false in production)
  return import.meta.env.VITE_TEST_MODE === 'true';
}

export function setTestMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  if (enabled) {
    localStorage.setItem(TEST_MODE_STORAGE_KEY, 'true');
  } else {
    localStorage.removeItem(TEST_MODE_STORAGE_KEY);
  }

  // Dispatch custom event to notify listeners
  window.dispatchEvent(new CustomEvent('servora-test-mode-change', { detail: { enabled } }));
}

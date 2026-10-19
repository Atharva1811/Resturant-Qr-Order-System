/**
 * Central API Configuration for Servora Restaurant SaaS
 *
 * Architecture Rules:
 * 1. Base URL is derived strictly from VITE_API_URL or VITE_API_BASE_URL.
 * 2. In local development (Vite dev mode), defaults to 'http://localhost:5000/api'.
 * 3. In production, never invent a fake backend URL. If unconfigured, returns empty string
 *    and produces clear, actionable error messages.
 */

export function getApiBaseUrl(): string {
  const envUrl = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    ''
  ).trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // In local development, default to localhost:5000/api if running local backend
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }

  // In production, do NOT invent a fake URL. Return empty if unconfigured.
  return '';
}

export function isBackendConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

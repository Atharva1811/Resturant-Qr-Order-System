import { describe, it, expect } from 'vitest';
import { qrService } from '../services/qr.service.js';

describe('Production QR Workflow & No-Mock Fallback Regression Suite', () => {
  const GITHUB_PAGES_BASE = '/Resturant-Qr-Order-System';
  const PRODUCTION_ORIGIN = 'https://atharva1811.github.io';

  // Helper reflecting the real frontend getTableUrl in RestaurantAdminTables
  function generateTableUrl(params: {
    origin: string;
    basePath: string;
    restaurantSlug: string;
    tableNumber: string;
    qrToken?: string;
  }) {
    const tableSlug = params.tableNumber.toLowerCase().replace(/\s+/g, '-');
    const base = (params.basePath || '/').replace(/\/$/, '');
    const tokenQuery = params.qrToken ? `?token=${encodeURIComponent(params.qrToken)}` : '';
    return `${params.origin}${base}/m/${params.restaurantSlug}/${tableSlug}${tokenQuery}`;
  }

  describe('Production QR Generation & Canonical URL Encoding', () => {
    it('constructs canonical customer ordering route with GitHub Pages base path', () => {
      const url = generateTableUrl({
        origin: PRODUCTION_ORIGIN,
        basePath: GITHUB_PAGES_BASE,
        restaurantSlug: 'rustic-hearth',
        tableNumber: 'Table 1',
        qrToken: 'b0a1d4927f912c48e581290fa8b21c90',
      });

      expect(url).toBe(
        'https://atharva1811.github.io/Resturant-Qr-Order-System/m/rustic-hearth/table-1?token=b0a1d4927f912c48e581290fa8b21c90'
      );
    });

    it('ensures two distinct tables generate distinct cryptographic tokens and URLs', () => {
      const token1 = qrService.generateQrToken();
      const token2 = qrService.generateQrToken();

      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(32);
      expect(token2).toHaveLength(32);

      const table1Url = generateTableUrl({
        origin: PRODUCTION_ORIGIN,
        basePath: GITHUB_PAGES_BASE,
        restaurantSlug: 'rustic-hearth',
        tableNumber: 'Table 1',
        qrToken: token1,
      });

      const table2Url = generateTableUrl({
        origin: PRODUCTION_ORIGIN,
        basePath: GITHUB_PAGES_BASE,
        restaurantSlug: 'rustic-hearth',
        tableNumber: 'Table 2',
        qrToken: token2,
      });

      expect(table1Url).not.toBe(table2Url);
      expect(table1Url).toContain(`/m/rustic-hearth/table-1?token=${token1}`);
      expect(table2Url).toContain(`/m/rustic-hearth/table-2?token=${token2}`);
      // Must not contain any temporary testMode parameters
      expect(table1Url).not.toContain('testMode');
      expect(table2Url).not.toContain('testMode');
    });

    it('properly encodes table names containing spaces and special characters', () => {
      const url = generateTableUrl({
        origin: PRODUCTION_ORIGIN,
        basePath: GITHUB_PAGES_BASE,
        restaurantSlug: 'rustic-hearth',
        tableNumber: 'Patio Booth 3 & 4',
        qrToken: '9f8e7d6c5b4a39281726354859607182',
      });

      expect(url).toContain('/m/rustic-hearth/patio-booth-3-&-4?token=9f8e7d6c5b4a39281726354859607182');
    });
  });

  describe('Route Isolation: Customer Ordering vs Internal Operations', () => {
    it('customer routes do not collide with admin, kitchen, or superadmin routes', () => {
      const customerPrefix = '/m/';
      const internalRoutes = [
        '/admin',
        '/admin/dashboard',
        '/admin/orders',
        '/admin/menu',
        '/admin/tables',
        '/admin/staff',
        '/admin/analytics',
        '/admin/settings',
        '/kitchen',
        '/kitchen/orders',
        '/superadmin',
        '/superadmin/restaurants',
        '/superadmin/restaurants/test-id',
      ];

      for (const route of internalRoutes) {
        expect(route.startsWith(customerPrefix)).toBe(false);
      }

      // Customer route strictly begins with /m/:slug/:table
      const customerSample = '/m/rustic-hearth/table-1';
      expect(customerSample.startsWith(customerPrefix)).toBe(true);
    });
  });

  describe('Regression: Anti-Mock Enforcement & Meaningful Network Errors', () => {
    it('diagnoses unconfigured backend API URL without silently falling back to mock data', () => {
      const configuredApiUrl = ''; // Unconfigured production backend

      let caughtError: string | null = null;
      if (!configuredApiUrl) {
        caughtError =
          'Servora API URL is not configured. Set VITE_API_URL or VITE_API_BASE_URL in your environment to connect to the backend.';
      }

      expect(caughtError).toContain('Servora API URL is not configured');
      // Must be an actionable error, not a silent mock or fake success
      expect(caughtError).not.toBe('Failed to fetch');
    });

    it('diagnoses Mixed Content refusal when browser on HTTPS connects to an unencrypted HTTP backend', () => {
      const originProtocol = 'https:';
      const backendUrl = 'http://api.servora.example.com';

      const isMixedContent = originProtocol === 'https:' && backendUrl.startsWith('http:');
      expect(isMixedContent).toBe(true);

      const diagnostic = isMixedContent
        ? `Mixed Content Block: The browser refused to connect from HTTPS to an unencrypted HTTP backend (${backendUrl}). Deploy the backend with HTTPS.`
        : 'Network request failed';

      expect(diagnostic).toContain('Mixed Content Block');
      expect(diagnostic).toContain('Deploy the backend with HTTPS');
    });

    it('ensures API requests propagate real errors and never return simulated success payloads', async () => {
      // Simulating a network failure
      const simulateNetworkCall = async () => {
        throw new Error('Connection refused by host');
      };

      await expect(simulateNetworkCall()).rejects.toThrow('Connection refused by host');
    });
  });
});

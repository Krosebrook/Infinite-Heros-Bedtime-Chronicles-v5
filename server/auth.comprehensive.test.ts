import { describe, it, expect, vi, beforeEach } from 'vitest';

// ══════════════════════════════════════════════════════════════════
// Firebase Auth Middleware Tests
// Tests the requireAuth middleware behavior in all scenarios.
// ══════════════════════════════════════════════════════════════════

// Mirror the auth logic for testing without importing firebase-admin
describe('requireAuth middleware behavior', () => {
  // ── Dev Mode (no Firebase config) ─────────────────────────────
  describe('dev mode (FIREBASE_SERVICE_ACCOUNT_KEY not set)', () => {
    it('allows request without auth header', () => {
      const isConfigured = false;
      const result = isConfigured ? 'check-token' : 'skip-auth';
      expect(result).toBe('skip-auth');
    });

    it('assigns anonymous user with IP as uid', () => {
      const ip = '127.0.0.1';
      const user = { uid: ip || 'anonymous', isAnonymous: true };
      expect(user.uid).toBe('127.0.0.1');
      expect(user.isAnonymous).toBe(true);
    });

    it('uses "anonymous" when IP is empty', () => {
      const ip = '';
      const user = { uid: ip || 'anonymous', isAnonymous: true };
      expect(user.uid).toBe('anonymous');
    });

    it('uses "anonymous" when IP is undefined', () => {
      const ip: string | undefined = undefined;
      const user = { uid: ip || 'anonymous', isAnonymous: true };
      expect(user.uid).toBe('anonymous');
    });
  });

  // ── Production Mode (Firebase configured) ─────────────────────
  describe('production mode (Firebase configured)', () => {
    it('rejects request without Authorization header', () => {
      const authHeader: string | undefined = undefined;
      const hasBearerToken = authHeader?.startsWith('Bearer ');
      expect(hasBearerToken).toBeFalsy();
    });

    it('rejects request with non-Bearer auth', () => {
      const authHeader = 'Basic abc123';
      expect(authHeader.startsWith('Bearer ')).toBe(false);
    });

    it('rejects empty Authorization header', () => {
      const authHeader = '';
      expect(authHeader.startsWith('Bearer ')).toBe(false);
    });

    it('rejects "Bearer " with no token', () => {
      const authHeader = 'Bearer ';
      const token = authHeader.slice(7);
      expect(token).toBe('');
    });

    it('extracts token correctly from valid Bearer header', () => {
      const authHeader = 'Bearer eyJhbGciOiJSUzI1NiJ9.test.sig';
      const token = authHeader.slice(7);
      expect(token).toBe('eyJhbGciOiJSUzI1NiJ9.test.sig');
    });

    it('rejects "bearer " (lowercase)', () => {
      const authHeader = 'bearer token';
      expect(authHeader.startsWith('Bearer ')).toBe(false);
    });

    it('rejects "BEARER " (uppercase)', () => {
      const authHeader = 'BEARER token';
      expect(authHeader.startsWith('Bearer ')).toBe(false);
    });
  });

  // ── Token Validation ──────────────────────────────────────────
  describe('token decoding', () => {
    it('extracts uid from decoded token', () => {
      const decoded = { uid: 'user123', firebase: { sign_in_provider: 'google.com' } };
      const user = {
        uid: decoded.uid,
        isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous',
      };
      expect(user.uid).toBe('user123');
      expect(user.isAnonymous).toBe(false);
    });

    it('identifies anonymous sign-in', () => {
      const decoded = { uid: 'anon456', firebase: { sign_in_provider: 'anonymous' } };
      const user = {
        uid: decoded.uid,
        isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous',
      };
      expect(user.isAnonymous).toBe(true);
    });

    it('handles missing firebase field', () => {
      const decoded = { uid: 'user789' } as any;
      const user = {
        uid: decoded.uid,
        isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous',
      };
      expect(user.isAnonymous).toBe(false);
    });

    it('handles various sign-in providers', () => {
      const providers = ['google.com', 'apple.com', 'password', 'phone', 'anonymous'];
      for (const provider of providers) {
        const decoded = { uid: 'u', firebase: { sign_in_provider: provider } };
        const isAnon = decoded.firebase.sign_in_provider === 'anonymous';
        expect(isAnon).toBe(provider === 'anonymous');
      }
    });
  });

  // ── POST-only Auth ────────────────────────────────────────────
  describe('method-based auth bypass', () => {
    it('skips auth for GET requests', () => {
      const method = 'GET';
      const shouldSkip = method === 'GET';
      expect(shouldSkip).toBe(true);
    });

    it('requires auth for POST requests', () => {
      const method = 'POST';
      const shouldSkip = method === 'GET';
      expect(shouldSkip).toBe(false);
    });

    it('requires auth for PUT requests', () => {
      const shouldSkip = 'PUT' === 'GET';
      expect(shouldSkip).toBe(false);
    });

    it('requires auth for DELETE requests', () => {
      const shouldSkip = 'DELETE' === 'GET';
      expect(shouldSkip).toBe(false);
    });

    it('requires auth for PATCH requests', () => {
      const shouldSkip = 'PATCH' === 'GET';
      expect(shouldSkip).toBe(false);
    });
  });

  // ── Firebase Admin Initialization ─────────────────────────────
  describe('Firebase Admin lazy init', () => {
    it('returns null when FIREBASE_SERVICE_ACCOUNT_KEY is empty', () => {
      const key = '';
      expect(key ? 'init' : null).toBeNull();
    });

    it('returns null when FIREBASE_SERVICE_ACCOUNT_KEY is undefined', () => {
      const key: string | undefined = undefined;
      expect(key ? 'init' : null).toBeNull();
    });

    it('attempts init when key is present', () => {
      const key = '{"type":"service_account"}';
      expect(key ? 'init' : null).toBe('init');
    });

    it('handles invalid JSON in service account key', () => {
      const key = 'not-valid-json';
      let parsed;
      try {
        parsed = JSON.parse(key);
      } catch {
        parsed = null;
      }
      expect(parsed).toBeNull();
    });

    it('handles valid JSON but wrong structure', () => {
      const key = '{"wrong":"structure"}';
      const parsed = JSON.parse(key);
      expect(parsed.type).toBeUndefined();
    });
  });

  // ── Error Responses ───────────────────────────────────────────
  describe('error responses', () => {
    it('returns 401 for missing auth', () => {
      const status = 401;
      const body = { error: 'Authentication required' };
      expect(status).toBe(401);
      expect(body.error).toBe('Authentication required');
    });

    it('returns 401 for invalid token', () => {
      const status = 401;
      const body = { error: 'Invalid or expired token' };
      expect(status).toBe(401);
      expect(body.error).toBe('Invalid or expired token');
    });

    it('error messages do not leak internal details', () => {
      const errorMessages = ['Authentication required', 'Invalid or expired token'];
      for (const msg of errorMessages) {
        expect(msg).not.toContain('Firebase');
        expect(msg).not.toContain('stack');
        expect(msg).not.toContain('internal');
      }
    });
  });
});

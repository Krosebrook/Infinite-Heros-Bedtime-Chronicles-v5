import type { Request, Response, NextFunction } from 'express';

/**
 * Firebase Admin auth middleware.
 * Validates the Bearer token from the Authorization header.
 * Attaches decoded user info to req.user.
 */

// Lazy-init firebase-admin to avoid import errors when not configured
let adminAuth: import('firebase-admin').auth.Auth | null = null;

async function getAdminAuth() {
  if (adminAuth) return adminAuth;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    return null;
  }

  try {
    const admin = await import('firebase-admin');
    const serviceAccount = JSON.parse(serviceAccountJson);

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    adminAuth = admin.auth();
    return adminAuth;
  } catch (err) {
    console.error('[Auth] Failed to initialize Firebase Admin:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        isAnonymous: boolean;
      };
    }
  }
}

/**
 * Middleware that requires a valid Firebase auth token.
 * If FIREBASE_SERVICE_ACCOUNT_KEY is not set, auth is disabled (dev mode).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = await getAdminAuth();

  // If Firebase Admin is not configured, skip auth (development mode)
  if (!auth) {
    req.user = { uid: req.ip || 'anonymous', isAnonymous: true };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      isAnonymous: decoded.firebase?.sign_in_provider === 'anonymous',
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

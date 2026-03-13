/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared API middleware for validation, rate limiting, CORS, and error handling.
 * 
 * FIXES APPLIED (March 2026):
 * - FIX #2: Added bedtime-chronicles.com (with hyphen) to CORS allowed origins
 * - Added www variant for both domains
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Rate Limiting (in-memory, per-instance) ---

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // max requests per window per IP

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0].split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  return { allowed: true, retryAfterMs: 0 };
}

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now >= entry.resetAt) rateLimitStore.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS);

// --- CORS ---
// FIX #2: Added bedtime-chronicles.com (with hyphen) — was missing, blocking all API calls from custom domain
const ALLOWED_ORIGINS = new Set([
  'https://infinity-heroes-bedtime-chronicles.vercel.app',
  'https://bedtimechronicles.com',
  'https://www.bedtimechronicles.com',
  'https://bedtime-chronicles.com',
  'https://www.bedtime-chronicles.com',
]);

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Allow localhost/preview deployments in non-production
  if (process.env.NODE_ENV !== 'production') return true;
  // Allow Vercel preview deployments
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin as string | undefined;

  if (req.method === 'OPTIONS') {
    if (isAllowedOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin!);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return true; // Signal that response was sent
  }

  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  return false;
}

// --- Validation helpers ---

export function validateString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  return value.slice(0, maxLength);
}

export function validateStringEnum<T extends string>(value: unknown, allowed: T[]): T | null {
  if (typeof value !== 'string') return null;
  return allowed.includes(value as T) ? (value as T) : null;
}

// --- Error sanitization ---

export function sanitizeError(error: unknown): { status: number; message: string } {
  // Log the full error server-side
  console.error('API error details:', error);

  // Return only generic messages to the client
  if (error instanceof Error) {
    // Check for known safe error types
    if (error.message === 'No image data received' || error.message === 'No audio data received') {
      return { status: 500, message: error.message };
    }
  }

  return { status: 500, message: 'An internal error occurred. Please try again.' };
}

// --- Main middleware wrapper ---

type ApiHandler = (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse>;

export function withMiddleware(handler: ApiHandler): ApiHandler {
  return async (req: VercelRequest, res: VercelResponse) => {
    // CORS preflight
    if (setCorsHeaders(req, res)) return;

    // Method check
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = checkRateLimit(ip);
    if (!allowed) {
      res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000).toString());
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    // API key check
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Service temporarily unavailable.' });
    }

    // Request body size guard (rough check — Vercel has its own limits too)
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 50_000) {
      return res.status(413).json({ error: 'Request body too large.' });
    }

    try {
      await handler(req, res);
    } catch (error) {
      const { status, message } = sanitizeError(error);
      res.status(status).json({ error: message });
    }
  };
}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to mock expo/fetch before importing the module
vi.mock('expo/fetch', () => ({
  fetch: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn().mockImplementation(() => ({})),
}));

describe('getApiUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear module cache so env changes take effect
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses EXPO_PUBLIC_API_URL when set', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
    const { getApiUrl } = await import('./query-client');
    expect(getApiUrl()).toBe('https://api.example.com/');
  });

  it('adds trailing slash to EXPO_PUBLIC_API_URL', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
    const { getApiUrl } = await import('./query-client');
    expect(getApiUrl()).toBe('https://api.example.com/');
  });

  it('preserves trailing slash on EXPO_PUBLIC_API_URL', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/';
    const { getApiUrl } = await import('./query-client');
    expect(getApiUrl()).toBe('https://api.example.com/');
  });

  it('falls back to EXPO_PUBLIC_DOMAIN with https for non-local', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_DOMAIN = 'myapp.example.com:5000';
    const { getApiUrl } = await import('./query-client');
    const url = getApiUrl();
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain('myapp.example.com');
  });

  it('uses http for localhost domain', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_DOMAIN = 'localhost:5000';
    const { getApiUrl } = await import('./query-client');
    const url = getApiUrl();
    expect(url).toMatch(/^http:\/\//);
  });

  it('throws when neither env var is set', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    delete process.env.EXPO_PUBLIC_DOMAIN;
    const { getApiUrl } = await import('./query-client');
    expect(() => getApiUrl()).toThrow();
  });
});

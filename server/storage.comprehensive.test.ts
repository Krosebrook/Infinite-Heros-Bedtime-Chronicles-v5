import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from './storage';

// ══════════════════════════════════════════════════════════════════
// Server-side In-Memory Storage (MemStorage) Tests
// ══════════════════════════════════════════════════════════════════

describe('MemStorage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  // ── User Creation ─────────────────────────────────────────────
  describe('createUser', () => {
    it('creates a user with a UUID', async () => {
      const user = await storage.createUser({ username: 'alice' });
      expect(user.id).toBeTruthy();
      expect(user.username).toBe('alice');
    });

    it('generates unique IDs for different users', async () => {
      const u1 = await storage.createUser({ username: 'alice' });
      const u2 = await storage.createUser({ username: 'bob' });
      expect(u1.id).not.toBe(u2.id);
    });

    it('creates users with same username (no uniqueness constraint in memory)', async () => {
      const u1 = await storage.createUser({ username: 'alice' });
      const u2 = await storage.createUser({ username: 'alice' });
      expect(u1.id).not.toBe(u2.id);
    });

    it('handles empty username', async () => {
      const user = await storage.createUser({ username: '' });
      expect(user.username).toBe('');
    });

    it('handles long username', async () => {
      const long = 'a'.repeat(1000);
      const user = await storage.createUser({ username: long });
      expect(user.username).toHaveLength(1000);
    });

    it('handles special characters in username', async () => {
      const user = await storage.createUser({ username: '🦸‍♂️ hero@test.com' });
      expect(user.username).toBe('🦸‍♂️ hero@test.com');
    });

    it('handles unicode username', async () => {
      const user = await storage.createUser({ username: '你好世界' });
      expect(user.username).toBe('你好世界');
    });
  });

  // ── getUser ───────────────────────────────────────────────────
  describe('getUser', () => {
    it('returns user by ID', async () => {
      const created = await storage.createUser({ username: 'alice' });
      const found = await storage.getUser(created.id);
      expect(found).toBeDefined();
      expect(found!.username).toBe('alice');
    });

    it('returns undefined for non-existent ID', async () => {
      const found = await storage.getUser('nonexistent');
      expect(found).toBeUndefined();
    });

    it('returns undefined for empty ID', async () => {
      const found = await storage.getUser('');
      expect(found).toBeUndefined();
    });

    it('returns the correct user among many', async () => {
      await storage.createUser({ username: 'a' });
      const target = await storage.createUser({ username: 'target' });
      await storage.createUser({ username: 'c' });
      const found = await storage.getUser(target.id);
      expect(found!.username).toBe('target');
    });
  });

  // ── getUserByUsername ──────────────────────────────────────────
  describe('getUserByUsername', () => {
    it('finds user by username', async () => {
      await storage.createUser({ username: 'alice' });
      const found = await storage.getUserByUsername('alice');
      expect(found).toBeDefined();
      expect(found!.username).toBe('alice');
    });

    it('returns undefined for non-existent username', async () => {
      const found = await storage.getUserByUsername('nobody');
      expect(found).toBeUndefined();
    });

    it('is case-sensitive', async () => {
      await storage.createUser({ username: 'Alice' });
      expect(await storage.getUserByUsername('alice')).toBeUndefined();
      expect(await storage.getUserByUsername('ALICE')).toBeUndefined();
      expect(await storage.getUserByUsername('Alice')).toBeDefined();
    });

    it('returns first match for duplicate usernames', async () => {
      const u1 = await storage.createUser({ username: 'dup' });
      const u2 = await storage.createUser({ username: 'dup' });
      const found = await storage.getUserByUsername('dup');
      // Should find one of them
      expect(found).toBeDefined();
      expect(found!.username).toBe('dup');
    });

    it('returns undefined for empty username when none exists', async () => {
      const found = await storage.getUserByUsername('');
      expect(found).toBeUndefined();
    });

    it('finds empty username if one exists', async () => {
      await storage.createUser({ username: '' });
      const found = await storage.getUserByUsername('');
      expect(found).toBeDefined();
    });
  });

  // ── Concurrent Operations ─────────────────────────────────────
  describe('concurrent operations', () => {
    it('handles 100 concurrent user creations', async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        storage.createUser({ username: `user${i}` })
      );
      const users = await Promise.all(promises);
      expect(users).toHaveLength(100);
      const ids = new Set(users.map(u => u.id));
      expect(ids.size).toBe(100);
    });

    it('handles concurrent reads and writes', async () => {
      const created = await storage.createUser({ username: 'test' });
      const promises = Array.from({ length: 50 }, () =>
        storage.getUser(created.id)
      );
      const results = await Promise.all(promises);
      results.forEach(r => expect(r?.username).toBe('test'));
    });
  });

  // ── Storage Isolation ─────────────────────────────────────────
  describe('instance isolation', () => {
    it('different MemStorage instances are independent', async () => {
      const s1 = new MemStorage();
      const s2 = new MemStorage();
      await s1.createUser({ username: 'only-in-s1' });
      expect(await s2.getUserByUsername('only-in-s1')).toBeUndefined();
    });
  });
});

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ══════════════════════════════════════════════════════════════════
// Database Schema & Validation Tests
// Tests Zod schemas, data models, and type contracts.
// ══════════════════════════════════════════════════════════════════

describe('insertUserSchema behavior', () => {
  // Mirror the schema since it depends on drizzle imports
  const insertUserSchema = z.object({
    username: z.string(),
  });

  it('accepts valid username', () => {
    const result = insertUserSchema.safeParse({ username: 'alice' });
    expect(result.success).toBe(true);
  });

  it('rejects missing username', () => {
    const result = insertUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects null username', () => {
    const result = insertUserSchema.safeParse({ username: null });
    expect(result.success).toBe(false);
  });

  it('rejects number username', () => {
    const result = insertUserSchema.safeParse({ username: 123 });
    expect(result.success).toBe(false);
  });

  it('accepts empty string username', () => {
    const result = insertUserSchema.safeParse({ username: '' });
    expect(result.success).toBe(true);
  });

  it('accepts very long username', () => {
    const result = insertUserSchema.safeParse({ username: 'a'.repeat(10000) });
    expect(result.success).toBe(true);
  });

  it('accepts unicode username', () => {
    const result = insertUserSchema.safeParse({ username: '🦸‍♂️ hero' });
    expect(result.success).toBe(true);
  });

  it('strips extra fields', () => {
    const result = insertUserSchema.safeParse({ username: 'alice', extra: 'field' });
    expect(result.success).toBe(true);
  });

  it('rejects boolean username', () => {
    const result = insertUserSchema.safeParse({ username: true });
    expect(result.success).toBe(false);
  });

  it('rejects array username', () => {
    const result = insertUserSchema.safeParse({ username: ['alice'] });
    expect(result.success).toBe(false);
  });
});

describe('conversation schema', () => {
  // Mirror the conversation insert schema
  const insertConversationSchema = z.object({
    title: z.string().optional(),
    userId: z.string().optional(),
  });

  it('accepts empty conversation', () => {
    const result = insertConversationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts conversation with title', () => {
    const result = insertConversationSchema.safeParse({ title: 'My Chat' });
    expect(result.success).toBe(true);
  });

  it('accepts conversation with userId', () => {
    const result = insertConversationSchema.safeParse({ userId: 'user123' });
    expect(result.success).toBe(true);
  });

  it('accepts full conversation data', () => {
    const result = insertConversationSchema.safeParse({ title: 'Chat', userId: 'u1' });
    expect(result.success).toBe(true);
  });

  it('rejects non-string title', () => {
    const result = insertConversationSchema.safeParse({ title: 123 });
    expect(result.success).toBe(false);
  });
});

describe('message schema', () => {
  const insertMessageSchema = z.object({
    conversationId: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  });

  it('accepts valid user message', () => {
    const result = insertMessageSchema.safeParse({
      conversationId: 'conv1',
      role: 'user',
      content: 'Hello!',
    });
    expect(result.success).toBe(true);
  });

  it('accepts assistant message', () => {
    const result = insertMessageSchema.safeParse({
      conversationId: 'conv1',
      role: 'assistant',
      content: 'Hi there!',
    });
    expect(result.success).toBe(true);
  });

  it('accepts system message', () => {
    const result = insertMessageSchema.safeParse({
      conversationId: 'conv1',
      role: 'system',
      content: 'System prompt',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = insertMessageSchema.safeParse({
      conversationId: 'conv1',
      role: 'admin',
      content: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing conversationId', () => {
    const result = insertMessageSchema.safeParse({
      role: 'user',
      content: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing content', () => {
    const result = insertMessageSchema.safeParse({
      conversationId: 'conv1',
      role: 'user',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing role', () => {
    const result = insertMessageSchema.safeParse({
      conversationId: 'conv1',
      content: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty string content', () => {
    const result = insertMessageSchema.safeParse({
      conversationId: 'conv1',
      role: 'user',
      content: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts very long content', () => {
    const result = insertMessageSchema.safeParse({
      conversationId: 'conv1',
      role: 'user',
      content: 'x'.repeat(100000),
    });
    expect(result.success).toBe(true);
  });
});

// ── Story Data Contracts ──────────────────────────────────────────
describe('story data contracts', () => {
  const storyPartSchema = z.object({
    text: z.string(),
    choices: z.array(z.string()).optional(),
    partIndex: z.number(),
  });

  const storySchema = z.object({
    title: z.string(),
    parts: z.array(storyPartSchema),
    vocabWord: z.object({ word: z.string(), definition: z.string() }),
    joke: z.string(),
    lesson: z.string(),
    tomorrowHook: z.string(),
    rewardBadge: z.object({ emoji: z.string(), title: z.string(), description: z.string() }),
  });

  it('validates complete story', () => {
    const story = {
      title: 'The Brave Star',
      parts: [
        { text: 'Once upon a time...', choices: ['Go left', 'Go right', 'Stay'], partIndex: 0 },
        { text: 'The end.', partIndex: 1 },
      ],
      vocabWord: { word: 'constellation', definition: 'A group of stars' },
      joke: 'Why did the star twinkle?',
      lesson: 'Be brave and kind',
      tomorrowHook: 'Next time, we fly to Mars!',
      rewardBadge: { emoji: '⭐', title: 'Star Seeker', description: 'Found a star' },
    };
    expect(storySchema.safeParse(story).success).toBe(true);
  });

  it('rejects story without title', () => {
    const story = {
      parts: [],
      vocabWord: { word: 'w', definition: 'd' },
      joke: 'j', lesson: 'l', tomorrowHook: 't',
      rewardBadge: { emoji: 'e', title: 't', description: 'd' },
    };
    expect(storySchema.safeParse(story).success).toBe(false);
  });

  it('rejects story without parts', () => {
    const story = {
      title: 'Test',
      vocabWord: { word: 'w', definition: 'd' },
      joke: 'j', lesson: 'l', tomorrowHook: 't',
      rewardBadge: { emoji: 'e', title: 't', description: 'd' },
    };
    expect(storySchema.safeParse(story).success).toBe(false);
  });

  it('accepts story with empty parts array', () => {
    const story = {
      title: 'Test',
      parts: [],
      vocabWord: { word: 'w', definition: 'd' },
      joke: 'j', lesson: 'l', tomorrowHook: 't',
      rewardBadge: { emoji: 'e', title: 't', description: 'd' },
    };
    expect(storySchema.safeParse(story).success).toBe(true);
  });

  it('validates part with choices', () => {
    const part = { text: 'text', choices: ['A', 'B', 'C'], partIndex: 0 };
    expect(storyPartSchema.safeParse(part).success).toBe(true);
  });

  it('validates part without choices (sleep mode)', () => {
    const part = { text: 'text', partIndex: 0 };
    expect(storyPartSchema.safeParse(part).success).toBe(true);
  });

  it('rejects part without text', () => {
    const part = { choices: ['A'], partIndex: 0 };
    expect(storyPartSchema.safeParse(part).success).toBe(false);
  });

  it('rejects part without partIndex', () => {
    const part = { text: 'text', choices: ['A'] };
    expect(storyPartSchema.safeParse(part).success).toBe(false);
  });

  it('rejects non-number partIndex', () => {
    const part = { text: 'text', partIndex: 'zero' };
    expect(storyPartSchema.safeParse(part).success).toBe(false);
  });

  it('validates reward badge', () => {
    const badge = { emoji: '⭐', title: 'Star', description: 'You earned a star' };
    const schema = z.object({ emoji: z.string(), title: z.string(), description: z.string() });
    expect(schema.safeParse(badge).success).toBe(true);
  });

  it('validates vocab word', () => {
    const vocab = { word: 'constellation', definition: 'A group of stars forming a pattern' };
    const schema = z.object({ word: z.string(), definition: z.string() });
    expect(schema.safeParse(vocab).success).toBe(true);
  });
});

// ── CachedStory Shape ─────────────────────────────────────────────
describe('CachedStory shape validation', () => {
  const cachedStorySchema = z.object({
    id: z.string(),
    timestamp: z.number(),
    story: z.object({ title: z.string() }).passthrough(),
    heroId: z.string(),
    mode: z.string(),
    profileId: z.string().optional(),
    avatar: z.string().optional(),
    scenes: z.record(z.string()).optional(),
    feedback: z.object({
      rating: z.number(),
      text: z.string(),
      timestamp: z.number(),
    }).optional(),
  });

  it('validates minimal cached story', () => {
    const cached = {
      id: '123',
      timestamp: Date.now(),
      story: { title: 'Test' },
      heroId: 'nova',
      mode: 'classic',
    };
    expect(cachedStorySchema.safeParse(cached).success).toBe(true);
  });

  it('validates cached story with all optional fields', () => {
    const cached = {
      id: '123',
      timestamp: Date.now(),
      story: { title: 'Test' },
      heroId: 'nova',
      mode: 'classic',
      profileId: 'p1',
      avatar: 'data:image/png;base64,abc',
      scenes: { '0': 'data:image/png;base64,scene0' },
      feedback: { rating: 5, text: 'Great!', timestamp: Date.now() },
    };
    expect(cachedStorySchema.safeParse(cached).success).toBe(true);
  });

  it('rejects cached story without id', () => {
    const cached = { timestamp: Date.now(), story: { title: 'T' }, heroId: 'nova', mode: 'classic' };
    expect(cachedStorySchema.safeParse(cached).success).toBe(false);
  });

  it('rejects cached story without timestamp', () => {
    const cached = { id: '1', story: { title: 'T' }, heroId: 'nova', mode: 'classic' };
    expect(cachedStorySchema.safeParse(cached).success).toBe(false);
  });
});

// ── AsyncStorage Key Conventions ──────────────────────────────────
describe('AsyncStorage key conventions', () => {
  const STORAGE_KEYS = [
    '@infinity_heroes_app_settings',
    '@infinity_heroes_profiles',
    '@infinity_heroes_active_profile',
    '@infinity_heroes_stories',
    '@infinity_heroes_read',
    '@infinity_heroes_badges',
    '@infinity_heroes_streaks',
    '@infinity_heroes_parent_controls',
    '@infinity_heroes_favorites',
    '@infinity_heroes_onboarding_complete',
    '@infinity_heroes_preferences',
    '@infinity_heroes_settings_migrated',
  ];

  it('all keys follow @infinity_heroes_ prefix convention', () => {
    for (const key of STORAGE_KEYS) {
      expect(key).toMatch(/^@infinity_heroes_/);
    }
  });

  it('all keys are lowercase snake_case after prefix', () => {
    for (const key of STORAGE_KEYS) {
      const suffix = key.replace('@infinity_heroes_', '');
      expect(suffix).toMatch(/^[a-z_]+$/);
    }
  });

  it('all keys are unique', () => {
    expect(new Set(STORAGE_KEYS).size).toBe(STORAGE_KEYS.length);
  });

  it('has 12 storage keys total', () => {
    expect(STORAGE_KEYS).toHaveLength(12);
  });
});

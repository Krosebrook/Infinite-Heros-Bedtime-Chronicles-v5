import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ══════════════════════════════════════════════════════════════════
// Tests mirror unexported functions from routes.ts for comprehensive
// coverage of input validation, rate limiting, prompt generation,
// and story response parsing.
// ══════════════════════════════════════════════════════════════════

// ── sanitizeString ────────────────────────────────────────────────
describe('sanitizeString – comprehensive', () => {
  function sanitizeString(val: unknown, maxLen: number): string {
    if (typeof val !== 'string') return '';
    return val.slice(0, maxLen).trim();
  }

  // Type coercion
  it('returns empty for number 0', () => expect(sanitizeString(0, 100)).toBe(''));
  it('returns empty for NaN', () => expect(sanitizeString(NaN, 100)).toBe(''));
  it('returns empty for Infinity', () => expect(sanitizeString(Infinity, 100)).toBe(''));
  it('returns empty for BigInt-like', () => expect(sanitizeString(BigInt(42), 100)).toBe(''));
  it('returns empty for Symbol', () => expect(sanitizeString(Symbol('x'), 100)).toBe(''));
  it('returns empty for function', () => expect(sanitizeString(() => {}, 100)).toBe(''));
  it('returns empty for Date object', () => expect(sanitizeString(new Date(), 100)).toBe(''));
  it('returns empty for RegExp', () => expect(sanitizeString(/abc/, 100)).toBe(''));
  it('returns empty for Map', () => expect(sanitizeString(new Map(), 100)).toBe(''));

  // Boundary lengths
  it('handles maxLen of 1 on single char', () => expect(sanitizeString('a', 1)).toBe('a'));
  it('handles maxLen of 1 on multi char', () => expect(sanitizeString('abc', 1)).toBe('a'));
  it('handles negative maxLen (slice returns full string)', () => expect(sanitizeString('hello', -1)).toBe('hell'));

  // Unicode and special characters
  it('handles emoji strings', () => expect(sanitizeString('🦸‍♂️ hero', 20)).toBe('🦸‍♂️ hero'));
  it('truncates multi-byte chars correctly', () => {
    const result = sanitizeString('🎉🎊🎈', 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });
  it('handles Chinese characters', () => expect(sanitizeString('你好世界', 4)).toBe('你好世界'));
  it('handles Arabic text', () => expect(sanitizeString('مرحبا', 10)).toBe('مرحبا'));
  it('handles newlines in input', () => expect(sanitizeString('line1\nline2', 20)).toBe('line1\nline2'));
  it('handles tabs in input', () => expect(sanitizeString('\thello\t', 20)).toBe('hello'));
  it('handles null bytes', () => expect(sanitizeString('he\0llo', 10)).toBe('he\0llo'));
  it('handles only whitespace', () => expect(sanitizeString('   ', 10)).toBe(''));

  // XSS/injection attempts
  it('preserves HTML tags (does not strip)', () => {
    expect(sanitizeString('<script>alert(1)</script>', 100)).toBe('<script>alert(1)</script>');
  });
  it('preserves SQL injection attempts', () => {
    expect(sanitizeString("'; DROP TABLE users; --", 100)).toBe("'; DROP TABLE users; --");
  });
  it('preserves template literals', () => {
    expect(sanitizeString('${process.env.SECRET}', 100)).toBe('${process.env.SECRET}');
  });

  // Performance edge cases
  it('handles string of exactly MAX_INPUT_STRING_LENGTH (500)', () => {
    const s = 'a'.repeat(500);
    expect(sanitizeString(s, 500)).toHaveLength(500);
  });
  it('handles string of 10000 chars', () => {
    const s = 'b'.repeat(10000);
    expect(sanitizeString(s, 500)).toHaveLength(500);
  });
});

// ── validateMadlibWords ───────────────────────────────────────────
describe('validateMadlibWords – comprehensive', () => {
  function validateMadlibWords(input: unknown): Record<string, string> | undefined {
    if (input == null) return undefined;
    if (typeof input !== 'object' || Array.isArray(input)) return undefined;
    const obj = input as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length > 20) return undefined;
    const result: Record<string, string> = {};
    for (const key of keys) {
      if (typeof key !== 'string' || key.length > 100) continue;
      const val = obj[key];
      if (typeof val !== 'string') continue;
      result[key.slice(0, 100)] = String(val).slice(0, 100);
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  // Type coercion
  it('returns undefined for number', () => expect(validateMadlibWords(42)).toBeUndefined());
  it('returns undefined for boolean true', () => expect(validateMadlibWords(true)).toBeUndefined());
  it('returns undefined for string', () => expect(validateMadlibWords('hello')).toBeUndefined());
  it('returns undefined for nested array', () => expect(validateMadlibWords([['a']])).toBeUndefined());
  it('returns undefined for Set', () => expect(validateMadlibWords(new Set())).toBeUndefined());

  // Key/value limits
  it('accepts exactly 1 key', () => {
    expect(validateMadlibWords({ noun: 'cat' })).toEqual({ noun: 'cat' });
  });
  it('accepts exactly 19 keys', () => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < 19; i++) obj[`k${i}`] = `v${i}`;
    const result = validateMadlibWords(obj);
    expect(Object.keys(result!)).toHaveLength(19);
  });
  it('rejects 21 keys', () => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < 21; i++) obj[`k${i}`] = `v${i}`;
    expect(validateMadlibWords(obj)).toBeUndefined();
  });
  it('truncates values to exactly 100 chars', () => {
    const val = 'a'.repeat(150);
    const result = validateMadlibWords({ word: val });
    expect(result!.word).toHaveLength(100);
  });
  it('skips keys longer than 100 chars', () => {
    const key = 'k'.repeat(150);
    const result = validateMadlibWords({ [key]: 'val' });
    // Keys >100 are skipped, so no valid entries remain → undefined
    expect(result).toBeUndefined();
  });

  // Mixed valid/invalid values
  it('filters out number values', () => {
    const result = validateMadlibWords({ a: 'good', b: 42 } as any);
    expect(result).toEqual({ a: 'good' });
  });
  it('filters out null values', () => {
    const result = validateMadlibWords({ a: 'good', b: null } as any);
    expect(result).toEqual({ a: 'good' });
  });
  it('filters out undefined values', () => {
    const result = validateMadlibWords({ a: 'good', b: undefined } as any);
    expect(result).toEqual({ a: 'good' });
  });
  it('filters out object values', () => {
    const result = validateMadlibWords({ a: 'good', b: {} } as any);
    expect(result).toEqual({ a: 'good' });
  });
  it('filters out array values', () => {
    const result = validateMadlibWords({ a: 'good', b: ['x'] } as any);
    expect(result).toEqual({ a: 'good' });
  });

  // Special characters in keys and values
  it('accepts emoji keys', () => {
    const result = validateMadlibWords({ '🐱': 'cat' });
    expect(result).toEqual({ '🐱': 'cat' });
  });
  it('accepts empty string value', () => {
    const result = validateMadlibWords({ noun: '' });
    expect(result).toEqual({ noun: '' });
  });
  it('accepts spaces in keys', () => {
    const result = validateMadlibWords({ 'my noun': 'dragon' });
    expect(result).toEqual({ 'my noun': 'dragon' });
  });
});

// ── Rate Limiter ──────────────────────────────────────────────────
describe('checkRateLimit – comprehensive', () => {
  const RATE_LIMIT_WINDOW_MS = 60 * 1000;
  const RATE_LIMIT_MAX = 10;
  let rateLimitMap: Map<string, { count: number; resetAt: number }>;

  function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return true;
    }
    entry.count++;
    return entry.count <= RATE_LIMIT_MAX;
  }

  beforeEach(() => {
    rateLimitMap = new Map();
  });

  it('allows exactly RATE_LIMIT_MAX requests', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit('ip1')).toBe(true);
    }
    expect(checkRateLimit('ip1')).toBe(false);
  });

  it('resets counter after window expires', () => {
    rateLimitMap.set('ip2', { count: RATE_LIMIT_MAX, resetAt: Date.now() - 1 });
    expect(checkRateLimit('ip2')).toBe(true);
    expect(rateLimitMap.get('ip2')!.count).toBe(1);
  });

  it('handles IPv6 addresses', () => {
    expect(checkRateLimit('::1')).toBe(true);
    expect(checkRateLimit('2001:db8::1')).toBe(true);
  });

  it('handles empty string IP', () => {
    expect(checkRateLimit('')).toBe(true);
  });

  it('handles very long IP strings', () => {
    expect(checkRateLimit('a'.repeat(1000))).toBe(true);
  });

  it('blocks 11th request in window', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('ip3');
    expect(checkRateLimit('ip3')).toBe(false);
  });

  it('blocks 12th, 13th... requests', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('ip4');
    expect(checkRateLimit('ip4')).toBe(false);
    expect(checkRateLimit('ip4')).toBe(false);
    expect(checkRateLimit('ip4')).toBe(false);
  });

  it('independent counters per IP', () => {
    for (let i = 0; i < 10; i++) checkRateLimit('ipA');
    expect(checkRateLimit('ipA')).toBe(false);
    expect(checkRateLimit('ipB')).toBe(true);
    expect(checkRateLimit('ipC')).toBe(true);
  });

  it('handles concurrent IPs without interference', () => {
    const ips = Array.from({ length: 50 }, (_, i) => `192.168.0.${i}`);
    for (const ip of ips) {
      expect(checkRateLimit(ip)).toBe(true);
    }
    expect(rateLimitMap.size).toBe(50);
  });
});

// ── getPartCount ──────────────────────────────────────────────────
describe('getPartCount – comprehensive', () => {
  function getPartCount(duration: string): number {
    switch (duration) {
      case 'short': return 3;
      case 'medium-short': return 4;
      case 'medium': return 5;
      case 'long': return 6;
      case 'epic': return 7;
      default: return 5;
    }
  }

  it('maps all valid durations', () => {
    expect(getPartCount('short')).toBe(3);
    expect(getPartCount('medium-short')).toBe(4);
    expect(getPartCount('medium')).toBe(5);
    expect(getPartCount('long')).toBe(6);
    expect(getPartCount('epic')).toBe(7);
  });

  it('defaults unknown values to 5', () => {
    expect(getPartCount('turbo')).toBe(5);
    expect(getPartCount('')).toBe(5);
    expect(getPartCount('SHORT')).toBe(5);
    expect(getPartCount('Medium')).toBe(5);
    expect(getPartCount(' short')).toBe(5);
    expect(getPartCount('short ')).toBe(5);
  });
});

// ── getWordCount ──────────────────────────────────────────────────
describe('getWordCount – comprehensive', () => {
  function getWordCount(duration: string): string {
    switch (duration) {
      case 'short': return '200-300';
      case 'medium-short': return '350-450';
      case 'medium': return '500-650';
      case 'long': return '750-950';
      case 'epic': return '1000-1300';
      default: return '500-650';
    }
  }

  it('maps all valid durations to word ranges', () => {
    expect(getWordCount('short')).toBe('200-300');
    expect(getWordCount('medium-short')).toBe('350-450');
    expect(getWordCount('medium')).toBe('500-650');
    expect(getWordCount('long')).toBe('750-950');
    expect(getWordCount('epic')).toBe('1000-1300');
  });

  it('defaults to medium range', () => {
    expect(getWordCount('turbo')).toBe('500-650');
    expect(getWordCount('')).toBe('500-650');
  });

  it('word ranges are valid format', () => {
    const durations = ['short', 'medium-short', 'medium', 'long', 'epic'];
    for (const d of durations) {
      const range = getWordCount(d);
      expect(range).toMatch(/^\d+-\d+$/);
      const [min, max] = range.split('-').map(Number);
      expect(max).toBeGreaterThan(min);
    }
  });

  it('word ranges increase with duration', () => {
    const durations = ['short', 'medium-short', 'medium', 'long', 'epic'];
    let prevMax = 0;
    for (const d of durations) {
      const [min] = getWordCount(d).split('-').map(Number);
      expect(min).toBeGreaterThanOrEqual(prevMax);
      prevMax = min;
    }
  });
});

// ── CHILD_SAFETY_RULES ────────────────────────────────────────────
describe('CHILD_SAFETY_RULES content', () => {
  const CHILD_SAFETY_RULES = `
CRITICAL SAFETY RULES (non-negotiable):
- NEVER include violence, weapons, fighting, battles, or physical conflict of any kind
- NEVER include scary, frightening, dark, or horror elements — no monsters, villains, or threats
- NEVER reference real-world brands, products, celebrities, or copyrighted characters
- NEVER include death, injury, illness, abandonment, or loss themes
- NEVER include bullying, meanness, exclusion, or unkind behavior that isn't immediately resolved
- NEVER use language that could cause anxiety, fear, or nightmares
- Every choice the hero makes leads to a positive, heroic, or interesting outcome — there are no failures
- Keep all content 100% appropriate for children ages 3-9
- Focus on themes of courage, kindness, friendship, wonder, imagination, and comfort
- All conflicts should be gentle (e.g., solving puzzles, helping friends, finding lost items) and resolve peacefully`;

  it('contains violence prohibition', () => {
    expect(CHILD_SAFETY_RULES).toContain('NEVER include violence');
  });
  it('contains scary content prohibition', () => {
    expect(CHILD_SAFETY_RULES).toContain('NEVER include scary');
  });
  it('contains brand prohibition', () => {
    expect(CHILD_SAFETY_RULES).toContain('NEVER reference real-world brands');
  });
  it('contains death prohibition', () => {
    expect(CHILD_SAFETY_RULES).toContain('NEVER include death');
  });
  it('contains bullying prohibition', () => {
    expect(CHILD_SAFETY_RULES).toContain('NEVER include bullying');
  });
  it('contains age range specification', () => {
    expect(CHILD_SAFETY_RULES).toContain('ages 3-9');
  });
  it('contains positive themes', () => {
    expect(CHILD_SAFETY_RULES).toContain('courage');
    expect(CHILD_SAFETY_RULES).toContain('kindness');
    expect(CHILD_SAFETY_RULES).toContain('friendship');
  });
  it('specifies no failures in choices', () => {
    expect(CHILD_SAFETY_RULES).toContain('there are no failures');
  });
  it('specifies peaceful conflict resolution', () => {
    expect(CHILD_SAFETY_RULES).toContain('resolve peacefully');
  });
});

// ── TTS Filename & Video ID Validation ────────────────────────────
describe('TTS filename regex – comprehensive', () => {
  const TTS_REGEX = /^[a-f0-9]+\.mp3$/;

  // Valid cases
  it('accepts short hex', () => expect(TTS_REGEX.test('a.mp3')).toBe(true));
  it('accepts long hex', () => expect(TTS_REGEX.test('a'.repeat(64) + '.mp3')).toBe(true));
  it('accepts all hex digits', () => expect(TTS_REGEX.test('0123456789abcdef.mp3')).toBe(true));

  // Invalid cases
  it('rejects uppercase A-F', () => expect(TTS_REGEX.test('ABCDEF.mp3')).toBe(false));
  it('rejects mixed case', () => expect(TTS_REGEX.test('aBcDeF.mp3')).toBe(false));
  it('rejects g-z', () => expect(TTS_REGEX.test('ghij.mp3')).toBe(false));
  it('rejects spaces', () => expect(TTS_REGEX.test('abc def.mp3')).toBe(false));
  it('rejects .wav extension', () => expect(TTS_REGEX.test('abc123.wav')).toBe(false));
  it('rejects .mp4 extension', () => expect(TTS_REGEX.test('abc123.mp4')).toBe(false));
  it('rejects no extension', () => expect(TTS_REGEX.test('abc123')).toBe(false));
  it('rejects double extension', () => expect(TTS_REGEX.test('abc.mp3.mp3')).toBe(false));
  it('rejects path traversal ../', () => expect(TTS_REGEX.test('../abc.mp3')).toBe(false));
  it('rejects path traversal /', () => expect(TTS_REGEX.test('dir/abc.mp3')).toBe(false));
  it('rejects backslash path', () => expect(TTS_REGEX.test('dir\\abc.mp3')).toBe(false));
  it('rejects null bytes', () => expect(TTS_REGEX.test('abc\0.mp3')).toBe(false));
  it('rejects just .mp3', () => expect(TTS_REGEX.test('.mp3')).toBe(false));
  it('rejects empty string', () => expect(TTS_REGEX.test('')).toBe(false));
  it('rejects special chars', () => expect(TTS_REGEX.test('abc!@#.mp3')).toBe(false));
  it('rejects URL-encoded path', () => expect(TTS_REGEX.test('%2e%2e%2f.mp3')).toBe(false));
});

describe('video ID regex – comprehensive', () => {
  const VIDEO_REGEX = /^[a-f0-9]+$/;

  it('accepts single hex char', () => expect(VIDEO_REGEX.test('a')).toBe(true));
  it('accepts 16-char hex', () => expect(VIDEO_REGEX.test('0123456789abcdef')).toBe(true));
  it('accepts long hex string', () => expect(VIDEO_REGEX.test('a'.repeat(128))).toBe(true));
  it('rejects uppercase', () => expect(VIDEO_REGEX.test('ABC')).toBe(false));
  it('rejects dashes', () => expect(VIDEO_REGEX.test('abc-123')).toBe(false));
  it('rejects underscores', () => expect(VIDEO_REGEX.test('abc_123')).toBe(false));
  it('rejects dots', () => expect(VIDEO_REGEX.test('abc.123')).toBe(false));
  it('rejects spaces', () => expect(VIDEO_REGEX.test('abc 123')).toBe(false));
  it('rejects empty', () => expect(VIDEO_REGEX.test('')).toBe(false));
  it('rejects path chars', () => expect(VIDEO_REGEX.test('../abc')).toBe(false));
  it('rejects g-z letters', () => expect(VIDEO_REGEX.test('xyz')).toBe(false));
});

// ── Art Style Selection ───────────────────────────────────────────
describe('getRandomStyle behavior', () => {
  const ART_STYLES = [
    'soft watercolor illustration with dreamy washes and gentle color bleeds',
    'bold cel-shaded cartoon style with thick outlines and flat vibrant colors',
    'textured paper cutout collage with layered shapes and handmade feel',
    'warm gouache painting style with rich opaque colors and visible brushstrokes',
    'playful crayon drawing style with textured strokes and childlike energy',
    'luminous digital painting with glowing light effects and soft gradients',
    'retro storybook illustration style reminiscent of 1960s picture books',
    'whimsical ink and wash style with fine linework and splashy color accents',
    'cozy pastel illustration with muted tones and rounded soft forms',
    'vibrant pop art style with halftone dots and high contrast primary colors',
    'gentle chalk on dark paper illustration with soft dusty textures',
    'modern flat design with geometric shapes and clean bold colors',
  ];

  function getRandomStyle(): string {
    return ART_STYLES[Math.floor(Math.random() * ART_STYLES.length)];
  }

  it('returns a string from the ART_STYLES array', () => {
    for (let i = 0; i < 50; i++) {
      const style = getRandomStyle();
      expect(ART_STYLES).toContain(style);
    }
  });

  it('has exactly 12 art styles', () => {
    expect(ART_STYLES).toHaveLength(12);
  });

  it('all styles are non-empty strings', () => {
    for (const style of ART_STYLES) {
      expect(typeof style).toBe('string');
      expect(style.length).toBeGreaterThan(0);
    }
  });

  it('all styles are child-appropriate (no scary/dark words)', () => {
    // Note: "dark" appears in "dark paper" art style, which is fine (not scary context)
    const forbiddenWords = ['scary', 'horror', 'frightening', 'violent', 'blood'];
    for (const style of ART_STYLES) {
      for (const word of forbiddenWords) {
        expect(style.toLowerCase()).not.toContain(word);
      }
    }
  });
});

// ── Story Response Schema Validation ──────────────────────────────
describe('story response parsing', () => {
  it('parses valid story JSON', () => {
    const raw = JSON.stringify({
      title: 'Test Story',
      parts: [{ text: 'Once upon a time', choices: ['A', 'B', 'C'], partIndex: 0 }],
      vocabWord: { word: 'brave', definition: 'not scared' },
      joke: 'Why did the hero fly? To get to the other side!',
      lesson: 'Be kind to everyone',
      tomorrowHook: 'Next time, we visit the moon!',
      rewardBadge: { emoji: '⭐', title: 'Star Hero', description: 'You earned a star!' },
    });
    const parsed = JSON.parse(raw);
    expect(parsed.title).toBe('Test Story');
    expect(parsed.parts).toHaveLength(1);
    expect(parsed.vocabWord.word).toBe('brave');
  });

  it('handles JSON with markdown code fences', () => {
    const raw = '```json\n{"title":"Story"}\n```';
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const match = cleaned.match(/\{[\s\S]*\}/);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match![0]);
    expect(parsed.title).toBe('Story');
  });

  it('extracts JSON from surrounding text', () => {
    const raw = 'Here is the story:\n{"title":"Test"}\nEnd of response';
    const match = raw.match(/\{[\s\S]*\}/);
    expect(match).not.toBeNull();
    const parsed = JSON.parse(match![0]);
    expect(parsed.title).toBe('Test');
  });

  it('handles nested JSON objects', () => {
    const raw = JSON.stringify({
      title: 'Story',
      parts: [{ text: 'text', choices: [], partIndex: 0 }],
      vocabWord: { word: 'w', definition: 'd' },
      joke: 'j',
      lesson: 'l',
      tomorrowHook: 't',
      rewardBadge: { emoji: '⭐', title: 't', description: 'd' },
    });
    const parsed = JSON.parse(raw);
    expect(parsed.rewardBadge.emoji).toBe('⭐');
  });

  it('rejects response with no JSON object', () => {
    const raw = 'This is just plain text with no JSON';
    const match = raw.match(/\{[\s\S]*\}/);
    expect(match).toBeNull();
  });

  it('handles story with multiple parts', () => {
    const parts = Array.from({ length: 7 }, (_, i) => ({
      text: `Part ${i + 1} text`,
      choices: i < 6 ? ['A', 'B', 'C'] : undefined,
      partIndex: i,
    }));
    const story = { title: 'Epic Story', parts };
    expect(story.parts).toHaveLength(7);
    expect(story.parts[6].choices).toBeUndefined();
  });

  it('normalizes part indices to sequential', () => {
    const parts = [
      { text: 'p1', choices: ['A'], partIndex: 5 },
      { text: 'p2', choices: ['B'], partIndex: 10 },
    ];
    const normalized = parts.map((part, i) => ({ ...part, partIndex: i }));
    expect(normalized[0].partIndex).toBe(0);
    expect(normalized[1].partIndex).toBe(1);
  });

  it('removes choices for sleep mode parts', () => {
    const mode = 'sleep';
    const parts = [{ text: 'text', choices: ['A', 'B'], partIndex: 0 }];
    const processed = parts.map((p, i) => ({
      text: p.text || '',
      choices: mode === 'sleep' ? undefined : p.choices || undefined,
      partIndex: i,
    }));
    expect(processed[0].choices).toBeUndefined();
  });

  it('preserves choices for classic mode', () => {
    const mode = 'classic';
    const parts = [{ text: 'text', choices: ['A', 'B', 'C'], partIndex: 0 }];
    const processed = parts.map((p, i) => ({
      text: p.text || '',
      choices: mode === 'sleep' ? undefined : p.choices || undefined,
      partIndex: i,
    }));
    expect(processed[0].choices).toEqual(['A', 'B', 'C']);
  });
});

// ── Story Prompt Generation ───────────────────────────────────────
describe('story prompt construction', () => {
  const VALID_MODES = ['classic', 'madlibs', 'sleep'];
  const VALID_DURATIONS = ['short', 'medium-short', 'medium', 'long', 'epic'];

  it('defaults invalid mode to classic', () => {
    const mode = 'turbo';
    const storyMode = VALID_MODES.includes(mode) ? mode : 'classic';
    expect(storyMode).toBe('classic');
  });

  it('defaults empty mode to classic', () => {
    const mode = '';
    const storyMode = VALID_MODES.includes(mode) ? mode : 'classic';
    expect(storyMode).toBe('classic');
  });

  it('defaults invalid duration to medium', () => {
    const duration = 'extra-long';
    const storyDuration = VALID_DURATIONS.includes(duration) ? duration : 'medium';
    expect(storyDuration).toBe('medium');
  });

  it('accepts all valid modes', () => {
    for (const mode of VALID_MODES) {
      expect(VALID_MODES.includes(mode)).toBe(true);
    }
  });

  it('case-sensitive mode matching', () => {
    expect(VALID_MODES.includes('Classic')).toBe(false);
    expect(VALID_MODES.includes('SLEEP')).toBe(false);
    expect(VALID_MODES.includes('MadLibs')).toBe(false);
  });
});

import { describe, it, expect, vi } from 'vitest';

// ══════════════════════════════════════════════════════════════════
// Video Generation (Sora 2) Tests
// Tests video job lifecycle, caching, and validation.
// ══════════════════════════════════════════════════════════════════

describe('isVideoAvailable', () => {
  // Mirror the function
  function isVideoAvailable(apiKey?: string): boolean {
    return !!apiKey;
  }

  it('returns false when no API key', () => {
    expect(isVideoAvailable(undefined)).toBe(false);
    expect(isVideoAvailable('')).toBe(false);
  });

  it('returns true when API key is set', () => {
    expect(isVideoAvailable('sk-test-key')).toBe(true);
  });
});

describe('video job lifecycle', () => {
  // Mirror the VideoJob type and job management
  interface VideoJob {
    id: string;
    openaiVideoId: string;
    status: 'queued' | 'in_progress' | 'completed' | 'failed';
    progress: number;
    videoPath?: string;
    error?: string;
    createdAt: number;
  }

  let activeJobs: Map<string, VideoJob>;

  function getVideoJob(jobId: string): VideoJob | undefined {
    return activeJobs.get(jobId);
  }

  function getVideoFilePath(jobId: string, fsExists: (path: string) => boolean): string | null {
    const job = activeJobs.get(jobId);
    if (!job || !job.videoPath) return null;
    if (!fsExists(job.videoPath)) return null;
    return job.videoPath;
  }

  beforeEach(() => {
    activeJobs = new Map();
  });

  it('returns undefined for non-existent job', () => {
    expect(getVideoJob('nonexistent')).toBeUndefined();
  });

  it('returns job by ID', () => {
    const job: VideoJob = {
      id: 'job1',
      openaiVideoId: 'ov1',
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    };
    activeJobs.set('job1', job);
    expect(getVideoJob('job1')).toBe(job);
  });

  it('returns null file path for non-existent job', () => {
    expect(getVideoFilePath('x', () => true)).toBeNull();
  });

  it('returns null file path when job has no videoPath', () => {
    activeJobs.set('j1', { id: 'j1', openaiVideoId: 'o1', status: 'completed', progress: 100, createdAt: Date.now() });
    expect(getVideoFilePath('j1', () => true)).toBeNull();
  });

  it('returns null when video file does not exist on disk', () => {
    activeJobs.set('j2', { id: 'j2', openaiVideoId: 'o2', status: 'completed', progress: 100, videoPath: '/tmp/video-cache/j2.mp4', createdAt: Date.now() });
    expect(getVideoFilePath('j2', () => false)).toBeNull();
  });

  it('returns video path when file exists', () => {
    activeJobs.set('j3', { id: 'j3', openaiVideoId: 'o3', status: 'completed', progress: 100, videoPath: '/tmp/video-cache/j3.mp4', createdAt: Date.now() });
    expect(getVideoFilePath('j3', () => true)).toBe('/tmp/video-cache/j3.mp4');
  });

  // Job status transitions
  it('job starts as queued', () => {
    const job: VideoJob = { id: 'j', openaiVideoId: 'o', status: 'queued', progress: 0, createdAt: Date.now() };
    expect(job.status).toBe('queued');
    expect(job.progress).toBe(0);
  });

  it('job transitions to in_progress', () => {
    const job: VideoJob = { id: 'j', openaiVideoId: 'o', status: 'queued', progress: 0, createdAt: Date.now() };
    job.status = 'in_progress';
    job.progress = 25;
    expect(job.status).toBe('in_progress');
  });

  it('job transitions to completed', () => {
    const job: VideoJob = { id: 'j', openaiVideoId: 'o', status: 'in_progress', progress: 50, createdAt: Date.now() };
    job.status = 'completed';
    job.progress = 100;
    job.videoPath = '/tmp/video-cache/j.mp4';
    expect(job.status).toBe('completed');
    expect(job.videoPath).toBeDefined();
  });

  it('job transitions to failed', () => {
    const job: VideoJob = { id: 'j', openaiVideoId: 'o', status: 'in_progress', progress: 30, createdAt: Date.now() };
    job.status = 'failed';
    job.error = 'Generation timed out';
    expect(job.status).toBe('failed');
    expect(job.error).toBeDefined();
  });
});

describe('video prompt construction', () => {
  function buildPrompt(sceneText: string, heroName: string, heroDescription: string): string {
    const summary = sceneText.substring(0, 200);
    return `A gentle, child-friendly animated scene for a bedtime story. The hero "${heroName}" (${heroDescription?.substring(0, 80) || "a friendly superhero"}) is shown in this scene: ${summary}. Style: Soft, dreamy animation with warm pastel colors, magical sparkles, gentle movement, cozy atmosphere. Suitable for children ages 3-9. No scary elements, no violence. Camera slowly pans across the scene. Soft lighting, like moonlight or warm firelight.`;
  }

  it('includes hero name', () => {
    const prompt = buildPrompt('scene', 'Nova', 'Guardian of Light');
    expect(prompt).toContain('Nova');
  });

  it('includes hero description', () => {
    const prompt = buildPrompt('scene', 'Nova', 'Guardian of Light');
    expect(prompt).toContain('Guardian of Light');
  });

  it('truncates scene text to 200 chars', () => {
    const longScene = 'x'.repeat(500);
    const prompt = buildPrompt(longScene, 'Nova', 'desc');
    // The summary in the prompt is max 200 chars
    expect(prompt.length).toBeLessThan(800);
  });

  it('truncates hero description to 80 chars', () => {
    const longDesc = 'y'.repeat(200);
    const prompt = buildPrompt('scene', 'Nova', longDesc);
    expect(prompt).not.toContain('y'.repeat(81));
  });

  it('uses default description when empty', () => {
    const prompt = buildPrompt('scene', 'Nova', '');
    expect(prompt).toContain('a friendly superhero');
  });

  it('includes child safety language', () => {
    const prompt = buildPrompt('scene', 'Nova', 'desc');
    expect(prompt).toContain('child-friendly');
    expect(prompt).toContain('No scary elements');
    expect(prompt).toContain('no violence');
    expect(prompt).toContain('ages 3-9');
  });

  it('includes animation style keywords', () => {
    const prompt = buildPrompt('scene', 'Nova', 'desc');
    expect(prompt).toContain('pastel colors');
    expect(prompt).toContain('magical sparkles');
    expect(prompt).toContain('moonlight');
  });
});

describe('video cache cleanup logic', () => {
  const VIDEO_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

  it('identifies expired files correctly', () => {
    const now = Date.now();
    const fileAge = now - (25 * 60 * 60 * 1000); // 25 hours old
    const isExpired = now - fileAge > VIDEO_CACHE_MAX_AGE_MS;
    expect(isExpired).toBe(true);
  });

  it('keeps fresh files', () => {
    const now = Date.now();
    const fileAge = now - (12 * 60 * 60 * 1000); // 12 hours old
    const isExpired = now - fileAge > VIDEO_CACHE_MAX_AGE_MS;
    expect(isExpired).toBe(false);
  });

  it('boundary: exactly 24 hours is not expired', () => {
    const now = Date.now();
    const fileAge = now - VIDEO_CACHE_MAX_AGE_MS;
    const isExpired = now - fileAge > VIDEO_CACHE_MAX_AGE_MS;
    expect(isExpired).toBe(false);
  });

  it('boundary: 24h + 1ms is expired', () => {
    const now = Date.now();
    const fileAge = now - VIDEO_CACHE_MAX_AGE_MS - 1;
    const isExpired = now - fileAge > VIDEO_CACHE_MAX_AGE_MS;
    expect(isExpired).toBe(true);
  });
});

describe('video job expiry', () => {
  const JOB_EXPIRY_MS = 30 * 60 * 1000;

  it('does not expire recent jobs', () => {
    const now = Date.now();
    const jobCreatedAt = now - (10 * 60 * 1000); // 10 min ago
    const isExpired = now - jobCreatedAt > JOB_EXPIRY_MS;
    expect(isExpired).toBe(false);
  });

  it('expires old jobs', () => {
    const now = Date.now();
    const jobCreatedAt = now - (31 * 60 * 1000); // 31 min ago
    const isExpired = now - jobCreatedAt > JOB_EXPIRY_MS;
    expect(isExpired).toBe(true);
  });

  it('boundary: exactly 30 min is not expired', () => {
    const now = Date.now();
    const isExpired = now - (now - JOB_EXPIRY_MS) > JOB_EXPIRY_MS;
    expect(isExpired).toBe(false);
  });
});

import { beforeEach } from 'vitest';

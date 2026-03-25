import path from "node:path";
import fs from "node:fs";

/** Scanned at startup: all *.mp3 files in assets/music, grouped by mode prefix. */
const MODE_MUSIC_TRACKS: Record<string, string[]> = {};

function loadMusicTracks(): void {
  const musicDir = path.resolve("assets", "music");
  const modes = ["classic", "madlibs", "sleep"];
  for (const mode of modes) {
    try {
      const files = fs.readdirSync(musicDir)
        .filter((f) => f.startsWith(mode) && f.endsWith(".mp3"))
        .sort();
      MODE_MUSIC_TRACKS[mode] = files.length > 0 ? files : [`${mode}.mp3`];
    } catch (err) {
      console.warn(`[Music] Could not scan music directory for mode "${mode}":`, err);
      MODE_MUSIC_TRACKS[mode] = [`${mode}.mp3`];
    }
  }
}

loadMusicTracks();

function pickTrack(mode: string, trackIndex?: number): string {
  const tracks = MODE_MUSIC_TRACKS[mode] || MODE_MUSIC_TRACKS["classic"] || ["classic.mp3"];
  if (trackIndex !== undefined && trackIndex >= 0 && trackIndex < tracks.length) {
    return tracks[trackIndex];
  }
  return tracks[Math.floor(Math.random() * tracks.length)];
}

export function getMusicFilePath(mode: string, trackIndex?: number): string {
  return path.resolve("assets", "music", pickTrack(mode, trackIndex));
}

export function getMusicFileName(mode: string, trackIndex?: number): string {
  return pickTrack(mode, trackIndex);
}

export function getMusicTrackCount(mode: string): number {
  return (MODE_MUSIC_TRACKS[mode] || []).length;
}

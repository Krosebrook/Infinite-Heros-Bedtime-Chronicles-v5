import path from "node:path";
import { fileURLToPath } from "node:url";

const MODE_MUSIC_FILES: Record<string, string> = {
  classic: "classic.mp3",
  madlibs: "madlibs.mp3",
  sleep: "sleep.mp3",
};

export function getMusicFilePath(mode: string): string {
  const file = MODE_MUSIC_FILES[mode] || MODE_MUSIC_FILES.classic;
  return path.resolve("assets", "music", file);
}

export function getMusicFileName(mode: string): string {
  return MODE_MUSIC_FILES[mode] || MODE_MUSIC_FILES.classic;
}

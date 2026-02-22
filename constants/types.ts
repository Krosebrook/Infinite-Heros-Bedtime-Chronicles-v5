export interface StoryPart {
  text: string;
  choices?: string[];
  partIndex: number;
}

export interface StoryFull {
  title: string;
  parts: StoryPart[];
  vocabWord: { word: string; definition: string };
  joke: string;
  lesson: string;
  tomorrowHook: string;
  rewardBadge: { emoji: string; title: string; description: string };
}

export interface CachedStory {
  id: string;
  timestamp: number;
  story: StoryFull;
  avatar?: string;
  scenes?: Record<number, string>;
  heroId: string;
  mode: string;
  profileId?: string;
  feedback?: {
    rating: number;
    text: string;
    timestamp: number;
  };
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  favoriteHeroId: string;
  avatarEmoji: string;
  createdAt: number;
}

export interface EarnedBadge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earnedAt: number;
  storyId?: string;
  profileId: string;
}

export interface StreakData {
  profileId: string;
  currentStreak: number;
  longestStreak: number;
  lastStoryDate: string;
}

export interface ParentControls {
  maxStoryLength: string;
  bedtimeHour: number;
  bedtimeMinute: number;
  bedtimeEnabled: boolean;
  allowedThemes: string[];
  pinCode: string;
}

export const DEFAULT_PARENT_CONTROLS: ParentControls = {
  maxStoryLength: 'epic',
  bedtimeHour: 20,
  bedtimeMinute: 0,
  bedtimeEnabled: false,
  allowedThemes: ['courage', 'kindness', 'friendship', 'wonder', 'imagination', 'comfort'],
  pinCode: '',
};

export interface UserPreferences {
  narratorVoice: string;
  storyLength: string;
  sleepTheme: string;
  fontSize: 'normal' | 'large';
  isMuted: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  narratorVoice: 'Kore',
  storyLength: 'medium',
  sleepTheme: 'Cloud Kingdom',
  fontSize: 'normal',
  isMuted: false,
  reducedMotion: false,
};

export const AVATAR_EMOJIS = ['🦸', '🧙', '🦊', '🐱', '🦄', '🌟', '🚀', '🦋', '🐼', '🦁', '🐸', '🌈'];

export const BADGE_DEFINITIONS = [
  { id: 'first-adventure', emoji: '🌟', title: 'First Adventure', description: 'Completed your very first story!', condition: 'first_story' },
  { id: 'night-owl', emoji: '🦉', title: 'Night Owl', description: 'Listened to a story after 8 PM', condition: 'night_story' },
  { id: 'early-bird', emoji: '🐦', title: 'Early Bird', description: 'Started a story in the morning', condition: 'morning_story' },
  { id: 'all-heroes', emoji: '🏆', title: 'Hero Collector', description: 'Used every hero at least once', condition: 'all_heroes' },
  { id: 'mad-libs-master', emoji: '🤪', title: 'Silly Storyteller', description: 'Completed 3 Mad Libs stories', condition: 'madlibs_3' },
  { id: 'dream-weaver', emoji: '🌙', title: 'Dream Weaver', description: 'Completed 3 Sleep mode stories', condition: 'sleep_3' },
  { id: 'classic-champion', emoji: '⚔️', title: 'Classic Champion', description: 'Completed 5 Classic stories', condition: 'classic_5' },
  { id: 'story-streak-3', emoji: '🔥', title: 'On Fire!', description: '3-day story streak', condition: 'streak_3' },
  { id: 'story-streak-7', emoji: '💎', title: 'Diamond Reader', description: '7-day story streak', condition: 'streak_7' },
  { id: 'bookworm', emoji: '📚', title: 'Bookworm', description: 'Completed 10 stories total', condition: 'total_10' },
  { id: 'legend', emoji: '👑', title: 'Story Legend', description: 'Completed 25 stories total', condition: 'total_25' },
  { id: 'vocabulary-star', emoji: '📖', title: 'Word Wizard', description: 'Learned 5 new vocabulary words', condition: 'vocab_5' },
] as const;

export const CONTENT_THEMES = [
  { id: 'courage', label: 'Courage', emoji: '🦁' },
  { id: 'kindness', label: 'Kindness', emoji: '💗' },
  { id: 'friendship', label: 'Friendship', emoji: '🤝' },
  { id: 'wonder', label: 'Wonder', emoji: '✨' },
  { id: 'imagination', label: 'Imagination', emoji: '🌈' },
  { id: 'comfort', label: 'Comfort', emoji: '🧸' },
];

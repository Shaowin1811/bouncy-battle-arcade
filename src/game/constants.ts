export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const COLORS = {
  PLAYER: '#4ade80', // Green
  ENEMY: '#f87171', // Red
  BOSS: '#a78bfa', // Purple
  GOLD: '#fbbf24', // Amber
  SWORD: '#60a5fa', // Blue
  GUN: '#f472b6', // Pink
  SPEAR: '#fb923c', // Orange
  HAMMER: '#a8a29e', // Stone
  BACKGROUND: '#f8fafc',
  UI_BG: 'rgba(255, 255, 255, 0.8)',
  ZONE: 'rgba(239, 68, 68, 0.2)', // Reddish transparent for zone
  ZONE_BORDER: '#ef4444',
  SOUL: '#8b5cf6', // Violet for souls
};

export const LEVEL_THEMES = [
  {
    name: "The Emerald Grove",
    story: "You are the Forest Guardian. Protect the ancient trees from the corrupted spirits.",
    bg: "#064e3b", // Dark green
    player: "#4ade80",
    enemy: "#f87171",
  },
  {
    name: "The Scorched Sands",
    story: "As the Desert Raider, you must survive the relentless heat and the sand-dwelling monsters.",
    bg: "#451a03", // Dark brown/orange
    player: "#fbbf24",
    enemy: "#f97316",
  },
  {
    name: "The Abyssal Depths",
    story: "Deep beneath the waves, the Sea Warrior fights against the pressure and the horrors of the dark.",
    bg: "#082f49", // Dark blue
    player: "#38bdf8",
    enemy: "#6366f1",
  },
  {
    name: "The Obsidian Peak",
    story: "At the heart of the volcano, the Lava Knight faces the ultimate trial of fire.",
    bg: "#450a0a", // Dark red
    player: "#ef4444",
    enemy: "#7f1d1d",
  }
];

export const ZONE_CONFIG = {
  INITIAL_RADIUS: 1000,
  MIN_RADIUS: 100,
  SHRINK_RATE: 15, // pixels per second
  DAMAGE: 5, // damage per second
};

export const XP_CONFIG = {
  BASE_XP: 10,
  XP_GROWTH: 1.5,
};

export interface GameCore {
  id: string;
  name: string;
  description: string;
  type: 'stat' | 'skill';
  icon: string;
}

export const GAME_CORES: GameCore[] = [
  { id: 'dmg', name: 'Power Core', description: 'Increase damage by 20%', type: 'stat', icon: 'Sword' },
  { id: 'hp', name: 'Vitality Core', description: 'Increase Max HP by 20', type: 'stat', icon: 'Heart' },
  { id: 'spd', name: 'Agility Core', description: 'Increase movement speed by 10%', type: 'stat', icon: 'Zap' },
  { id: 'cdr', name: 'Focus Core', description: 'Reduce skill cooldown by 15%', type: 'stat', icon: 'Shield' },
  { id: 'range', name: 'Reach Core', description: 'Increase attack range by 15%', type: 'stat', icon: 'Target' },
  { id: 'crit', name: 'Precision Core', description: 'Increase crit chance by 5%', type: 'stat', icon: 'Crosshair' },
];

export const WEAPONS = {
  FISTS: 'Fists',
  SWORD: 'Glowing Sword',
  GUN: 'Bubble Gun',
  SPEAR: 'Fire Spear',
  HAMMER: 'Earth Hammer',
};

export enum GameState {
  START_MENU,
  PLAYING,
  LEVEL_UP,
  UPGRADE_MENU,
  GAME_OVER,
  VICTORY,
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface UpgradeStats {
  hp: number;
  damage: number;
  speed: number;
  cooldown: number;
  skin: string;
}

export interface SaveData {
  gold: number;
  souls: number;
  level: number;
  playerLevel: number;
  playerExp: number;
  upgrades: UpgradeStats;
}

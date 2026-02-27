import { UpgradeStats, SaveData } from './types';

const DEFAULT_UPGRADES: UpgradeStats = {
  hp: 0,
  damage: 0,
  speed: 0,
  cooldown: 0,
  skin: '#4ade80'
};

export class UpgradeSystem {
  static save(data: SaveData) {
    localStorage.setItem('bouncy_battle_save', JSON.stringify(data));
  }

  static load(): SaveData {
    const saved = localStorage.getItem('bouncy_battle_save');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      gold: 0,
      souls: 0,
      level: 1,
      playerLevel: 1,
      playerExp: 0,
      upgrades: { ...DEFAULT_UPGRADES }
    };
  }

  static getUpgradeCost(level: number): number {
    return 10 + level * 10; // Lower cost since souls are more common
  }

  static getSkinCost(): number {
    return 200;
  }
}

import { Enemy } from './Enemy';
import { Boss } from './Boss';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export class LevelManager {
  currentLevel: number = 1;
  enemiesSpawned: number = 0;
  enemiesToSpawn: number = 10;
  enemiesKilled: number = 0;
  bossSpawned: boolean = false;
  isLevelComplete: boolean = false;
  spawnTimer: number = 0;
  spawnInterval: number = 2;

  constructor(level: number) {
    this.currentLevel = level;
    this.enemiesToSpawn = 5 + level * 5;
    this.spawnInterval = Math.max(0.5, 2 - level * 0.2);
  }

  update(deltaTime: number, spawnEnemy: (x: number, y: number) => void, spawnBoss: (x: number, y: number) => void) {
    if (this.isLevelComplete) return;

    if (this.enemiesSpawned < this.enemiesToSpawn) {
      this.spawnTimer += deltaTime;
      if (this.spawnTimer >= this.spawnInterval) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * CANVAS_WIDTH; y = -20; }
        else if (side === 1) { x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 20; }
        else if (side === 2) { x = -20; y = Math.random() * CANVAS_HEIGHT; }
        else { x = CANVAS_WIDTH + 20; y = Math.random() * CANVAS_HEIGHT; }
        
        spawnEnemy(x, y);
        this.enemiesSpawned++;
        this.spawnTimer = 0;
      }
    } else if (this.enemiesKilled >= this.enemiesToSpawn && !this.bossSpawned) {
      spawnBoss(CANVAS_WIDTH / 2, 100);
      this.bossSpawned = true;
    }
  }

  onEnemyKilled() {
    this.enemiesKilled++;
  }

  onBossKilled() {
    this.isLevelComplete = true;
  }
}

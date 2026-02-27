import { InputHandler } from './InputHandler';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Boss, Projectile } from './Boss';
import { LevelManager } from './LevelManager';
import { ParticleSystem } from './ParticleSystem';
import { WeaponPickup, WeaponFactory, SoulPickup } from './Weapon';
import { GameState, SaveData } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, WEAPONS, LEVEL_THEMES, GAME_CORES, GameCore } from './constants';
import { UpgradeSystem } from './UpgradeSystem';

/**
 * Main Game Engine
 * Handles the game loop, entity updates, collision detection, and rendering.
 */
export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: InputHandler;
  player: Player;
  enemies: Enemy[] = [];
  boss: Boss | null = null;
  projectiles: Projectile[] = [];
  pickups: WeaponPickup[] = [];
  souls: SoulPickup[] = [];
  levelUpOptions: GameCore[] = [];
  particles: ParticleSystem;
  levelManager: LevelManager;
  state: GameState = GameState.START_MENU;
  saveData: SaveData;
  
  // Zone (PUBG style)
  zoneRadius: number = 1000;
  zoneCenter: { x: number, y: number } = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
  zoneTimer: number = 0;

  lastTime: number = 0;
  shakeIntensity: number = 0;
  onStateChange: (state: GameState) => void;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.input = new InputHandler();
    this.particles = new ParticleSystem();
    this.onStateChange = onStateChange;
    
    this.saveData = UpgradeSystem.load();
    this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.player.applyUpgrades(this.saveData.upgrades);
    this.player.gold = this.saveData.gold;
    this.player.souls = this.saveData.souls || 0;
    this.player.level = this.saveData.playerLevel || 1;
    this.player.xp = this.saveData.playerExp || 0;
    this.player.xpToNextLevel = Math.floor(10 * Math.pow(1.5, this.player.level - 1));
    
    this.levelManager = new LevelManager(this.saveData.level);
    this.applyLevelTheme();
    
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  start() {
    this.state = GameState.PLAYING;
    this.onStateChange(this.state);
  }

  resetLevel() {
    this.enemies = [];
    this.boss = null;
    this.projectiles = [];
    this.pickups = [];
    this.player.x = CANVAS_WIDTH / 2;
    this.player.y = CANVAS_HEIGHT / 2;
    this.player.hp = this.player.maxHp;
    this.levelManager = new LevelManager(this.saveData.level);
    this.applyLevelTheme();
    this.zoneRadius = 1000;
    this.zoneCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
  }

  gameLoop(time: number) {
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (this.state === GameState.PLAYING) {
      this.update(deltaTime);
    }
    
    this.draw();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  applyLevelTheme() {
    const themeIndex = (this.levelManager.currentLevel - 1) % LEVEL_THEMES.length;
    const theme = LEVEL_THEMES[themeIndex];
    this.player.color = theme.player;
  }

  update(deltaTime: number) {
    if (this.shakeIntensity > 0) {
      this.shakeIntensity -= deltaTime * 10;
    }

    this.player.update(deltaTime, this.input);

    // Zone Logic
    this.updateZone(deltaTime);

    // Attacks
    if (this.input.wasJustPressed('j')) this.handleAttack('normal');
    if (this.input.wasJustPressed('k')) this.handleAttack('heavy');
    if (this.input.wasJustPressed('l')) {
      if (this.player.useSkill()) {
        this.handleAttack('skill');
      }
    }
    if (this.input.wasJustPressed(' ')) {
      if (this.player.dash()) {
        this.particles.spawn(this.player.x, this.player.y, '#fff', 10);
        this.shakeIntensity = 3;
      }
    }

    // Level Management
    const themeIndex = (this.levelManager.currentLevel - 1) % LEVEL_THEMES.length;
    const theme = LEVEL_THEMES[themeIndex];

    this.levelManager.update(
      deltaTime,
      (x, y) => {
        const enemy = new Enemy(x, y, this.levelManager.currentLevel);
        enemy.color = theme.enemy;
        this.enemies.push(enemy);
      },
      (x, y) => {
        this.boss = new Boss(x, y, this.levelManager.currentLevel);
        this.boss.color = theme.enemy; // Boss uses a variation of enemy color or its own
      }
    );

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(deltaTime, this.player);
      
      if (enemy.getDistance(this.player) < enemy.radius + this.player.radius) {
        this.player.takeDamage(enemy.damage * deltaTime * 10);
        if (this.player.isDead) {
          this.state = GameState.GAME_OVER;
          this.onStateChange(this.state);
        }
      }

      if (enemy.isDead) {
        this.player.gold += enemy.goldValue;
        this.player.killCount++;
        this.levelManager.onEnemyKilled();
        this.particles.spawn(enemy.x, enemy.y, enemy.color, 10);
        
        // Soul drop
        this.souls.push(new SoulPickup(enemy.x, enemy.y));

        // Random weapon drop
        if (Math.random() < 0.1) {
          this.pickups.push(new WeaponPickup(enemy.x, enemy.y, WeaponFactory.getRandom()));
        }
        
        this.enemies.splice(i, 1);
      }
    }

    // Boss
    if (this.boss) {
      this.boss.update(deltaTime, this.player, (x, y) => this.enemies.push(new Enemy(x, y, this.levelManager.currentLevel)));
      
      if (this.boss.getDistance(this.player) < this.boss.radius + this.player.radius) {
        this.player.takeDamage(this.boss.damage * deltaTime * 5);
      }

      if (this.boss.isDead) {
        this.player.gold += this.boss.goldValue;
        // Boss drops many souls
        for (let j = 0; j < 10; j++) {
          this.souls.push(new SoulPickup(this.boss.x + (Math.random() - 0.5) * 50, this.boss.y + (Math.random() - 0.5) * 50));
        }
        this.levelManager.onBossKilled();
        this.particles.spawn(this.boss.x, this.boss.y, this.boss.color, 30);
        this.boss = null;
        
        this.saveData.gold = this.player.gold;
        this.saveData.souls = this.player.souls;
        this.saveData.playerLevel = this.player.level;
        this.saveData.playerExp = this.player.xp;
        this.saveData.level++;
        UpgradeSystem.save(this.saveData);
        
        this.state = GameState.UPGRADE_MENU;
        this.onStateChange(this.state);
      }
    }

    // Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const dist = Math.sqrt((p.x - this.player.x)**2 + (p.y - this.player.y)**2);
      if (dist < p.radius + this.player.radius) {
        this.player.weapon = p.weapon;
        this.particles.spawnText(this.player.x, this.player.y - 30, `New Weapon: ${p.weapon.name}!`, p.weapon.color);
        this.pickups.splice(i, 1);
      }
    }

    // Souls
    for (let i = this.souls.length - 1; i >= 0; i--) {
      const s = this.souls[i];
      const dist = Math.sqrt((s.x - this.player.x)**2 + (s.y - this.player.y)**2);
      
      // Magnet effect
      if (dist < 150) {
        s.x += (this.player.x - s.x) * 0.1;
        s.y += (this.player.y - s.y) * 0.1;
      }

      if (dist < s.radius + this.player.radius) {
        this.player.souls++;
        if (this.player.addXp(1)) {
          this.triggerLevelUp();
        }
        this.particles.spawn(s.x, s.y, s.color, 3);
        this.souls.splice(i, 1);
      }
    }

    this.particles.update(deltaTime);
    this.input.clearJustPressed();
  }

  updateZone(deltaTime: number) {
    // Shrink zone
    if (this.zoneRadius > 100) {
      this.zoneRadius -= 15 * deltaTime;
    }

    // Check player distance to zone center
    const dx = this.player.x - this.zoneCenter.x;
    const dy = this.player.y - this.zoneCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.zoneRadius) {
      // Outside zone - take damage
      this.player.takeDamage(5 * deltaTime);
      if (Math.random() < 0.1) {
        this.particles.spawn(this.player.x, this.player.y, '#ef4444', 2);
      }
      if (this.player.isDead) {
        this.state = GameState.GAME_OVER;
        this.onStateChange(this.state);
      }
    }
  }

  triggerLevelUp() {
    this.state = GameState.LEVEL_UP;
    // Pick 3 random unique cores
    const shuffled = [...GAME_CORES].sort(() => 0.5 - Math.random());
    this.levelUpOptions = shuffled.slice(0, 3);
    this.onStateChange(this.state);
  }

  applyCore(coreId: string) {
    this.player.applyCore(coreId);
    this.saveData.playerLevel = this.player.level;
    this.saveData.playerExp = this.player.xp;
    this.saveData.souls = this.player.souls;
    UpgradeSystem.save(this.saveData);
    this.state = GameState.PLAYING;
    this.onStateChange(this.state);
  }

  handleAttack(type: 'normal' | 'heavy' | 'skill') {
    const attack = this.player.attack(type);
    let hitAny = false;

    // Visual effect for the attack itself
    const effectX = this.player.x + Math.cos(this.player.facing) * attack.range;
    const effectY = this.player.y + Math.sin(this.player.facing) * attack.range;

    if (type === 'skill') {
      switch (this.player.weapon.name) {
        case WEAPONS.SWORD:
          this.particles.spawnSpinEffect(this.player.x, this.player.y, attack.range, this.player.weapon.color);
          break;
        case WEAPONS.GUN:
          this.particles.spawnBubbleBurst(effectX, effectY, this.player.weapon.color);
          break;
        case WEAPONS.SPEAR:
          this.particles.spawnFireTrail(this.player.x, this.player.y);
          this.particles.spawnSlash(effectX, effectY, this.player.facing, this.player.weapon.color);
          break;
        case WEAPONS.HAMMER:
          this.particles.spawnShockwave(this.player.x, this.player.y, this.player.weapon.color);
          this.particles.spawnShockwave(this.player.x, this.player.y, '#fff');
          break;
      }
    } else {
      if (attack.effect === 'slash' || attack.effect === 'spin') {
        this.particles.spawnSlash(effectX, effectY, this.player.facing, this.player.weapon.color);
      } else if (attack.effect === 'shockwave' || attack.effect === 'slam') {
        this.particles.spawnShockwave(this.player.x, this.player.y, this.player.weapon.color);
      } else if (attack.effect === 'bubble' || attack.effect === 'triple-shot') {
        this.particles.spawn(effectX, effectY, this.player.weapon.color, 3);
      }
    }

    // Check enemies
    for (const enemy of this.enemies) {
      const dist = enemy.getDistance(this.player);
      if (dist < attack.range + enemy.radius) {
        let dmg = attack.damage;
        let isCrit = false;
        if (Math.random() < 0.2) {
          dmg *= 2;
          isCrit = true;
        }
        enemy.takeDamage(dmg);
        this.particles.spawn(enemy.x, enemy.y, '#fff', 5);
        if (isCrit) this.particles.spawnText(enemy.x, enemy.y, 'CRIT!', '#fbbf24');
        hitAny = true;
      }
    }

    // Check boss
    if (this.boss) {
      const dist = this.boss.getDistance(this.player);
      if (dist < attack.range + this.boss.radius) {
        this.boss.takeDamage(attack.damage);
        this.particles.spawn(this.boss.x, this.boss.y, '#fff', 5);
        hitAny = true;
      }
    }

    if (hitAny) {
      this.shakeIntensity = type === 'skill' ? 5 : 2;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const themeIndex = (this.levelManager.currentLevel - 1) % LEVEL_THEMES.length;
    const theme = LEVEL_THEMES[themeIndex];
    
    this.ctx.fillStyle = theme.bg;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid pattern for background
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, CANVAS_HEIGHT);
      this.ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }

    this.ctx.save();
    if (this.shakeIntensity > 0) {
      this.ctx.translate(Math.random() * this.shakeIntensity - this.shakeIntensity/2, Math.random() * this.shakeIntensity - this.shakeIntensity/2);
    }

    for (const p of this.pickups) p.draw(this.ctx);
    for (const s of this.souls) s.draw(this.ctx);
    for (const e of this.enemies) e.draw(this.ctx);
    if (this.boss) this.boss.draw(this.ctx);
    this.player.draw(this.ctx);
    this.particles.draw(this.ctx);

    this.ctx.restore();

    // Draw Zone (PUBG style)
    this.drawZone();

    // Hit Flash
    if (this.shakeIntensity > 1.5) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  drawZone() {
    this.ctx.save();
    
    // Create a path for the whole canvas
    this.ctx.beginPath();
    this.ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Create a circular path for the safe zone (reversed to cut out)
    this.ctx.arc(this.zoneCenter.x, this.zoneCenter.y, this.zoneRadius, 0, Math.PI * 2, true);
    
    // Fill with semi-transparent red
    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    this.ctx.fill();
    
    // Draw zone border
    this.ctx.beginPath();
    this.ctx.arc(this.zoneCenter.x, this.zoneCenter.y, this.zoneRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#ef4444';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    this.ctx.stroke();
    
    // Warning text if player is outside
    const dx = this.player.x - this.zoneCenter.x;
    const dy = this.player.y - this.zoneCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.zoneRadius) {
      this.ctx.fillStyle = '#ef4444';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('WARNING: OUTSIDE SAFE ZONE!', CANVAS_WIDTH / 2, 100);
    }
    
    this.ctx.restore();
  }
}

import { Entity } from './Entity';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { Player } from './Player';
import { Enemy } from './Enemy';

export class Boss extends Entity {
  damage: number = 15;
  goldValue: number = 200;
  phase2: boolean = false;
  attackTimer: number = 0;
  dashTimer: number = 0;
  isDashing: boolean = false;
  dashTargetX: number = 0;
  dashTargetY: number = 0;
  private static sprite: HTMLImageElement | null = null;

  constructor(x: number, y: number, level: number) {
    super(
      x, 
      y, 
      60, // Larger radius
      COLORS.BOSS, 
      200 + level * 150, 
      40 + level * 20
    );
    this.damage = 10 + level * 5; // Reduced damage
    this.goldValue = 200 + level * 100;

    if (!Boss.sprite) {
      Boss.sprite = new Image();
      Boss.sprite.src = 'https://i.pravatar.cc/150?u=boss_face';
    }
  }

  update(deltaTime: number, player: Player, spawnMinion: (x: number, y: number) => void) {
    if (!this.phase2 && this.hp < this.maxHp * 0.5) {
      this.phase2 = true;
      this.speed *= 1.5;
      this.color = '#7c3aed'; // Darker purple
    }

    this.attackTimer += deltaTime;
    this.dashTimer += deltaTime;

    if (this.isDashing) {
      const dx = this.dashTargetX - this.x;
      const dy = this.dashTargetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 5) {
        this.isDashing = false;
      } else {
        this.x += (dx / dist) * this.speed * 4 * deltaTime;
        this.y += (dy / dist) * this.speed * 4 * deltaTime;
      }
    } else {
      // Normal movement
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 100) {
        this.x += (dx / dist) * this.speed * deltaTime;
        this.y += (dy / dist) * this.speed * deltaTime;
      }

      // Dash logic
      if (this.dashTimer > 3) {
        this.isDashing = true;
        this.dashTargetX = player.x;
        this.dashTargetY = player.y;
        this.dashTimer = 0;
      }

      // Phase 2: Spawn minions
      if (this.phase2 && this.attackTimer > 5) {
        spawnMinion(this.x + 50, this.y);
        spawnMinion(this.x - 50, this.y);
        this.attackTimer = 0;
      }
    }

    // Keep in bounds
    this.x = Math.max(this.radius, Math.min(CANVAS_WIDTH - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(CANVAS_HEIGHT - this.radius, this.y));
  }

  draw(ctx: CanvasRenderingContext2D) {
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 5) * 5;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Aura for Phase 2
    if (this.phase2) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 10 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124, 58, 237, 0.2)';
      ctx.fill();
    }

    // Body
    if (Boss.sprite && Boss.sprite.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + pulse / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(Boss.sprite, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
      ctx.restore();
      
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + pulse / 2, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + pulse / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-15, -10, 10, 0, Math.PI * 2);
      ctx.arc(15, -10, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.phase2 ? '#ff0000' : '#000';
      ctx.beginPath();
      ctx.arc(-15, -10, 5, 0, Math.PI * 2);
      ctx.arc(15, -10, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crown
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-20, -this.radius - 5);
    ctx.lineTo(-10, -this.radius - 20);
    ctx.lineTo(0, -this.radius - 10);
    ctx.lineTo(10, -this.radius - 20);
    ctx.lineTo(20, -this.radius - 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Health bar (larger for boss)
    const barWidth = 200;
    const barHeight = 10;
    ctx.fillStyle = '#334155';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 40, barWidth, barHeight);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 40, barWidth * (this.hp / this.maxHp), barHeight);
  }
}

export class Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number = 5;
  color: string;
  damage: number;
  isDead: boolean = false;

  constructor(x: number, y: number, tx: number, ty: number, speed: number, damage: number, color: string) {
    this.x = x;
    this.y = y;
    const dx = tx - x;
    const dy = ty - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / dist) * speed;
    this.vy = (dy / dist) * speed;
    this.damage = damage;
    this.color = color;
  }

  update(deltaTime: number) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.isDead = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

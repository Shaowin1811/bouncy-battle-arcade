import { Entity } from './Entity';
import { COLORS } from './constants';
import { Player } from './Player';

export class Enemy extends Entity {
  damage: number = 5;
  goldValue: number = 10;
  private static sprite: HTMLImageElement | null = null;

  constructor(x: number, y: number, level: number) {
    super(
      x, 
      y, 
      25, // Increased radius for image
      COLORS.ENEMY, 
      20 + level * 10, 
      50 + level * 10
    );
    this.damage = 5 + level * 2; // Reduced damage
    this.goldValue = 10 + level * 5;

    if (!Enemy.sprite) {
      Enemy.sprite = new Image();
      Enemy.sprite.src = 'https://tet-dit.vercel.app/assets/face.png';
    }
  }

  update(deltaTime: number, player: Player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      this.x += (dx / dist) * this.speed * deltaTime;
      this.y += (dy / dist) * this.speed * deltaTime;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const time = Date.now() / 1000;
    const wobble = Math.sin(time * 15) * 2;

    ctx.save();
    ctx.translate(this.x, this.y + wobble);

    if (Enemy.sprite && Enemy.sprite.complete) {
      // Draw the image
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(Enemy.sprite, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
      
      // Border
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      // Fallback to circle
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();

      // Angry eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-4, -2, 4, 0, Math.PI * 2);
      ctx.arc(4, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-4, -2, 2, 0, Math.PI * 2);
      ctx.arc(4, -2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Health bar
    if (this.hp < this.maxHp) {
      const barWidth = this.radius * 2;
      const barHeight = 4;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, barWidth, barHeight);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, barWidth * (this.hp / this.maxHp), barHeight);
    }
  }
}

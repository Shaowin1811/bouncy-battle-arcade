import { Vector2D } from './types';

export abstract class Entity {
  x: number;
  y: number;
  radius: number;
  color: string;
  hp: number;
  maxHp: number;
  speed: number;
  isDead: boolean = false;

  constructor(x: number, y: number, radius: number, color: string, hp: number, speed: number) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
  }

  abstract update(deltaTime: number, ...args: any[]): void;

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();

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

  takeDamage(amount: number) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  getDistance(other: Entity): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

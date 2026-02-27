import { Entity } from './Entity';
import { InputHandler } from './InputHandler';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, WEAPONS } from './constants';
import { Weapon, WeaponFactory } from './Weapon';

export class Player extends Entity {
  gold: number = 0;
  souls: number = 0;
  xp: number = 0;
  level: number = 1;
  xpToNextLevel: number = 10;
  weapon: Weapon;
  
  // Core stacks
  cores: Record<string, number> = {};
  
  skillCooldown: number = 0;
  maxSkillCooldown: number = 5000; // 5 seconds default
  damageMultiplier: number = 1;
  facing: number = 0; // Angle in radians
  killCount: number = 0;
  dashCooldown: number = 0;
  maxDashCooldown: number = 2000; // 2 seconds
  isDashing: boolean = false;
  dashTimer: number = 0;
  
  constructor(x: number, y: number) {
    super(x, y, 20, COLORS.PLAYER, 100, 200);
    this.weapon = WeaponFactory.create(WEAPONS.FISTS);
  }

  update(deltaTime: number, input: InputHandler) {
    let dx = 0;
    let dy = 0;

    if (input.isDown('w')) dy -= 1;
    if (input.isDown('s')) dy += 1;
    if (input.isDown('a')) dx -= 1;
    if (input.isDown('d')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      const moveSpeed = this.isDashing ? this.speed * 3 : this.speed;
      this.x += (dx / length) * moveSpeed * deltaTime;
      this.y += (dy / length) * moveSpeed * deltaTime;
      this.facing = Math.atan2(dy, dx);
    }

    // Keep in bounds
    this.x = Math.max(this.radius, Math.min(CANVAS_WIDTH - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(CANVAS_HEIGHT - this.radius, this.y));

    if (this.skillCooldown > 0) {
      this.skillCooldown -= deltaTime * 1000;
    }

    if (this.dashCooldown > 0) {
      this.dashCooldown -= deltaTime * 1000;
    }

    if (this.isDashing) {
      this.dashTimer -= deltaTime * 1000;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }
  }

  dash(): boolean {
    if (this.dashCooldown <= 0) {
      this.isDashing = true;
      this.dashTimer = 200; // 0.2 seconds dash
      this.dashCooldown = this.maxDashCooldown;
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const time = Date.now() / 1000;
    const bob = Math.sin(time * 10) * 2;
    const squash = Math.cos(time * 10) * 0.1;

    // Draw Attack Range
    const attackInfo = this.weapon.getAttack('normal');
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, attackInfo.range, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y + bob);
    
    // Dash Trail
    if (this.isDashing) {
      ctx.globalAlpha = 0.3;
      for (let i = 1; i <= 3; i++) {
        ctx.save();
        ctx.translate(-Math.cos(this.facing) * i * 15, -Math.sin(this.facing) * i * 15);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1.0;
    }

    // Body shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius, this.radius * 0.8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.scale(1 + squash, 1 - squash);

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();

    // Eyes based on facing
    const eyeX = Math.cos(this.facing) * 8;
    const eyeY = Math.sin(this.facing) * 5 - 5;
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eyeX - 5, eyeY, 5, 0, Math.PI * 2);
    ctx.arc(eyeX + 5, eyeY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(eyeX - 5 + Math.cos(this.facing) * 2, eyeY + Math.sin(this.facing) * 2, 2, 0, Math.PI * 2);
    ctx.arc(eyeX + 5 + Math.cos(this.facing) * 2, eyeY + Math.sin(this.facing) * 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
    
    // Draw Weapon
    this.weapon.draw(ctx, this.x, this.y, this.facing + Math.sin(time * 5) * 0.2);

    // Health bar
    if (this.hp < this.maxHp) {
      const barWidth = this.radius * 2.5;
      const barHeight = 6;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 25, barWidth, barHeight);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 25, barWidth * (this.hp / this.maxHp), barHeight);
    }
  }

  attack(type: 'normal' | 'heavy' | 'skill'): { damage: number, range: number, effect: string } {
    const base = this.weapon.getAttack(type);
    const rangeMult = 1 + (this.cores['range'] || 0) * 0.15;
    return {
      damage: base.damage * this.damageMultiplier,
      range: base.range * rangeMult,
      effect: base.effect
    };
  }

  useSkill(): boolean {
    if (this.skillCooldown <= 0) {
      this.skillCooldown = this.maxSkillCooldown;
      return true;
    }
    return false;
  }

  applyUpgrades(upgrades: any) {
    this.maxHp = 100 + upgrades.hp * 20;
    this.hp = this.maxHp;
    this.damageMultiplier = 1 + upgrades.damage * 0.2;
    this.speed = 200 + upgrades.speed * 20;
    this.maxSkillCooldown = Math.max(1000, 5000 - upgrades.cooldown * 500);
    this.color = upgrades.skin || COLORS.PLAYER;
  }

  applyCore(coreId: string) {
    this.cores[coreId] = (this.cores[coreId] || 0) + 1;
    
    switch (coreId) {
      case 'dmg': this.damageMultiplier *= 1.2; break;
      case 'hp': 
        this.maxHp += 20;
        this.hp += 20;
        break;
      case 'spd': this.speed *= 1.1; break;
      case 'cdr': this.maxSkillCooldown *= 0.85; break;
      case 'range': 
        // Range is handled in attack()
        break;
    }
  }

  addXp(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level++;
      this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
      return true; // Leveled up
    }
    return false;
  }
}

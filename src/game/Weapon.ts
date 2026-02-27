import { COLORS, WEAPONS } from './constants';

export interface AttackInfo {
  damage: number;
  range: number;
  effect: string;
}

export abstract class Weapon {
  name: string;
  color: string;
  constructor(name: string, color: string) {
    this.name = name;
    this.color = color;
  }
  abstract getAttack(type: 'normal' | 'heavy' | 'skill'): AttackInfo;
  abstract draw(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void;
}

class Fists extends Weapon {
  constructor() { super(WEAPONS.FISTS, COLORS.PLAYER); }
  getAttack(type: 'normal' | 'heavy' | 'skill'): AttackInfo {
    switch (type) {
      case 'heavy': return { damage: 15, range: 60, effect: 'punch' };
      case 'skill': return { damage: 30, range: 80, effect: 'combo' };
      default: return { damage: 10, range: 50, effect: 'punch' };
    }
  }
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    const time = Date.now() / 100;
    const punchOffset = Math.abs(Math.sin(time)) * 10;

    // Left fist
    ctx.beginPath();
    ctx.arc(25 + punchOffset, -15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right fist
    ctx.beginPath();
    ctx.arc(25 - punchOffset, 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }
}

class Sword extends Weapon {
  constructor() { super(WEAPONS.SWORD, COLORS.SWORD); }
  getAttack(type: 'normal' | 'heavy' | 'skill'): AttackInfo {
    switch (type) {
      case 'heavy': return { damage: 25, range: 60, effect: 'slash' };
      case 'skill': return { damage: 50, range: 100, effect: 'spin' };
      default: return { damage: 15, range: 50, effect: 'slash' };
    }
  }
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Blade
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(35, -4);
    ctx.lineTo(40, 0);
    ctx.lineTo(35, 4);
    ctx.lineTo(0, 2);
    ctx.fill();
    
    // Glow
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.stroke();
    
    // Hilt
    ctx.fillStyle = '#475569';
    ctx.fillRect(-5, -6, 5, 12);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12, -2, 12, 4);
    
    ctx.restore();
  }
}

class Gun extends Weapon {
  constructor() { super(WEAPONS.GUN, COLORS.GUN); }
  getAttack(type: 'normal' | 'heavy' | 'skill'): AttackInfo {
    switch (type) {
      case 'heavy': return { damage: 20, range: 200, effect: 'big-bubble' };
      case 'skill': return { damage: 15, range: 300, effect: 'triple-shot' };
      default: return { damage: 10, range: 150, effect: 'bubble' };
    }
  }
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Body
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.roundRect(0, -6, 25, 12, 4);
    ctx.fill();
    
    // Barrel
    ctx.fillStyle = '#db2777';
    ctx.fillRect(20, -4, 10, 8);
    
    // Handle
    ctx.fillStyle = '#9d174d';
    ctx.fillRect(5, 0, 6, 12);
    
    // Bubble effect
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(35, Math.sin(Date.now()/200)*3, 4, 0, Math.PI*2);
    ctx.stroke();
    
    ctx.restore();
  }
}

class Spear extends Weapon {
  constructor() { super(WEAPONS.SPEAR, COLORS.SPEAR); }
  getAttack(type: 'normal' | 'heavy' | 'skill'): AttackInfo {
    switch (type) {
      case 'heavy': return { damage: 30, range: 80, effect: 'thrust' };
      case 'skill': return { damage: 60, range: 200, effect: 'fire-dash' };
      default: return { damage: 20, range: 70, effect: 'thrust' };
    }
  }
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Shaft
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(40, 0);
    ctx.stroke();
    
    // Tip
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(40, -6);
    ctx.lineTo(55, 0);
    ctx.lineTo(40, 6);
    ctx.fill();
    
    // Fire glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f97316';
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(50, 0, 4, 0, Math.PI*2);
    ctx.fill();
    
    ctx.restore();
  }
}

class Hammer extends Weapon {
  constructor() { super(WEAPONS.HAMMER, COLORS.HAMMER); }
  getAttack(type: 'normal' | 'heavy' | 'skill'): AttackInfo {
    switch (type) {
      case 'heavy': return { damage: 40, range: 50, effect: 'slam' };
      case 'skill': return { damage: 80, range: 120, effect: 'shockwave' };
      default: return { damage: 25, range: 40, effect: 'slam' };
    }
  }
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Handle
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(25, 0);
    ctx.stroke();
    
    // Head
    ctx.fillStyle = '#57534e';
    ctx.beginPath();
    ctx.roundRect(25, -12, 15, 24, 2);
    ctx.fill();
    
    // Details
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(27, -10, 2, 20);
    ctx.fillRect(36, -10, 2, 20);
    
    ctx.restore();
  }
}

export class WeaponFactory {
  static create(name: string): Weapon {
    switch (name) {
      case WEAPONS.SWORD: return new Sword();
      case WEAPONS.GUN: return new Gun();
      case WEAPONS.SPEAR: return new Spear();
      case WEAPONS.HAMMER: return new Hammer();
      default: return new Fists();
    }
  }

  static getRandom(): Weapon {
    const list = [WEAPONS.SWORD, WEAPONS.GUN, WEAPONS.SPEAR, WEAPONS.HAMMER];
    return this.create(list[Math.floor(Math.random() * list.length)]);
  }
}

export class WeaponPickup {
  x: number;
  y: number;
  weapon: Weapon;
  radius: number = 15;
  isDead: boolean = false;

  constructor(x: number, y: number, weapon: Weapon) {
    this.x = x;
    this.y = y;
    this.weapon = weapon;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.weapon.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    this.weapon.draw(ctx, this.x, this.y, Math.sin(Date.now() / 200) * 0.5);
  }
}

export class SoulPickup {
  x: number;
  y: number;
  radius: number = 8;
  color: string = '#8b5cf6';

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const time = Date.now() / 200;
    const pulse = Math.sin(time) * 2;
    
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius + pulse, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Core
    ctx.beginPath();
    ctx.arc(this.x, this.y, (this.radius + pulse) * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
    ctx.restore();
  }
}

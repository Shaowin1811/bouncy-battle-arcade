export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  text?: string;
  type: 'circle' | 'text' | 'slash' | 'shockwave' = 'circle';
  angle?: number;

  constructor(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number, text?: string) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.text = text;
  }

  update(deltaTime: number) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (this.type === 'text' && this.text) {
      ctx.fillStyle = this.color;
      ctx.font = `bold ${this.size}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(this.text, this.x, this.y);
    } else if (this.type === 'slash') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const length = 40;
      const angle = this.angle || 0;
      ctx.moveTo(this.x - Math.cos(angle) * length, this.y - Math.sin(angle) * length);
      ctx.lineTo(this.x + Math.cos(angle) * length, this.y + Math.sin(angle) * length);
      ctx.stroke();
    } else if (this.type === 'shockwave') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1 - alpha) * 5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class ParticleSystem {
  particles: Particle[] = [];

  spawn(x: number, y: number, color: string, count: number = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100 + 50;
      const p = new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.5,
        color,
        Math.random() * 3 + 2
      );
      this.particles.push(p);
    }
  }

  spawnText(x: number, y: number, text: string, color: string = '#fff') {
    const p = new Particle(x, y, 0, -50, 1, color, 24, text);
    p.type = 'text';
    this.particles.push(p);
  }

  spawnSlash(x: number, y: number, angle: number, color: string) {
    const p = new Particle(x, y, 0, 0, 0.2, color, 8);
    p.type = 'slash';
    p.angle = angle + Math.PI / 2;
    this.particles.push(p);
  }

  spawnShockwave(x: number, y: number, color: string) {
    const p = new Particle(x, y, 0, 0, 0.4, color, 20);
    p.type = 'shockwave';
    this.particles.push(p);
  }

  spawnFireTrail(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const p = new Particle(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 20,
        -Math.random() * 50,
        0.5,
        '#f97316',
        Math.random() * 4 + 2
      );
      this.particles.push(p);
    }
  }

  spawnBubbleBurst(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 150 + 50;
      const p = new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.8,
        color,
        Math.random() * 5 + 3
      );
      this.particles.push(p);
    }
  }

  spawnSpinEffect(x: number, y: number, radius: number, color: string) {
    const p = new Particle(x, y, 0, 0, 0.3, color, radius);
    p.type = 'shockwave'; 
    this.particles.push(p);
  }

  update(deltaTime: number) {
    this.particles = this.particles.filter(p => p.life > 0);
    for (const p of this.particles) {
      p.update(deltaTime);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }
}

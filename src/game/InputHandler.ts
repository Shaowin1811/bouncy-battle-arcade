export class InputHandler {
  keys: Set<string> = new Set();
  justPressed: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.keys.has(key)) {
        this.justPressed.add(key);
      }
      this.keys.add(key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  isDown(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  wasJustPressed(key: string): boolean {
    const pressed = this.justPressed.has(key.toLowerCase());
    if (pressed) {
      this.justPressed.delete(key.toLowerCase());
    }
    return pressed;
  }

  clearJustPressed() {
    this.justPressed.clear();
  }
}

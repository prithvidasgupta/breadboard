import { Assets, Sprite } from 'https://cdn.skypack.dev/pixi.js';

class DraggableComponent {
  constructor() {
    this.path = null
    this.component_type = DraggableComponent;
    this.scale = 1;
    this.dragging = false;
    this.offset = { x: 0, y: 0 };
    this.position = { x: 0, y: 0 };
  }

  setPath(path) {
    this.path = path.trim();
  }

  async loadInApplication(app) {
    const texture = await Assets.load({
      src: this.path,
      data: {
        resolution: 4
      }
    });

    const sprite = new Sprite(texture);
    const bounds = sprite.getLocalBounds();
    sprite.scale.set(this.scale);
    sprite.pivot.set((bounds.x + bounds.width) / 2, (bounds.y + bounds.height) / 2);
    sprite.position.set(app.canvas.width / 2, app.canvas.height / 2);
    this.sprite = sprite;
    return sprite;
  }

  hookEvents(litElement) {
    this.sprite.eventMode = 'static';
    this.sprite.cursor = 'pointer';
    this.sprite.on('pointerdown', litElement.onDragStart.bind(litElement, this.sprite));
  }
}

export class Resistor extends DraggableComponent {
  constructor() {
    super();
    this.path = 'assets/resistor.svg';
    this.scale = 0.05;
  }
}

export class CentralProcessingUnit extends DraggableComponent {
  constructor() {
    super();
    this.path = 'assets/cpu.svg';
    this.scale = 2;
  }
}
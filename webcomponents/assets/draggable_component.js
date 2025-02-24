import { Assets, Sprite } from 'https://cdn.skypack.dev/pixi.js';
import { html, css, LitElement } from 'https://cdn.jsdelivr.net/gh/lit/dist@2.7.4/core/lit-core.min.js';


class DraggableComponent extends LitElement {
  static properties = {
    properties: {type: Object}
  }
  constructor() {
    super()
    this.path = null
    this.component_type = DraggableComponent;
    this.scale = 1;
    this.dragging = false;
    this.offset = { x: 0, y: 0 };
    this.position = { x: 0, y: 0 };
  }
    render(){
      return html`<p>Draggable Component</p>`;
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
    this.sprite.on('pointerdown', litElement.onDragStart.bind(litElement, this.sprite, this.component_type, this.properties));
  }
}

export class Resistor extends DraggableComponent {
  constructor() {
    super();
    this.path = 'assets/resistor.svg';
    this.scale = 0.05;
    this.component_type = 'resistor-component';
  }

  render(){
    return html`<p>Resistor with resistance of ${this.properties.resistance}</p>`;
  }
}

export class CentralProcessingUnit extends DraggableComponent {
  constructor() {
    super();
    this.path = 'assets/cpu.svg';
    this.scale = 2;
    this.component_type = 'central-processing-unit-component';
  }
  render(){
    return html`<p>Central Processing Unit</p>`;
  }
}
// Copilot used to generate the code below
import { html, css, LitElement } from 'https://cdn.jsdelivr.net/gh/lit/dist@2.7.4/core/lit-core.min.js';
import { Application, Assets, Sprite } from 'https://cdn.skypack.dev/pixi.js';

// SVG source: https://freesvg.org/generic-40-pin-ic-chip-vector-graphics
// SVG source: https://www.svgrepo.com/svg/121336/resistor
class CircuitCanvas extends LitElement {
  static styles = css`
    .container {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 50%;
      margin: 1rem;
    }
    .canvas-container {
      background-color: #f0f0f0;
      width: 70%;
    }
    .form-container {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      margin: 1rem;
      row-gap: 1rem;
      width: 30%;
      background-color: #ffffff;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.boundResizeHandler = this.resize.bind(this);
    window.addEventListener('resize', this.boundResizeHandler);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.boundResizeHandler);
    super.disconnectedCallback();
  }

  resize() {
    const parent = this.app.canvas.parentNode;
    this.app.renderer.resize(parent.clientWidth * 1.25, parent.clientHeight);
  }

  async loadTexture(path) {
    let app = this.app;
    const testTexture = await Assets.load({
      src: path,
      data: {
        resolution: 4
      }
    });

    const sprite = new Sprite(testTexture);

    // line it up as this svg is not centered
    const bounds = sprite.getLocalBounds();
    if (path === 'assets/resistor.svg') {
      sprite.scale.set(0.1);
    }
    sprite.pivot.set((bounds.x + bounds.width) / 2, (bounds.y + bounds.height) / 2);

    sprite.position.set(app.screen.width / 2, app.screen.height / 2);

    app.stage.addChild(sprite);

    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';
    sprite.parent_data = this;
    sprite.on('pointerdown', this.onDragStart.bind(this, sprite));
  }

  onDragMove(event) {
    if (this.dragTarget) {
      this.dragTarget.parent.toLocal(event.global, null, this.dragTarget.position);
    }
  }

  onDragStart(sprite, event) {
    this.dragTarget = sprite;
    sprite.alpha = 0.5;
    this.app.stage.on('pointermove', this.onDragMove, this);
  }

  onDragEnd() {
    if (this.dragTarget) {
      this.app.stage.off('pointermove', this.onDragMove, this);
      this.dragTarget.alpha = 1;
      this.dragTarget = null;
    }
  }

  async firstUpdated() {
    this.dragTarget = null;
    this.app = new Application()
    await this.app.init({
      autoResize: true,
      resolution: devicePixelRatio
    });
    this.app.renderer.background.color = 0xf0f0f0;
    this.canvasContainer.appendChild(this.app.canvas);
    for (let path of [
      'assets/resistor.svg',
      'assets/cpu.svg',
    ]) {
      await this.loadTexture(path);
    }
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerup', this.onDragEnd.bind(this));
    this.app.stage.on('pointerupoutside', this.onDragEnd.bind(this));
    this.resize();
  }

  render() {
    return html`
      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
      <div class="container">
        <div class="canvas-container" id="canvasContainer"></div>
        <div class="form-container">
          <form>
            <div class="mb-3">
              <label class="form-label">Circuit component</label>
              <select id="parts" name="parts" class="form-select">
                <option>Resistor</option>
                <option>Capacitor</option>
                <option>Inductor</option>
              </select>
            </div>
            <div>
              <button type="submit" class="btn btn-primary">Add</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  get canvasContainer() {
    return this.shadowRoot.getElementById('canvasContainer');
  }
}

customElements.define('circuit-canvas', CircuitCanvas);
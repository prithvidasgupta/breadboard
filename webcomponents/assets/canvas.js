// Copilot used to generate the code below
import { html, css, LitElement } from 'https://cdn.jsdelivr.net/gh/lit/dist@2.7.4/core/lit-core.min.js';
import { Application, Assets, Sprite } from 'https://cdn.skypack.dev/pixi.js';
import { Resistor, CentralProcessingUnit } from './draggable_component.js';


function componentSwitcher(component_str) {
  switch (component_str) {
    case 'Resistor':
      return Resistor;
    case 'CentralProcessingUnit':
      return CentralProcessingUnit;
    default:
      return Resistor;
  }
}
// SVG source: https://freesvg.org/generic-40-pin-ic-chip-vector-graphics
// SVG source: https://www.svgrepo.com/svg/121336/resistor
class CircuitCanvas extends LitElement {
  static properties = {selectedComponent: {type: String}}

  constructor(){
    super();
    this.selectedComponent = Resistor;
  }

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

  async addComponent(component_str) {
    const ComponentClass = componentSwitcher(component_str);
    const component = new ComponentClass();
    const sprite = await component.loadInApplication(this.app);
    this.app.stage.addChild(sprite);
    component.hookEvents(this);
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
        <div class="mb-3">
          <label class="form-label">Circuit component</label>
          <select id="parts" name="parts" class="form-select" @change="${(e) => this.selectedComponent = e.target.value}">
          <option value="Resistor">Resistor</option>
          <option value="CentralProcessingUnit">Microprocessor</option>
          </select>
        </div>
        <div>
          <button @click="${async()=>await this.addComponent(this.selectedComponent)}" class="btn btn-primary">Add</button>
        </div>
      </div>
      </div>
    `;
  }

  get canvasContainer() {
    return this.shadowRoot.getElementById('canvasContainer');
  }
}

customElements.define('circuit-canvas', CircuitCanvas);
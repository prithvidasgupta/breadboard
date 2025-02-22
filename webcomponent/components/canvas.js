import { html, css, LitElement } from 'https://cdn.jsdelivr.net/gh/lit/dist@2.7.4/core/lit-core.min.js';

class CircuitCanvas extends LitElement {
  static styles = css`
    .container {
      display: flex;
      width: 100%;
      height: 100vh;
    }
    .canvas-container {
      flex: 2;
      background-color: #f0f0f0;
    }
    .form-container {
      flex: 1;
      padding: 1rem;
      background-color: #ffffff;
    }
  `;

  async firstUpdated() {
    const app = new PIXI.Application({ width: this.canvasContainer.clientWidth, height: this.canvasContainer.clientHeight });
    await app.init();
    this.canvasContainer.appendChild(app.view);

    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xde3249);
    graphics.drawRect(50, 50, 100, 100);
    graphics.endFill();
    app.stage.addChild(graphics);
  }

  render() {
    return html`
      <div class="container">
        <div class="canvas-container" id="canvasContainer"></div>
        <div class="form-container">
          <form class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Message</label>
              <textarea class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
            </div>
            <div>
              <button type="submit" class="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Submit</button>
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
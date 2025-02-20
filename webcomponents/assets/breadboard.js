import { html, LitElement } from 'https://cdn.jsdelivr.net/gh/lit/dist@2.7.4/core/lit-core.min.js';
import { unsafeHTML } from 'https://unpkg.com/lit-html@2.7.4/directives/unsafe-html.js';

// https://stackoverflow.com/questions/68614776/using-lit-with-javascript-and-no-build-tools
// code uses chunks from ca4e.com source code

export class BreadBoard extends LitElement {

  static get properties() {
    return {
      power_rail_size: { type: Number },
      row_size: { type: Number },
      column_size: { type: Number },
      hole_matrix: { type: Array },
      origin: { type: Object }
    }
  }

  constructor() {
    super();
    // default row size should be 5
    // default coumn size should be 30
    this.row_size = 5;
    this.column_size = 29;
    this.power_rail = this.column_size;
    this.hole_matrix = Array(5);
    // the origin should be the top left corner of the breadboard
    // only positive values are allowed
    this.origin = { x: 15, y: 15 };
    for (let i = 0; i < this.row_size; i++) {
      this.hole_matrix[i] = Array(60)
    }
  }

  render() {
    let element = SVG().size('100%', '100%')
    let x = this.origin.x, y = this.origin.y;
    let hc = null;
    let hole_colors = ['#000', '#fff']
    for (let row = 0; row < this.row_size; row++) {
      for (let column = 0; column < this.column_size; column++) {
        element.rect(30, 30).fill('#000').move(0 + y, 0 + x);
        element.rect(20, 20).fill('#fae7ac').move(5 + y, 5 + x);
        if (column % 2 == 0)
          hc = hole_colors[0]
        else
          hc = hole_colors[1]
        element.circle(10).fill(hc).move(10 + y, 10 + x);
        y = this.origin.y+(column + 1) * 30
      }
      x = this.origin.x+(row + 1) * 30;
      y = this.origin.y;
    }
    // blue ground holes
    for (let column = 0; column < this.column_size; column++) {
      if ((column + 1) % 5 != 0) {
        element.rect(30, 30).fill('#000').move(0 + y, 0 + x);
        element.rect(20, 20).fill('#fae7ac').move(5 + y, 5 + x);
        element.circle(10).fill("#00f").move(10 + y, 10 + x);
      }
      else {
        element.rect(30, 30).fill('#000').move(0 + y, 0 + x);
        element.rect(20, 30).fill('#fae7ac').move(5 + y, 5 + x);
      }
      y = this.origin.y+(column + 1) * 30
    }
    x = x + 30;
    y = this.origin.y;
    // red power holes
    for (let column = 0; column < this.column_size; column++) {
      if ((column + 1) % 5 != 0) {
        element.rect(30, 30).fill('#000').move(0 + y, 0 + x);
        element.rect(20, 20).fill('#fae7ac').move(5 + y, 5 + x);
        element.circle(10).fill('#f00').move(10 + y, 10 + x);
      }
      else {
        element.rect(30, 30).fill('#000').move(0 + y, 0 + x);
        element.rect(20, 25).fill('#fae7ac').move(5 + y, x);
      }
      y = this.origin.y+(column + 1) * 30
    }
    let alpha = ['A', 'B', 'C', 'D', 'E', '(-)', '(+)']
    for (let i = 0; i < alpha.length; i++) {
      element.text(alpha[i]).move(this.origin.x+this.column_size * 30 + 5, this.origin.y+5 + i * 30)
    }
    for (let i = 0; i < this.column_size; i++) {
      element.text(i + 1).move(this.origin.x+10 + i * 30, this.origin.y+(this.row_size + 2) * 30 + 5)
    }
    return html`${unsafeHTML(element.svg())}`
  }

}

customElements.define('bread-board', BreadBoard);

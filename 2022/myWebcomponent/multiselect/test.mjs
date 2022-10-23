// web component for a card container

class MyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
      </style>
      <slot name='container'>
        <slot name='card-title'>title</slot>
        <slot name='card-content'>content</slot>
      </slot>
    `;
  }
}
export { MyCard };
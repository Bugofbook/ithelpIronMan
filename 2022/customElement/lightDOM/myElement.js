// standard web component
class MyWebComponent extends HTMLElement {
    constructor() {
        super()
    }
    connectedCallback() {
        
    }
    disconnectedCallback() {

    }
    static get observedAttributes() {
        // 和下面的的方法組合，用來指定監聽屬性的名稱
        return [];
    }
    attributeChangedCallback(name, oldValue, newValue) {

    }
    adoptedCallback() {

    }

}
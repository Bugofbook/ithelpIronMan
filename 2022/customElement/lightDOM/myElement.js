class MyElement extends HTMLElement {
    constructor() {
        super();
        this.render = this.render.bind(this);
    }

    connectedCallback() {
        this.innerHTML= this.render()
    }
    render() {
        return <div>Hallo World!</div>
    }
}

export {
    MyElement
}
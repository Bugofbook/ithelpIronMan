class TodoItem extends HTMLElement {
    constructor() {
        super();
        this.render = this.render.bind(this);
    }

    connectedCallback() {
        this.innerHTML= this.render()
    }
    render() {
        // render the element
        const rootArticle = document.createElement('article');
        rootArticle.classList.add('todo-item');
        rootArticle.innerHTML= `
            <input type="checkbox" name="check" />
            <h1 class='item-title'>今天晚上公司聚餐</h1>
            <div class='item-tags'>
                <span class=='item-tag'>吃飯</span>
                <span class=='item-tag'>公司</span>
            </div>
            <p class='item-descption'>吃到飽餐廳吃飯</p>
        `
        return rootArticle;
    }
}

export {
    TodoItem
}
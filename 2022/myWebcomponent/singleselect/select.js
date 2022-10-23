const selectStyle = document.createElement('style');
selectStyle.innerHTML = `
    :host {
        display: block;
        position: relative;
        border: 1px solid #ccc;
        border-radius: 4px;
        height: 2rem;
        width: 100px;
    }
    .container {
        width: 100%;
        height: 100%;
    }
    .select-list {
        z-index: 100;
    }
    .select-mask {
        z-index: 99;
    }
    .select-arrow {
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%)  rotate(180deg);
        z-index: 98;
    }
    .select-arrow:not([data-open]) {
        transform: translateY(-50%);
    }
    .select-content {
        z-index: 98;
        width: 100%;
        height: 100%;
    }
    .select-list:not([data-open]) {
        display: none;
        z-index: 0;
    }
    .select-mask:not([data-open]) {
        display: none;
        z-index: -1;
    }
`
// 單選組件本體
class MySingleSelect extends HTMLElement {
    selectContentNode = null
    selectArrow = null
    dataListNode = null
    maskNode = null
    root = null
    optionMap = new Map()
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(selectStyle.cloneNode(true))
        this.root = this.render()
        this.shadowRoot.appendChild(this.root)
    }
    // 這裡就只有簡單的打開選單，關上選單，和每個選項選擇時使用this.selectOption(option)事件
    connectedCallback() {
        this.selectContentNode.addEventListener('click', () => {
            this.handleSelectOpen()
        })
        this.maskNode.addEventListener('click', () => {
            this.handleSelectClose()
        })
        for (const option of this.optionMap.keys()) {
            option.addEventListener('click', this.selectOption(option))
        }
    }
    disconnectedCallback() {
        this.selectContentNode.removeEventListener('click', () => {
            this.handleSelectOpen()
        })
        this.maskNode.removeEventListener('click', () => {
            this.handleSelectClose()
        })
        for (const option of this.optionMap.keys()) {
            option.removeEventListener('click', this.selectOption(option))
        }
    }
    render() {
         // 因為每個部分都拆成組件，最好先確認是否註冊組件，沒有註冊就註冊
        if (!customElements.get('my-select-content') ) {
            customElements.define("my-select-data-list", MySelectDataList);
        }
        if (!customElements.get('my-select-mask') ) {
            customElements.define("my-select-mask", MySelectMask);
        }
        if (!customElements.get('my-single-select-content') ) {
            customElements.define("my-single-select-content", MySingleSelectContent);
        }
        if (!customElements.get('my-single-select-option') ) {
            customElements.define("my-single-select-option", MySingleSelectOption);
        }
        if (!customElements.get('my-select-arrow') ) {
            customElements.define("my-select-arrow", MySelectArrow);
        }
        // 這段就生成node，加上class再放入父節點
        const container = document.createElement('div');
        container.classList.add('container')
        this.selectContentNode = document.createElement('my-single-select-content');
        this.selectContentNode.classList.add('select-content')
        container.appendChild(this.selectContentNode)
        this.selectArrow = document.createElement('my-select-arrow');
        this.selectArrow.classList.add('select-arrow')
        container.appendChild(this.selectArrow)
        this.dataListNode = document.createElement('my-select-data-list');
        this.dataListNode.classList.add('select-list')
        // 這二行是用來把select裡的option的資料用web component替換後放入組件中
        const originOptions = this.querySelectorAll('option')
        this.setOptions(originOptions)

        container.appendChild(this.dataListNode)
        this.maskNode = document.createElement('my-select-mask');
        this.maskNode.classList.add('select-mask')
        container.appendChild(this.maskNode)
        return container;
    }
    // 把每一個option元素的屬性都抽出來，再套用到自製的選項組件上
    setOptions(options) {
        this.dataListNode.innerHTML = '';
        for (let item of options) {
            const attrs = item.attributes
            const option = document.createElement('my-single-select-option');
            for (let attr of attrs) {
                // 對自製的option組件，id和class是多餘的，所以不用套用
                if (attr.name !== 'id' || attr.name !== 'class') {
                    option.setAttribute(attr.name, attr.value)
                }
                // 如果有selected屬性，就要顯示在自製的組件中
                if (attr.name === 'selected') {
                    this.setContent(item.innerHTML)
                }
            }
            option.innerHTML = item.innerHTML
            this.optionMap.set(option, item)
            this.dataListNode.appendChild(option)
        }
    }
    handleSelectOpen() {
        this.dataListNode.setAttribute('data-open', true)
        this.maskNode.setAttribute('data-open', true)
        this.selectArrow.setAttribute('data-open', true)
    }
    handleSelectClose() {
        this.dataListNode.removeAttribute('data-open')
        this.maskNode.removeAttribute('data-open')
        this.selectArrow.removeAttribute('data-open')
    }
    // 當點擊了一個自製的選項組件，就要修改對應的option組件
    selectOption(option) {
        // 這裡要注意箭頭函式的this指向，這裡的this是指向MySingleSelect的this
        return (e) => {
            const item = this.optionMap.get(option)
            option.selected = true
            item.selected = true
            this.setContent(option.innerHTML)
            this.handleSelectClose()
        }
    }
    // 在自製組件上顯示己經選擇的資料
    setContent(value) {
        this.selectContentNode.innerHTML = value
    }
}
// 選擇組件的下拉選單容器
class MySelectDataList extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({mode: 'open'})
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    background-color: #ffffff;
                    width: 100%;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    min-width: 20px;
                    max-height: 100px;
                    overflow: auto;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `
    }
}
// 選擇組件的遮罩層
class MySelectMask extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({mode: 'open'})
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: transparent;
                    opacity: 0;
                }
            </style>
        `
    }
}
// 選擇組件顯示資料用的組件
class MySingleSelectContent extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({mode: 'open'})
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 5px;
                }
            </style>
            <slot></slot>
        `
    }
}
// 選擇組件下拉選單
class MySingleSelectOption extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({mode: 'open'})
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 5px;
                    height: 3rem;
                    width: 100%;
                }
            </style>
            <slot></slot>
        `
    }
}
// 選擇組件的箭頭
class MySelectArrow extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({mode: 'open'})
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-top: 4px solid #000;
                }
            </style>
        `
    }
}
export {
    MySingleSelect
}
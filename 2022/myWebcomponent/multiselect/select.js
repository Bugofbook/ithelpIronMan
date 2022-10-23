// web component for single select

const selectStyle = document.createElement('style');
selectStyle.innerHTML = `
    :host {
        display: block;
        position: relative;
        border: 1px solid #ccc;
        border-radius: 4px;
        height: 2rem;
        width: 100%;
        box-sizing: border-box;
    }
    .container {
        width: 100%;
        height: 100%;
        box-sizing: border-box
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
class MyMultiSelect extends HTMLElement {
    selectContentNode = null
    selectArrow = null
    dataListNode = null
    maskNode = null
    root = null
    optionMap = new Map()
    selectValueSet = new Set()
    haslock = false
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.appendChild(selectStyle.cloneNode(true))
        this.root = this.render()
        this.shadowRoot.appendChild(this.root)
    }
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
        this.optionMap.clear()
        this.selectValueSet.clear()
    }
    render() {
        if (!customElements.get('my-select-content') ) {
            customElements.define("my-select-data-list", MySelectDataList);
        }
        if (!customElements.get('my-select-mask') ) {
            customElements.define("my-select-mask", MySelectMask);
        }
        if (!customElements.get('my-single-select-content') ) {
            customElements.define("my-single-select-content", MySingleSelectContent);
        }
        if (!customElements.get('my-multi-select-option') ) {
            customElements.define("my-multi-select-option", MyMultiSelectOption);
        }
        if (!customElements.get('my-multi-select-chip') ) {
            customElements.define("my-multi-select-chip", MyMultiSelectChip);
        }
        if (!customElements.get('my-select-arrow') ) {
            customElements.define("my-select-arrow", MySelectArrow);
        }
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
        const originOptions = this.querySelectorAll('option')
        this.setOptions(originOptions)
        container.appendChild(this.dataListNode)
        this.maskNode = document.createElement('my-select-mask');
        this.maskNode.classList.add('select-mask')
        container.appendChild(this.maskNode)
        this.renderSelectContent()
        return container;
    }
    setOptions(options) {
        this.dataListNode.innerHTML = '';
        for (let item of options) {
            const attrs = item.attributes
            const option = document.createElement('my-multi-select-option');
            for (let attr of attrs) {
                if (attr.name !== 'id' || attr.name !== 'class') {
                    option.setAttribute(attr.name, attr.value)
                }
                if (attr.name === 'selected') {
                    this.selectValueSet.add(item)
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
    // 選擇項目的事件: 變成需要設定己選擇的項目，之後再來重新渲染資料
    selectOption(option) {
        return (e) => {
            if (!this.haslock) {
                this.haslock = true
                const item = this.optionMap.get(option)
                option.selected = true
                item.selected = true
                this.setValue(item)
                this.renderSelectContent()
            }
        }
    }
    // 設定己選擇的項目的事件
    setValue(item) {
        if (this.selectValueSet.has(item)) {
            this.selectValueSet.delete(item)
            return false
        } else {
            this.selectValueSet.add(item)
            return true
        }
    }
    // 重新渲染資料用的事件
    renderSelectContent() {
        requestAnimationFrame(() => {
            this.selectContentNode.innerHTML = ''
            for (let item of this.selectValueSet) {
                const chip = document.createElement('my-multi-select-chip')
                chip.innerHTML = item.innerHTML
                this.selectContentNode.appendChild(chip)
            }
            this.haslock = false
        })
    }
}

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
                    box-sizing: border-box;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    min-width: 20px;
                    max-height: 100px;
                    overflow: auto;
                    box-sizing: border-box;
                }
            </style>
            <div class="container">
                <slot></slot>
            </div>
        `
    }
}
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
class MySingleSelectContent extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({mode: 'open'})
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    align-items: center;
                    padding: 0 4px;
                    height: 2rem;
                    box-sizing: border-box
                }
            </style>
            <slot></slot>
        `
    }
}
const multiOptionStyle = `
    :host {
        box-sizing: border-box;
        display: block;
        width: 100%;
        height: 2rem;
    }
    .container {
        display: inline-flex;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 4px;
        color: black;
        box-sizing: border-box;
    }
    .container:hover {
        background-color: aqua;
    }
    .content {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    `
class MyMultiSelectOption extends HTMLElement {
    optionCheckbox = document.createElement('input');
    constructor() {
        super()
        this.attachShadow({mode: 'open'})
        const styleSheet = document.createElement('style')
        styleSheet.innerHTML = multiOptionStyle
        this.shadowRoot.appendChild(styleSheet)
        this.shadowRoot.appendChild(this.render())
    }
    static get observedAttributes() {
        return ['selected'];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'selected') {
            if (newValue !== null) {
                this.optionCheckbox.setAttribute('checked', '');
                this.optionCheckbox.checked = true;
            } else {
                this.optionCheckbox.removeAttribute('checked');
                this.optionCheckbox.checked = false;
            }
        }
    }
    render() {
        this.optionCheckbox.setAttribute('type', 'checkbox');
        this.optionCheckbox.classList.add('checkbox');
        const selected = this.hasAttribute('selected');
        if (selected) {
            this.optionCheckbox.setAttribute('checked', '');
            this.optionCheckbox.checked = true;
            this.optionCheckbox.setAttribute('value', this.getAttribute('value'));
        }
        const optioncontent = document.createElement('div');
        optioncontent.classList.add('content');
        optioncontent.innerHTML = `<slot></slot>`;
        const optionContainer = document.createElement('label');
        optionContainer.classList.add('container');
        // this.optionCheckbox.addEventListener('click', () => this.handleChange())
        optionContainer.appendChild(this.optionCheckbox);
        optionContainer.appendChild(optioncontent);
        return optionContainer;
    }
}
const multiChipStyle = `
    :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 1.5rem;
        margin: 0px 4px;
        padding: 0px 4px;
        background-color: #ccc;
        color: blue;
        border-radius: 4px;
    }
`
class MyMultiSelectChip extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({mode: 'open'})
        const styleSheet = document.createElement('style')
        styleSheet.innerHTML = multiChipStyle
        this.shadowRoot.appendChild(styleSheet)
        this.shadowRoot.appendChild(this.render())
    }
    render() {
        return document.createElement('slot')
    }
}
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
    MyMultiSelect,
    MyMultiSelectOption,
    MyMultiSelectChip
}
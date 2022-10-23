

export class myList extends HTMLElement {
    height = 500
    width = 150
    itemSize = 100
    itemCount = 15
    indexNodeMap = new Map();
    showNodeWeakSet = new WeakSet();
    observer = null
    hasLock = false;
    topCount = 1
    bottomCount = 1
    styleNode = document.createElement('style');
    containerNode = document.createElement('div');
    contentNode = document.createElement('div');
    tombstonesNode = null
    mutationObserver = null
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        if (this.hasAttribute('height')) {
          this.height = parseInt(this.getAttribute('height'), 10)
        }
        if (this.hasAttribute('width')) {
          this.width = parseInt(this.getAttribute('width'), 10)
        }
        if (this.hasAttribute('itemSize')) {
          this.itemSize = parseInt(this.getAttribute('itemSize'), 10)
        }
        if (this.hasAttribute('itemCount')) {
          this.itemCount = parseInt(this.getAttribute('itemCount'), 10)
        }
        this.styleNode.innerHTML = `
            :host {
                    display: block;
                    height: ${this.height}px;
                    width: ${this.width}px;
                    box-sizing: border-box;
                }
              .container {
                    height: 100%;
                    width: 100%;
                    overflow: auto;
                    box-sizing: border-box;
              }
        `
        this.shadowRoot.appendChild(this.styleNode);
        this.shadowRoot.appendChild(this.containerNode);
        this.containerNode.classList.add('container');
        this.containerNode.appendChild(this.contentNode);
        this.contentNode.style.height = `${this.itemCount * this.itemSize}px`;
        this.contentNode.style.position = 'relative';        
        this.contentNode.style.width = '100%';
        this.contentNode.innerHTML = `
          <slot name="item"></slot>
        `
        this.setTombstones()
      }
    connectedCallback() {
      this.setObserver()
      this.setScrollData();
      const firstIndex = 0;
      const lastIndex = Math.floor(this.height / this.itemSize)
      this.showItem(firstIndex, lastIndex)
      this.containerNode.addEventListener('scroll', this.scrollEvent.bind(this))
      this.setMutationObserver()
    }
    disconnectedCallback() {
      this.indexNodeMap.clear()
      this.observer.disconnect()
      this.containerNode.removeEventListener('scroll', this.scrollEvent.bind(this))
      this.mutationObserver.disconnect()
    }
    // observer callback，當item離開畫面時，就會去除slot屬性，並且移出showNodeWeakSet
    observeCallback = (entries, observer) => {
      entries.forEach(({intersectionRatio, target}) => {
        if (intersectionRatio <= 0) {
          target.removeAttribute('slot');
          observer.unobserve(target);
          this.showNodeWeakSet.delete(target);
        }
      })
    }
    // 綁上observer
    setObserver() {
      const observeOptions = {
        root: this.containerNode,
        rootMargin: `${ this.topCount *  this.itemSize}px 0px ${ 1 * this.itemSize}px 0px`,
        threshold: 0
      }
      this.observer = new IntersectionObserver(this.observeCallback, observeOptions)
    }
    setScrollData() {
      let index = 0
      let ScrollTop = 0
      for ( const item of this.children) {
        item.style = `
          position: absolute;
          top: ${ScrollTop}px;
          left: 0;
        `
        ScrollTop += this.itemSize;
        this.indexNodeMap.set(index, item);
        index += 1;
      }
    }
    // 滾動事件，利用互斥鎖和requestAnimationFrame，避免同時觸發多次
    scrollEvent() {
      requestAnimationFrame(() => {
        if (!this.hasLock) {
          this.hasLock = true;
          const [firstIndex, lastIndex] = this.calcIndex()
          this.showItem(firstIndex, lastIndex)
          this.hasLock = false;
        }            
      })
    }
    // 根據滾動位置，計算要顯示的項目index
    calcIndex(){
      const top = this.containerNode.scrollTop;
      const range = top + this.height + ( this.topCount + this.bottomCount ) * this.itemSize
      const first = Math.floor(top / this.itemSize);
      const last = Math.ceil(range / this.itemSize);
      return [first, last]
    }
    // 根據index，顯示項目
    showItem(firstIndex, lastIndex) {
      for (let index = firstIndex; index <= lastIndex; index++) {
        // 當index超出範圍時，就觸發handleAddItem
        if (index >= this.itemCount) {
          let indexArr = []
          if (index === lastIndex){
            indexArr = [index]
          } else {
            indexArr = Array.from({length: lastIndex - index + 1}, (v, k) => k + index)
          }
          this.dispatchEvent(new CustomEvent('handleAddItem', {detail: {indexArr}}))
          break;
        }
        // 當index小於0時，因為不用增加item，所以直接跳過
        if (index < 0) {
          break;
        }
        // 當 0 < index < maxIndex 時，有機會要增加顯示的item，所以要先判斷是否有該item，再加入showNodeWeakSet
        const item = this.indexNodeMap.get(index);
        if (!this.showNodeWeakSet.has(item)) {
          item.setAttribute('slot', 'item');
          this.observer.observe(item);
          this.showNodeWeakSet.add(item);
        }
      }
    }
    // 設置tombstone
    setTombstones() {
      if (!customElements.get('my-list-tombstones') ) {
        customElements.define("my-list-tombstones", myListTombstones);
      }
      this.tombstonesNode = document.createElement('my-list-tombstones');
      this.contentNode.appendChild(this.tombstonesNode);
      this.tombstonesNode.style = `
      position: absolute;
      top: ${this.itemCount * this.itemSize}px;
      left: 0;
    `
    this.contentNode.style.height = `${this.itemCount * this.itemSize + this.itemSize}px`;
  }
  // 設置mutationObserver，當item數量改變時，就會重新計算
  mutationCallback(mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        const addedNodes = mutation.addedNodes;
        for (const node of addedNodes) {
          node.style = `
          position: absolute;
          top: ${this.itemCount * this.itemSize}px;
          `
          this.indexNodeMap.set(this.itemCount, node);
          this.itemCount = this.itemCount + 1
        }
        this.contentNode.style.height = `${( this.itemCount) * this.itemSize + this.itemSize}px`; 
        this.tombstonesNode.style.top = `${this.itemCount * this.itemSize}px`;
      }
    }
    this.dispatchEvent(new CustomEvent('addItemFinish'))
  }
  // MutationObserver，當有item被加入時，就會觸發mutationCallback
  setMutationObserver() {
    const config = { attributes: true, childList: true, characterData: true };
    this.mutationObserver = new MutationObserver(this.mutationCallback.bind(this));
    this.mutationObserver.observe(this, config);
  }
}

export class myListItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
            display: block;
            width: 100px;
            height: 100px;
            background-color: #eee;
            border: 1px solid #ccc;
            box-sizing: border-box;
        }
      </style>
      <slot></slot>
    `;
  }
}

export class myListTombstones extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
            display: block;
            width: 100px;
            height: 100px;
            background-color: #eee;
            border: 1px solid #ccc;
            box-sizing: border-box;
        }
      </style>
      <div>Loading...</div>
    `;
  }
}
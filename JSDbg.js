class JSDbg1 {
    constructor(options) {
        this.initOptions(options);
        this.createBody();
        this.createHeader();
        this.createAdditionalTabs();
        this.bodyResizableInit();
        this.options.windowObj.addEventListener('error', function(event) {
            let string = event.message + ' at ' + (event.source ? event.source + ':' : '') + event.lineno + ':' + event.colno;
            console.error(string);
        });
        this.options.logger.developerScreen = this.consoleEl;
        this.options.inspector.inspectorHTMLContainer = this.inspectorHTMLContainer;
        this.options.inspector.inspectorStylesContainer = this.inspectorStylesContainer;
        this.options.inspector.debuggerId = this.body.id;
        this.options.inspector.windowObj = this.options.windowObj;
        this.logger = new (this.options.loggerClass || JSLogger1)(this.options.logger);
        try {
            this.inspector = new (this.options.inspectorClass || JSInspector1)(this.options.inspector);
        } catch (e) {
            alert(e.stack);
        }
        this.watched = {};
    }

    initOptions(options) {
        this.options = options || {};

        this.options.additionalTabs = this.options.additionalTabs || [];

        this.options.additionalTabs.push({
            tabName: 'Editor',
            className: JSEditor1,
            bodyIdx: 'JSEditor',
            options: {}
        });

        this.options.additionalTabs.push({
            tabName: 'Git',
            className: JSGitHelper1,
            bodyIdx: 'JSGitHelper',
            options: {}
        });

        this.options.windowObj = this.options.windowObj || window;

        //body
        this.options.body = this.options.body || {};
        this.options.body.backgroundColor = this.options.body.backgroundColor || 'white';
        this.options.body.keyToggle = this.options.body.keyToggle || 'F9';
        this.options.body.initiallyOpened = this.options.body.initiallyOpened || false;

        //header
        this.options.header = this.options.header || {};
        this.options.header.backgroundColor = this.options.header.backgroundColor || '#fafafa';
        this.options.header.borderColor = this.options.header.borderColor || '#eaeaea';
        this.options.header.tabColor = this.options.header.tabColor || '#666';
        this.options.header.tabSelectedColor = this.options.header.tabSelectedColor || '#2f85d1';
        this.options.header.tabHoverBackground = this.options.header.tabHoverBackground || '#eeeeee';

        //logger
        this.options.logger = this.options.logger || {};
        this.options.logger.useDeveloperScreen = this.options.logger.useDeveloperScreen || true;

        //inspector
        this.options.inspector = this.options.inspector || {};
    }

    createBody() {
        this.body = document.createElement('div');
        this.body.id = Math.random().toString(36).substring(7);
        this.body.style.all = 'initial';
        this.body.style.fontFamily = 'Arial, Helvetica, sans-serif';
        this.body.style.position = 'fixed';
        this.body.style.display = this.options.body.initiallyOpened ? 'block' : 'none';
        this.body.style.bottom = '0';
        this.body.style.padding = '0';
        this.body.style.height = '30%';
        this.body.style.width = '100%';
        this.body.style.fontSize = '11px';
        this.body.style.zIndex = '20000';
        this.body.style.backgroundColor = this.options.body.backgroundColor;

        this.options.windowObj.document.body.appendChild(this.body);

        this.options.windowObj.document.body.addEventListener('keyup', this._handleKeyUp.bind(this));

        this.createInspector();
        if (this.options.logger.useDeveloperScreen){
             this.createConsole();
             this.CommandInterpreter = new JSCommandInterpreter1({mainDebugger: this});
        }
    }

    bodyResizableInit() {
        let _this = this;
        this.header.addEventListener('mousedown', initDrag, false);
        this.header.style.cursor = 'ns-resize';

        var startY, startHeight;

        function initDrag(e) {
            startY = e.clientY;
            startHeight = parseInt(document.defaultView.getComputedStyle(_this.body).height, 10);
            document.documentElement.addEventListener('mousemove', doDrag, false);
            document.documentElement.addEventListener('mouseup', stopDrag, false);
        }

        function doDrag(e) {
            let height = (startHeight - e.clientY + startY);
            _this.body.style.height = height + 'px';

            //emit new height to currently opened tab
            let activeTab = _this.header.querySelector('.debug-selected-tab'),
                heightChangedEv = new CustomEvent('heightchange', { detail: height }),
                activeTabBody = _this.body.querySelector('.' + activeTab.dataset.body);
                
            activeTabBody.dispatchEvent(heightChangedEv)
        }

        function stopDrag(e) {
            document.documentElement.removeEventListener('mousemove', doDrag, false);
            document.documentElement.removeEventListener('mouseup', stopDrag, false);
        }
    }

    createInspector() {
        this.inspectorEl = document.createElement('div');
        this.inspectorEl.classList.add('debug-inspector');
        this.inspectorEl.style.height = 'calc(100% - 25px)';
        this.body.appendChild(this.inspectorEl);

        this.inspectorHTMLContainer = document.createElement('div');
        this.inspectorHTMLContainer.classList.add('debug-inspector-html');
        this.inspectorHTMLContainer.style.width = '75%';
        this.inspectorHTMLContainer.style.height = '98%';
        this.inspectorHTMLContainer.style.padding = '0';
        this.inspectorHTMLContainer.style.borderRight = '1px solid ' + this.options.header.borderColor;
        this.inspectorHTMLContainer.style.overflow = 'auto';
        this.inspectorHTMLContainer.style.display = 'inline-block';

        this.inspectorEl.appendChild(this.inspectorHTMLContainer);

        this.inspectorStylesContainer = document.createElement('div');
        this.inspectorStylesContainer.classList.add('debug-inspector-styles');
        this.inspectorStylesContainer.style.width = 'calc(25% - 20px)'; //there is scrollbar so not exactly 100%
        this.inspectorStylesContainer.style.height = '98%';
        this.inspectorStylesContainer.style.padding = '0';
        this.inspectorStylesContainer.style.overflow = 'auto';
        this.inspectorStylesContainer.style.display = 'inline-block';
        this.inspectorEl.appendChild(this.inspectorStylesContainer);
    }

    createConsole() {
        this.consoleEl = document.createElement('div');
        this.consoleEl.classList.add('debug-console');
        this.consoleEl.style.padding = '0';
        this.consoleEl.style.flexFlow = 'column';
        this.consoleEl.style.justifyContent = 'center';
        this.consoleEl.style.display = 'none';
        this.consoleEl.style.height = '95%';
        this.consoleEl.style.maxHeight = 'calc(100% - 25px)';
        this.body.appendChild(this.consoleEl);

        this.headerConsole = document.createElement('div');
        this.headerConsole.classList.add('debug-console-header');
        this.headerConsole.style.height = '5%';
        this.headerConsole.style.minHeight = '20px';
        this.headerConsole.style.backgroundColor = this.options.header.backgroundColor;
        this.headerConsole.style.borderBottom = '1px solid ' + this.options.header.borderColor;
        this.headerConsole.style.display = 'flex';
        this.headerConsole.style.alignItems = 'center';
        this.consoleEl.appendChild(this.headerConsole);

        this.itemsConsole = document.createElement('div');
        this.itemsConsole.classList.add('debug-console-items');
        this.itemsConsole.style.padding = '0';
        this.itemsConsole.style.flexGrow = '1';
        this.itemsConsole.style.overflow = 'auto';
        this.itemsConsole.style.borderBottom = '1px solid ' + this.options.header.borderColor;
        this.itemsConsole.style.display = 'flex';
        this.itemsConsole.style.flexDirection = 'column';
        // this.itemsConsole.style.flexDirection = 'column';
        this.consoleEl.appendChild(this.itemsConsole);

        this.interactConsole = document.createElement('div');
        this.interactConsole.classList.add('debug-console-interact');
        this.interactConsole.style.padding = '0';
        this.interactConsole.style.minHeight = '20px';
        this.interactConsole.style.display = 'flex';
        this.interactConsole.style.border = '1px solid ' + this.options.header.borderColor;

        let interactSymbol = document.createElement('span');
        interactSymbol.innerText = '>>';
        this.interactConsole.appendChild(interactSymbol);

        this.interactInput = document.createElement('input');
        this.interactInput.style.border = 'none';
        this.interactInput.style.flexGrow = '1';
        this.interactConsole.appendChild(this.interactInput);
        this.interactConsole.addEventListener('keyup', this._handleInteractInput.bind(this));

        this.consoleEl.appendChild(this.interactConsole);
    }

    createHeader() {
        this.header = document.createElement('div');
        this.header.classList.add('logger-header');
        // this.header.style.height = '5%';
        this.header.style.minHeight = '25px';
        this.header.style.backgroundColor = this.options.header.backgroundColor;
        this.header.style.borderTop = '2px solid ' + this.options.header.borderColor;
        this.header.style.borderBottom = '1px solid ' + this.options.header.borderColor;
        this.header.style.display = 'flex';
        this.header.style.alignItems = 'center';
        this.header.style.padding = '0';

        this.inspectorTab = document.createElement('div');
        this.inspectorTab.innerText = 'Inspector';
        this.inspectorTab.style.display = 'inline';
        this.inspectorTab.classList.add('debug-selected-tab');
        this.inspectorTab.style.color = this.options.header.tabSelectedColor;
        this.inspectorTab.style.borderTop = '2px solid ' + this.options.header.tabSelectedColor;
        this.inspectorTab.style.marginRight = '10px';
        this.inspectorTab.style.padding = '2px';
        this.inspectorTab.style.height = 'calc(100% - 4px)';
        this.inspectorTab.style.cursor = 'pointer';
        this.inspectorTab.dataset.body = 'debug-inspector';
        this.inspectorTab.addEventListener('mouseover', this._handleTabMouseOver.bind(this));
        this.inspectorTab.addEventListener('mouseout', this._handleTabMouseOut.bind(this));
        this.inspectorTab.addEventListener('click', this._handleTabClick.bind(this));
        this.header.appendChild(this.inspectorTab);

        if (this.options.logger.useDeveloperScreen) {
            this.loggerTab = document.createElement('div');
            this.loggerTab.innerText = 'Console';
            this.loggerTab.style.display = 'inline';
            this.loggerTab.style.color = this.options.header.tabColor;
            this.loggerTab.style.marginRight = '10px';
            this.loggerTab.style.padding = '2px';
            this.loggerTab.style.height = 'calc(100% - 4px)';
            this.loggerTab.style.cursor = 'pointer';
            this.loggerTab.dataset.body = 'debug-console';
            this.loggerTab.addEventListener('mouseover', this._handleTabMouseOver.bind(this));
            this.loggerTab.addEventListener('mouseout', this._handleTabMouseOut.bind(this));
            this.loggerTab.addEventListener('click', this._handleTabClick.bind(this));
            this.header.appendChild(this.loggerTab);
            this.loggerTab.click(); //little hack to focus on console tab
        }

        this.body.insertBefore(this.header, this.body.firstChild);
    }

    createAdditionalTabs(){
        if (this.options.additionalTabs.length) {
            this.additionalTabs = this.additionalTabs || [];
            for (let idx in this.options.additionalTabs) {
                this.addTab(this.options.additionalTabs[idx]);
            }
        }
    }

    addTab(addTab){
        this.additionalTabs = this.additionalTabs || [];
        this.additionalTabs.push({});
        let idx = this.additionalTabs.length - 1;

        this.additionalTabs[idx].body = document.createElement('div');
        this.additionalTabs[idx].body.style.display = 'none';
        this.additionalTabs[idx].body.style.height = 'calc(100% - 25px)';
        this.additionalTabs[idx].body.classList.add(addTab.bodyIdx);
        this.additionalTabs[idx].options = addTab.options || {};
        this.additionalTabs[idx].options.body = this.additionalTabs[idx].body;
        this.additionalTabs[idx].object = new addTab.className(this.additionalTabs[idx].options);
        this.body.appendChild(this.additionalTabs[idx].body);

        this.additionalTabs[idx].element = document.createElement('div');
        this.additionalTabs[idx].element.innerText = addTab.tabName;
        this.additionalTabs[idx].element.style.display = 'inline';
        this.additionalTabs[idx].element.style.color = this.options.header.tabColor;
        this.additionalTabs[idx].element.style.marginRight = '10px';
        this.additionalTabs[idx].element.style.padding = '2px';
        this.additionalTabs[idx].element.style.height = 'calc(100% - 4px)';
        this.additionalTabs[idx].element.style.cursor = 'pointer';
        this.additionalTabs[idx].element.dataset.body = addTab.bodyIdx;
        this.additionalTabs[idx].element.addEventListener('mouseover', this._handleTabMouseOver.bind(this));
        this.additionalTabs[idx].element.addEventListener('mouseout', this._handleTabMouseOut.bind(this));
        this.additionalTabs[idx].element.addEventListener('click', this._handleTabClick.bind(this));
        this.header.appendChild(this.additionalTabs[idx].element);
    }

    _handleKeyUp(ev) {
        if (ev.key == this.options.body.keyToggle) {
            if (this.body.style.display == 'none') {
                this.body.style.display = 'block';
                if (this.options.logger.useDeveloperScreen && this.loggerTab.classList.contains('debug-selected-tab')) {
                    this.logger._render();
                }
            } else {
                this.body.style.display = 'none';
            }
        }
    }

    _handleTabMouseOver(ev) {
        ev.target.style.backgroundColor = this.options.header.tabHoverBackground;
    }

    _handleTabMouseOut(ev) {
        ev.target.style.backgroundColor = '';
    }

    _handleTabClick(ev) {
        if (ev.target.classList.contains('debug-selected-tab')) return;
        let activeTab = this.header.querySelector('.debug-selected-tab');
        activeTab.classList.remove('debug-selected-tab');
        activeTab.style.color = this.options.header.tabColor;
        activeTab.style.borderTop = '';
        this.body.querySelector('.' + activeTab.dataset.body).style.display = 'none';

        let componentElement = this.body.querySelector('.' + ev.target.dataset.body);
        componentElement.style.display = 'flex';
        ev.target.classList.add('debug-selected-tab');
        ev.target.style.color = this.options.header.tabSelectedColor;
        ev.target.style.borderTop = '2px solid ' + this.options.header.tabSelectedColor;

        let event = new Event('tabOpened');
        componentElement.dispatchEvent(event);
    }

    _handleInteractInput(ev) {
        if (ev.keyCode == 13) {
            let text = ev.target.value;
            if(text.length > 1 && (text[0] == ':' || text[0] == '\\' || text[0] == '/')){
                this.CommandInterpreter.execute(text.substring(1));
            }else {
                this.logger.log('Executing: ' + text);

                if (!this.interactionsArray) {
                    this.interactionsArray = [];
                    this.interactionsArray.push(text);
                } else {
                    if (this.interactionsArray[this.interactionsArray.length - 1] != text) this.interactionsArray.push(text);
                }
                try {
                    //let context = {today: new Date()};
                    // text = (new Function(...Object.keys(context), `return ${text}`))(...Object.values(context));
                    let context = {today: toPMDate(new Date())};
                    with(context){
                        text = eval(text);
                    }
                    this.logger.log(text);
                } catch (e) {
                    text = e.stack;
                    this.logger.error(text);
                }
            }
            ev.target.value = '';
            this.commandIndex = -1;
        } else if (ev.keyCode == 38) {
            if (this.commandIndex == -1) {
                this.commandIndex = this.interactionsArray.length - 1;
            } else if (this.commandIndex == 0) {
                this.commandIndex = 0;
            } else {
                this.commandIndex--;
            }
            ev.target.value = this.interactionsArray[this.commandIndex];
        } else if (ev.keyCode == 40) {
            if (this.commandIndex == -1 || this.commandIndex == this.interactionsArray.length - 1) {
                this.commandIndex = -1;
                ev.target.value = '';
                return;
            } else {
                this.commandIndex++;
            }
            ev.target.value = this.interactionsArray[this.commandIndex];
        }
    }

    //Public API
    watch(obj, objId, prop) {
        this.logger.log('Setting watch on property ' + prop + ' of ' + objId);

        let targetProxy;
        if (!this.watched[objId]) {
            let _this = this;

            targetProxy = new Proxy(obj, {
                set: function (target, key, value) {
                    if (_this.watched[objId].props.indexOf(key) > -1) {
                        _this.logger.log(objId + '.' + key + ' value set to ' + value);
                    }
                    target[key] = value;
                    return true;
                }
            });

            this.watched[objId] = {
                initialObj: obj,
                props: [].concat(prop),
                targetProxy: targetProxy
            }
        } else {
            let propWatched = this.watched[objId].props.findIndex((p) => p == prop) > -1;
            if (propWatched) {
                this.logger.warn('Property ' + prop + ' on object ' + objId + ' is already being watched!');
            } else {
                this.watched[objId].props.push(prop);
            }
            targetProxy = this.watched[objId].targetProxy;
        }
        return targetProxy;
    }

    unwatch(objId, prop) {
        let propIdx = this.watched[objId].props.findIndex((p) => p == prop);
        if (propIdx > -1) {
            this.watched[objId].props.splice(propIdx, 1);
        }
        if (!this.watched[objId].props.length) {
            this.logger.log('No properties left to watch on ' + objId);
            let obj = this.watched[objId].initialObj;
            delete this.watched[objId];
            return obj;
        } else {
            return this.watched[objId].targetProxy;
        }
    }

    getLogFunction() {
        return this.logger.log.bind(this.logger);
    }

    getWarnFunction() {
        return this.logger.warn.bind(this.logger);
    }

    getErrorFunction() {
        return this.logger.error.bind(this.logger);
    }
}

class JSLogger1 {
    constructor(options) {
        this.initOptions(options);
        this.logsArray = [];
        this.lastShownIndex = -1;
        this.lastOverflownCheckedIndex = -1;
        this.isSetRenderTimeout = false;
        this.errClass = Error;
        this.errClass.prototype.write = function () {
            return this.stack;
        }
        this.createRowNode();
        this._setEvents();
    }

    initOptions(options) {
        this.options = options || {};
        this.options.includeDate = this.options.includeDate || true;
        this.options.includeTime = this.options.includeTime || true;
        this.options.logBackgroundColor = this.options.logBackgroundColor || '#fefefe';
        this.options.logColor = this.options.logColor || '#818182';
        this.options.warnBackgroundColor = this.options.warnBackgroundColor || '#fff3cd';
        this.options.warnColor = this.options.warnColor || '#856404';
        this.options.errorBackgroundColor = this.options.errorBackgroundColor || '#f8d7da';
        this.options.errorColor = this.options.errorColor || '#721c24';
        this.options.stackBackgroundColor = this.options.stackBackgroundColor || '#fefefe';
        this.options.stackColor = this.options.stackColor || '#818182';
        this.options.stackBorderColor = this.options.stackBorderColor || '#444';
        this.options.stackAnnotationColor = this.options.stackAnnotationColor || '#42a7f5';
        this.options.bufferSize = this.options.bufferSize || 500;
        this.options.itemsConsole = this.options.developerScreen.querySelector('.debug-console-items');
    }

    //public methods
    log(...items) {
        this._log(items, 'log');
    }

    warn(...items) {
        this._log(items, 'warn');
    }

    error(...items) {
        this._log(items, 'error');
    }

    //private methods
    _log(items, type) {
        let text = '';
        for(let item of items){
           text += this._prepareString(item) + ' ';
        }
        let stack = this.errClass().write().split('\n').slice(3);

        let rowObj = {
            text: text,
            type: type,
            stack: stack,
            date: new Date()
        };

        this.logsArray.push(rowObj);

        if (this.options.itemsConsole.parentNode.style.display != 'none' && this.options.itemsConsole.parentNode.parentNode.style.display != 'none' && !this.isSetRenderTimeout) {
            this.isSetRenderTimeout = true;
            let _this = this;
            setTimeout(function(){
                _this._render();
                _this.isSetRenderTimeout = false;
            }, 10);
        }
    }

    _insertRow(rowObj, idx){
        let stackAnnotation = rowObj.stack[0],
            fileName = stackAnnotation.split('/');
        stackAnnotation = stackAnnotation.split('(')[0].substring(6) + (fileName.length > 1 ? ' at ' + fileName.pop() : '');

        let currLog = this.rowNode.cloneNode(true);
        currLog.dataset.index = idx != undefined ? idx : this.logsArray.length - 1;
        switch (rowObj.type) {
            case 'log':
                currLog.style.color = this.options.logColor;
                currLog.style.backgroundColor = this.options.logBackgroundColor;
                break;
            case 'warn':
                currLog.style.color = this.options.warnColor;
                currLog.style.backgroundColor = this.options.warnBackgroundColor;
                break;
            case 'error':
                currLog.style.color = this.options.errorColor;
                currLog.style.backgroundColor = this.options.errorBackgroundColor;
                break;
        }

        //additional info
        let additionalDiv = currLog.firstChild;
        let currDate = rowObj.date;
        if (this.options.includeDate) {
            additionalDiv.innerText += ' ' + this._formatDate(currDate);
        }
        if (this.options.includeTime) {
            additionalDiv.innerText += ' ' + this._formatTime(currDate);
        }

        currLog.children[1].firstChild.addEventListener('click', this._handleCopyClick.bind(this));

        //main info
        let mainDiv = currLog.children[2];
        mainDiv.innerText = rowObj.text;

        //stack info
        let stackDiv = currLog.children[3];
        stackDiv.innerText = stackAnnotation;
        stackDiv.addEventListener('mouseover', this._handleStackMouseover.bind(this));
        stackDiv.addEventListener('mouseout', this._handleStackMouseout.bind(this));

        currLog.addEventListener('mouseover', this._handleRowMouseover.bind(this));
        currLog.addEventListener('mouseout', this._handleRowMouseout.bind(this));

        return currLog;
        //this.options.itemsConsole.appendChild(currLog);
    }

    createRowNode(){
        let currLog = document.createElement('div');
        currLog.classList.add('logger-row');
        currLog.style.width = '100%';
        currLog.style.display = 'flex';
        currLog.style.minHeight = '1.2em';
        currLog.style.padding = '0';

        //additional info
        let additionalDiv = document.createElement('div');
        additionalDiv.style.width = '8%';
        additionalDiv.style.padding = '0';
        additionalDiv.style.fontSize = '11px';
        additionalDiv.className = 'additional-info';
        currLog.appendChild(additionalDiv);

        //main info
        let controlsDiv = document.createElement('div'),
            copyIcon = document.createElement('i');

        copyIcon.classList.add('logger-row-copy');
        copyIcon.style.all = 'initial';
        copyIcon.style.fontSize = '11px';
        copyIcon.style.fontStyle = 'normal';
        copyIcon.style.visibility = 'hidden';
        copyIcon.style.cursor = 'pointer';
        copyIcon.innerText = '📋'; //LOL
        controlsDiv.appendChild(copyIcon);
        controlsDiv.style.width = '3%';
        controlsDiv.style.maxHeight = '1em';
        controlsDiv.style.padding = '0';
        controlsDiv.classList.add('logger-row-controls');
        currLog.appendChild(controlsDiv);

        let mainDiv = document.createElement('div');
        mainDiv.classList.add('logger-row-text');
        mainDiv.style.padding = '0';
        mainDiv.style.width = '74%';
        mainDiv.style.whiteSpace = 'pre-wrap';
        mainDiv.style.overflow = 'hidden';
        mainDiv.style.maxHeight = '1.2em';
        mainDiv.style.fontSize = '11px';
        currLog.appendChild(mainDiv);

        //stack info
        let stackDiv = document.createElement('div');
        stackDiv.style.width = '15%';
        stackDiv.style.padding = '0';
        stackDiv.style.overflow = 'hidden';
        stackDiv.style.color = this.options.stackAnnotationColor;
        currLog.appendChild(stackDiv);

        let expandIcon = document.createElement('i');

        expandIcon.classList.add('logger-row-expand');
        expandIcon.style.all = 'initial';
        expandIcon.style.color = currLog.style.color;
        expandIcon.style.fontSize = '11px';
        expandIcon.style.display = 'inline-block';
        expandIcon.style.fontStyle = 'normal';
        expandIcon.style.cursor = 'pointer';
        expandIcon.style.marginLeft = '2px';
        expandIcon.style.cssFloat = 'right';
        expandIcon.innerText = '>';
        expandIcon.dataset.expanded = 'false';
        expandIcon.style.fontSize = '1em';
        expandIcon.style.visibility = 'hidden';
        controlsDiv.appendChild(expandIcon);

        this.rowNode = currLog;
    }

    checkOverflowns(){
        let _this = this;
        setTimeout(function(){
            // for(let i = _this.lastOverflownCheckedIndex + 1; i < _this.options.itemsConsole.children.length; ++i){
            //     let currLog = _this.options.itemsConsole.children[i];
            //     if (_this._isYOverflown(currLog.children[2])) {
            //         let expandIcon = currLog.children[1].children[1];
            //         expandIcon.style.visibility = 'visible';
            //         expandIcon.addEventListener('click', _this._handleExpandClick.bind(_this));
            //     }
            // }
            // _this.lastOverflownCheckedIndex = _this.lastShownIndex;
            // _this.options.itemsConsole.children[_this.lastShownIndex].scrollIntoView();

            for(let i = 0; i < _this.options.itemsConsole.children.length; ++i){
                let currLog = _this.options.itemsConsole.children[i];
                if (_this._isYOverflown(currLog.children[2])) {
                    let expandIcon = currLog.children[1].children[1];
                    expandIcon.style.visibility = 'visible';
                    expandIcon.addEventListener('click', _this._handleExpandClick.bind(_this));
                }
            }
            _this.options.itemsConsole.lastChild.scrollIntoView();
        }, 10);
    }

    _render() {
        let itemsInConsole = this.options.itemsConsole.children.length,
            toRemoveCount = itemsInConsole + Math.min(this.logsArray.length - this.lastShownIndex, this.options.bufferSize) - this.options.bufferSize - 1;
    
        for(let i = 0; i<toRemoveCount; ++i){
            this.options.itemsConsole.removeChild(this.options.itemsConsole.firstChild);
        }

        if (this.lastShownIndex < this.logsArray.length - 1) {
            let fragment =  document.createDocumentFragment();;
            for (let i = this.lastShownIndex + 1; i < this.logsArray.length; ++i) {
                fragment.appendChild(this._insertRow(this.logsArray[i], i));
            }
            this.options.itemsConsole.appendChild(fragment);
            this.lastShownIndex = this.logsArray.length - 1;
            this.checkOverflowns();
        }
    }

    _handleRowMouseover(ev) {
        let row = ev.target.parentNode;
        if (row.classList.contains('logger-row')) {
            row.querySelector('.logger-row-copy').style.visibility = 'visible';
            row.classList.add('active-logger-row');
        }
    }

    _handleRowMouseout(ev) {
        let reltarget = ev.relatedTarget;
        let activeRow = this.options.itemsConsole.querySelector('.active-logger-row');

        if (activeRow && (!reltarget || !reltarget.parentNode || (!reltarget.classList.contains('logger-row-controls') || reltarget.parentNode != activeRow)
            && !reltarget.parentNode.classList.contains('logger-row-controls'))) {
            activeRow.querySelector('.logger-row-copy').style.visibility = 'hidden';
            activeRow.classList.remove('active-logger-row');
        }
    }

    _handleCopyClick(ev) {
        let text = ev.target.parentNode.nextSibling.innerText,
            input = document.createElement('input');
        input.value = text;
        this.options.itemsConsole.appendChild(input);
        input.select();
        document.execCommand("copy");
        this.options.itemsConsole.removeChild(input);
    }

    _handleExpandClick(ev) {
        let row = ev.target.parentNode.nextSibling;
        if (ev.target.dataset.expanded == 'false') {
            ev.target.dataset.expanded = 'true';
            ev.target.style.transform = 'rotateZ(90deg)';
            row.style.overflow = 'visible';
            row.style.maxHeight = null;
            row.parentNode.style.minHeight = row.scrollHeight + 'px';
        } else {
            ev.target.dataset.expanded = 'false';
            ev.target.style.transform = 'rotateZ(0deg)';
            row.style.overflow = 'hidden';
            row.style.maxHeight = '1.2em';
            row.parentNode.style.minHeight = '1.2em';
        }
    }

    _handleStackMouseover(ev) {
        let idx = ev.target.parentNode.dataset.index,
            stack = this.logsArray[idx].stack;

        let stackDiv = document.createElement('div');
        stackDiv.classList.add('debug-active-stack');
        stackDiv.style.position = 'absolute';
        stackDiv.style.backgroundColor = this.options.stackBackgroundColor;
        stackDiv.style.color = this.options.stackColor;
        stackDiv.style.boxShadow = '3px 2px 5px ' + this.options.stackBorderColor;
        stackDiv.style.left = '54%';
        stackDiv.style.width = '30%';
        stackDiv.style.paddingTop = '2px';
        stackDiv.style.paddingLeft = '4px';
        stackDiv.innerText = stack.join('\n');
        this.options.itemsConsole.appendChild(stackDiv);
    }

    _handleStackMouseout(ev) {
        this.options.itemsConsole.removeChild(this.options.itemsConsole.querySelector('.debug-active-stack'));
    }

    _prepareString(item) {
        let type = typeof item;
        if(type == 'object'){
            if(item instanceof Element)
                return item.outerHTML || '';
            return JSON.stringify(item, null, 4);
        }
        else if (typeof item == 'function') return item.toString();
        else return item;
    }

    _formatDate(date) {
        return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((d) => d.toString().padStart(2, '0')).join('-');
    }

    _formatTime(date) {
        return [date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()].map((d) => d.toString().padStart(2, '0')).join(':');
    }

    _isYOverflown(element) {
        return element.scrollHeight - 2 > element.clientHeight;
    }

    _setEvents() {
        this.options.itemsConsole.parentNode.addEventListener('tabOpened', this._render.bind(this));
    }
}

class PMJSDownloader1 {
    constructor(options) {
        this.initOptions(options);
        this.initBody();
    }

    //private methods
    initOptions(options) {
        this.options = options || {};
        if (this.options.body) this.body = this.options.body;
        else throw "No body element provided in options!";
    }

    initBody() {
        this.objList = ['docs/jsdbgtest.pm', 'reports/posRestaurantSales.pm', 'js/utils/stroitel.js', 'js/grid/grid.js', 'js/pm.js', 'js/ui/pmtree.js', 'js/ui/scrollbar.js'];
        this.wrapper = document.createElement('div');
        this.wrapper.style.width = '100%';

        this.objInput = document.createElement('input');
        this.objInput.placeholder = 'docs/*.pm | js/*.js | css/.css file';
        this.objInput.style.width = '20%';
        this.setAutocomplete(this.objInput, this.objList);
        this.wrapper.appendChild(this.objInput);

        this.pathInput = document.createElement('input');
        this.pathInput.placeholder = 'Where to save file (ex. data/pm.js)';
        this.pathInput.style.marginLeft = '20px';
        this.pathInput.style.width = '20%';
        this.wrapper.appendChild(this.pathInput);

        this.writeButton = document.createElement('button');
        this.writeButton.style.marginLeft = '10px';
        this.writeButton.value = 'Extract';
        this.writeButton.innerText = 'Extract';
        let _this = this;
        this.writeButton.addEventListener('click', function () {
            let fileToExtract = _this.objInput.value,
                pathForExtraction = _this.pathInput.value,
                fileExtension = fileToExtract.split('.').pop();

            switch (fileExtension) {
                case 'js':
                case 'css':
                    let winPar = window.parent.parent.parent; //?? ????? ?????? ? ?????? parent
                    let loc = winPar.location;
                    let full = loc.protocol + '//' + loc.hostname + (loc.port ? ':' + loc.port : '');
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open("GET", full + '/' + fileToExtract, false); // false for synchronous 
                    xmlHttp.send(null);
                    if (xmlHttp.status === 200) {
                        pm.writeFile(pathForExtraction, xmlHttp.responseText);
                        alert('Extracted!');
                    }
                    break;
                case 'pm':
                    let text = pm.getPage(fileToExtract);
                    pm.writeFile(pathForExtraction, text);
                    alert('Extracted!');

                    // let isReport = false;
                    // if(fileToExtract.indexOf('../reports') > -1){
                    //     isReport = true;
                    // }

                    // let windowObj = window.parent.findTab ? window.parent : window.parent.parent;
                    // windowObj.load(fileToExtract, '???');
                    // fileToExtract = fileToExtract.split('/').pop();
                    // setTimeout(function(){
                    //     try{
                    //     let text = window.document.body.outerHTML;
                    //     pm.writeFile(pathForExtraction, text);
                    //     let currPosTab = windowObj.findTab((isReport ? 'reports/' : 'docs/') + fileToExtract, '???');
                    //     windowObj.closeTab(currPosTab);
                    //     alert('Extracted!');
                    //     }catch(e){alert(e.stack);}
                    // }, 1000);
                    break;
            }
        });
        this.wrapper.appendChild(this.writeButton);

        this.body.appendChild(this.wrapper);
    }

    setAutocomplete(inp, arr) {
        /*the autocomplete function takes two arguments,
        the text field element and an array of possible autocompleted values:*/
        var currentFocus;
        /*execute a function when someone writes in the text field:*/
        inp.addEventListener("input", function (e) {
            var a, b, i, val = this.value;
            /*close any already open lists of autocompleted values*/
            closeAllLists();
            if (!val) { return false; }
            currentFocus = -1;
            /*create a DIV element that will contain the items (values):*/
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            /*append the DIV element as a child of the autocomplete container:*/
            this.parentNode.appendChild(a);
            /*for each item in the array...*/
            for (i = 0; i < arr.length; i++) {
                /*check if the item starts with the same letters as the text field value:*/
                if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    /*create a DIV element for each matching element:*/
                    b = document.createElement("DIV");
                    /*make the matching letters bold:*/
                    b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].substr(val.length);
                    /*insert a input field that will hold the current array item's value:*/
                    b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                    /*execute a function when someone clicks on the item value (DIV element):*/
                    b.addEventListener("click", function (e) {
                        /*insert the value for the autocomplete text field:*/
                        inp.value = this.getElementsByTagName("input")[0].value;
                        /*close the list of autocompleted values,
                        (or any other open lists of autocompleted values:*/
                        closeAllLists();
                    });
                    a.appendChild(b);
                }
            }
        });
        /*execute a function presses a key on the keyboard:*/
        inp.addEventListener("keydown", function (e) {
            var x = document.getElementById(this.id + "autocomplete-list");
            if (x) x = x.getElementsByTagName("div");
            if (e.keyCode == 40) {
                /*If the arrow DOWN key is pressed,
                increase the currentFocus variable:*/
                currentFocus++;
                /*and and make the current item more visible:*/
                addActive(x);
            } else if (e.keyCode == 38) { //up
                /*If the arrow UP key is pressed,
                decrease the currentFocus variable:*/
                currentFocus--;
                /*and and make the current item more visible:*/
                addActive(x);
            } else if (e.keyCode == 13) {
                /*If the ENTER key is pressed, prevent the form from being submitted,*/
                e.preventDefault();
                if (currentFocus > -1) {
                    /*and simulate a click on the "active" item:*/
                    if (x) x[currentFocus].click();
                }
            }
        });
        function addActive(x) {
            /*a function to classify an item as "active":*/
            if (!x) return false;
            /*start by removing the "active" class on all items:*/
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            /*add class "autocomplete-active":*/
            x[currentFocus].classList.add("autocomplete-active");
        }
        function removeActive(x) {
            /*a function to remove the "active" class from all autocomplete items:*/
            for (var i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        }
        function closeAllLists(elmnt) {
            /*close all autocomplete lists in the document,
            except the one passed as an argument:*/
            var x = document.getElementsByClassName("autocomplete-items");
            for (var i = 0; i < x.length; i++) {
                if (elmnt != x[i] && elmnt != inp) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        }
        /*execute a function when someone clicks in the document:*/
        document.addEventListener("click", function (e) {
            closeAllLists(e.target);
        });
    }
}

class JSInspector1 {
    constructor(options) {
        this.initOptions(options);
        this.elsWithNoCloseTag = ['INPUT', 'BR', 'HR'];//може да има още
        this.references = {};
        this.newEl = document.createElement('DIV'); //елемент, който влиза навътре (табулация)
        this.newEl.style.marginLeft = '10px';

        let _this = this;
        this.inspectPage();
        this.options.windowObj.document.body.addEventListener('keyup', function(ev){
            if(ev.ctrlKey){
                if(ev.key == 'r') _this.inspectPage();
            }
        });

        this.overlay = document.createElement('div');
        this.overlay.style.display = 'none';
        this.overlay.style.position = 'absolute';
        this.overlay.style.zIndex = '19999';
        this.overlay.style.backgroundClip = 'padding-box'; //background should not cover border
        this.overlay.style.boxSizing = 'border-box';
        this.overlay.style.backgroundColor = 'rgba(51,102,204,0.5)';
        this.options.windowObj.document.body.appendChild(this.overlay);

        this.marginOverlay = document.createElement('div');
        this.marginOverlay.style.display = 'none';
        this.marginOverlay.style.position = 'absolute';
        this.marginOverlay.style.zIndex = '19999';
        this.marginOverlay.style.backgroundClip = 'padding-box'; //background should not cover border
        this.marginOverlay.style.backgroundColor = 'rgba(51,102,204,0)';
        this.marginOverlay.style.boxSizing = 'border-box';
        this.options.windowObj.document.body.appendChild(this.marginOverlay);

        this.options.windowObj.document.body.addEventListener('contextmenu', function showInspectElement(evt) {
            try{
            let tempParent = evt.target.parentNode || evt.target; //ако е избрано body (няма parent)
            while (tempParent && !tempParent.isSameNode(_this.options.windowObj.document.body)) {
                if (tempParent.id == _this.options.debuggerId) return;
                tempParent = tempParent.parentNode;
            }
            let logMenu = document.getElementById('log_menu');
            logMenu && logMenu.parentNode.removeChild(logMenu);
            function mouseX(evt) {
                if (evt.pageX) {
                    return evt.pageX;
                } else if (evt.clientX) {
                    return evt.clientX + (document.documentElement.scrollLeft ?
                        document.documentElement.scrollLeft :
                        _this.options.windowObj.document.body.scrollLeft);
                } else {
                    return null;
                }
            }
            function mouseY(evt) {
                if (evt.pageY) {
                    return evt.pageY;
                } else if (evt.clientY) {
                    return evt.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : _this.options.windowObj.document.body.scrollTop);
                } else {
                    return null;
                }
            }
            let menu = document.createElement('div');
            let inspectBtn = document.createElement('div');
            //InspectBtn
            inspectBtn.innerText = 'Inspect element';
            inspectBtn.style.height = '100%';
            inspectBtn.style.display = 'flex';
            inspectBtn.style.alignItems = 'center';
            inspectBtn.style.justifyContent = 'center';
            inspectBtn.onmouseover = function deleteMouseOver(ev) {
                inspectBtn.style.backgroundColor = '#eaeaea';
                inspectBtn.style.borderRadius = '3px';
            }
            inspectBtn.onmouseout = function deleteMouseOut(ev) {
                inspectBtn.style.backgroundColor = 'white';
                inspectBtn.style.color = 'black';
            }
            menu.style.width = '6%';
            menu.style.height = '35px';
            menu.style.zIndex = '20001';
            menu.style.backgroundColor = 'white';
            menu.style.position = 'absolute';
            menu.setAttribute('id', 'log_menu');
            menu.style.borderRadius = '3px';
            menu.style.boxShadow = '1px 1px 3px #888888';
            let mX = mouseX(evt),
                mY = mouseY(evt);
            menu.style.left = mX + 'px';
            menu.style.top = mY + 'px';
            menu.style.textAlign = 'center';
            menu.style.verticalAlign = 'middle';
            menu.style.cursor = 'pointer';
            _this.options.windowObj.document.body.onclick = function menuOnBlur(ev) {
                if(menu && menu.parentNode)
                    menu.parentNode.removeChild(menu);
            }
            inspectBtn.onclick = function menuOnClick(ev) {
                setTimeout(function () { //in timeout, else sets currEl to inspectBtn
                    let currEl = document.elementFromPoint(evt.clientX, evt.clientY);
                    for (let idx in _this.references) {
                        if (_this.references[idx].isSameNode(currEl)) {
                            let foundEl = _this.options.inspectorHTMLContainer.querySelector('[data-reference="' + idx + '"] span');
                            foundEl.click();
                            foundEl.scrollIntoView();
                            foundEl.focus();
                            break;
                        }
                    }
                }, 10);
            }
            menu.appendChild(inspectBtn);
            _this.options.windowObj.document.body.appendChild(menu);
        }catch(e){
            alert(e.stack);
        }
        });
    }

    initOptions(options) {
        this.options = this.options || {};
        this.options.inspectorHTMLContainer = options.inspectorHTMLContainer;
        this.options.inspectorStylesContainer = options.inspectorStylesContainer;
        this.options.debuggerId = options.debuggerId;
        this.options.windowObj = this.options.windowObj || window;
    }

    inspectPage(){
        this.id = 0;
        while(this.options.inspectorHTMLContainer.firstChild) this.options.inspectorHTMLContainer.removeChild(this.options.inspectorHTMLContainer.firstChild);
        let fragment = document.createDocumentFragment();
        this.inspectElement('', fragment);
        this.options.inspectorHTMLContainer.appendChild(fragment);
    }

    inspectElement(el, elToAppend) {
        //нещо тук не прихваща добре за глобалния window, но така или иначе не сме правили да се визуализира html на iframe, така че няма да го правим засега
        if (!el) el = this.options.windowObj.document.body;// ??? ???? ??????? ????? body
        let elChildren = el.childNodes;
        let childrenLen = elChildren.length;

        for (let i = 0; i < childrenLen; i++) {
            if ((elChildren[i].tagName || '') == elChildren[i].nodeName) {// ??? ?????? ? ???????
                if (elChildren[i].id && elChildren[i].id == this.options.debuggerId) continue;
                if (elChildren[i].tagName && elChildren[i].tagName == 'SCRIPT') continue;

                // ????? ?????? ???????? ?? ????(??????? ??????? ??????), ????? ?? ???????? ?? html-?
                let attributes = elChildren[i].hasAttributes() ? elChildren[i].attributes : [];
                let atrOutput = '';
                for (let a = 0; a < attributes.length; a++) {
                    atrOutput += ' ' + attributes[a].name + '="' + attributes[a].value + '"';
                }
                //
                let newLine = this.newEl.cloneNode(true);

                newLine.innerHTML = '<div><i class="showHideElement" style="font-size: 10px;width:10px;cursor:pointer;transform:rotateZ(90deg);" onclick="parantElementClick1(this);">play_arrow</i><span contenteditable="true"><code>&#60;' + elChildren[i].tagName.toLowerCase() + atrOutput + '&#62;</code></span></div>' +
                    (this.elsWithNoCloseTag.indexOf(elChildren[i].tagName) == -1 ? ('<div style="border-left:solid #aaf 1px;" class="childrenHolder"></div>' +
                        '<div class="closeTab"><span contenteditable="true"><code>&#60;&#47;' + elChildren[i].tagName.toLowerCase() + '&#62;</code></span></div>') : '');

                newLine.firstChild.dataset.reference = (this.id).toString();
                this.references[this.id] = elChildren[i];
                this.id++;
                newLine.firstChild.onmouseover = this.referenceTo_LinkIt.bind(this);
                newLine.firstChild.onmouseout = this.referenceTo_Normal.bind(this);
                newLine.firstChild.onclick = this.displayStylesOnClick.bind(this);

                elToAppend.appendChild(newLine);
                if (this.elsWithNoCloseTag.indexOf(elChildren[i].tagName) == -1) this.inspectElement(elChildren[i], newLine.querySelector('.childrenHolder'));
            } else {// ??? ? ?????
                let newLine = this.newEl.cloneNode(true);
                newLine.innerHTML = '<div><span contenteditable="true"><code>' + elChildren[i].nodeValue + '</code></span></div>';
                elToAppend.appendChild(newLine);
            }
        }
    }

    referenceTo_LinkIt(el) {
        if ((el.target.dataset.reference || '') == '' && (el.target.parentElement.dataset.reference || '') == '' && (el.target.parentElement.parentElement.dataset.reference || '') == '') return;
        let ref = +(el.target.dataset.reference || el.target.parentElement.dataset.reference || el.target.parentElement.parentElement.dataset.reference);
        if (!this.references[ref]) return;
        //this.references[ref].style.background = 'rgba(51,102,204,0.6)';
        let rect = this.references[ref].getBoundingClientRect();
        //Padding el
        let style = window.getComputedStyle(this.references[ref]),
            paddingLeft = this.makeNaNtoZero(parseFloat(style.getPropertyValue('padding-left'))),
            paddingRight = this.makeNaNtoZero(parseFloat(style.getPropertyValue('padding-right'))),
            paddingTop = this.makeNaNtoZero(parseFloat(style.getPropertyValue('padding-top'))),
            paddingBottom = this.makeNaNtoZero(parseFloat(style.getPropertyValue('padding-bottom')));

        this.overlay.style.display = 'block';
        this.overlay.style.top = rect.y + +pageYOffset + 'px';
        this.overlay.style.left = rect.x + 'px';
        // this.overlay.style.top = +this.references[ref].offsetTop + 'px';
        // this.overlay.style.left = this.references[ref].offsetLeft + 'px';
        this.overlay.style.width = this.references[ref].offsetWidth /*- paddingLeft - paddingRight*/ + 'px';
        this.overlay.style.height = this.references[ref].offsetHeight /*- paddingTop - paddingBottom*/ + 'px';


        this.overlay.style.borderLeft = paddingLeft + 'px solid rgba(51,204,65,0.5)';
        this.overlay.style.borderTop = paddingTop + 'px solid rgba(51,204,65,0.5)';
        this.overlay.style.borderRight = paddingRight + 'px solid rgba(51,204,65,0.5)';
        this.overlay.style.borderBottom = paddingBottom + 'px solid rgba(51,204,65,0.5)';

        let marginLeft = this.makeNaNtoZero(parseFloat(style.getPropertyValue('margin-left'))),
            marginRight = this.makeNaNtoZero(parseFloat(style.getPropertyValue('margin-right'))),
            marginTop = this.makeNaNtoZero(parseFloat(style.getPropertyValue('margin-top'))),
            marginBottom = this.makeNaNtoZero(parseFloat(style.getPropertyValue('margin-bottom')));

        this.marginOverlay.style.display = 'block';
        this.marginOverlay.style.top = rect.y + +pageYOffset - marginTop + 'px';
        this.marginOverlay.style.left = rect.x - marginLeft + 'px';
        this.marginOverlay.style.width = this.references[ref].offsetWidth /*- paddingLeft - paddingRight*/ + marginLeft + marginRight + 'px';
        this.marginOverlay.style.height = this.references[ref].offsetHeight /*- paddingTop - paddingBottom*/ + marginBottom + marginTop + 'px';

        this.marginOverlay.style.borderLeft = marginLeft + 'px solid rgba(255,153,51,0.5)';
        this.marginOverlay.style.borderTop = marginTop + 'px solid rgba(255,153,51,0.5)';
        this.marginOverlay.style.borderRight = marginRight + 'px solid rgba(255,153,51,0.5)';
        this.marginOverlay.style.borderBottom = marginBottom + 'px solid rgba(255,153,51,0.5)';
    }

    referenceTo_Normal(el) {
        if ((el.target.dataset.reference || '') == '' && (el.target.parentElement.dataset.reference || '') == '' && (el.target.parentElement.parentElement.dataset.reference || '') == '') return;
        let ref = +(el.target.dataset.reference || el.target.parentElement.dataset.reference || el.target.parentElement.parentElement.dataset.reference);
        if (!this.references[ref]) return;
        //this.references[ref].style.background = '';
        this.overlay.style.display = 'none';
        this.marginOverlay.style.display = 'none';
    }

    displayStylesOnClick(el) {
        if ((el.target.dataset.reference || '') == '' && (el.target.parentElement.dataset.reference || '') == '' && (el.target.parentElement.parentElement.dataset.reference || '') == '') return;
        let ref = +(el.target.dataset.reference || el.target.parentElement.dataset.reference || el.target.parentElement.parentElement.dataset.reference);
        if (!this.references[ref]) return;

        //Append Styles 
        var defElement = document.createElement(this.references[ref].tagName);
        this.options.windowObj.document.body.appendChild(defElement);

        var defaultStyles = getComputedStyle(defElement).cssText.split('; ');
        var elementStyles = getComputedStyle(this.references[ref]).cssText.split('; ');

        if (this.options.inspectorStylesContainer.firstChild) this.options.inspectorStylesContainer.removeChild(this.options.inspectorStylesContainer.firstChild);

        let flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.width = '100%';
        flexContainer.style.height = '100%';
        flexContainer.style.flexDirection = 'column';
        flexContainer.style.overflow = 'auto';
        this.options.inspectorStylesContainer.appendChild(flexContainer);

        for (var key in elementStyles) {
            if (defaultStyles[key] !== elementStyles[key]) {
                flexContainer.appendChild(this.getDiffStyleRow(elementStyles[key]));
            }
        }
        this.options.windowObj.document.body.removeChild(defElement);
    }

    getDiffStyleRow(styleText) {
        let styleRow = document.createElement('div'),
            propertyArr = styleText.split(':');

        let propertyName = document.createElement('span');
        propertyName.innerText = propertyArr[0];
        propertyName.style.color = '#e50000';
        styleRow.appendChild(propertyName);

        let delimiter = document.createElement('span');
        delimiter.innerText = ':';
        delimiter.style.marginRight = '2px';
        styleRow.appendChild(delimiter);

        let propertyValue = document.createElement('span');
        propertyValue.innerText = propertyArr[1];

        if (propertyArr[1].substring(1, 4) === 'rgb') {
            //example "rgb(169, 169, 169) 1px 1px 1px 1px"
            let colorSquare = document.createElement('span'),
                colorTypeProperty = propertyArr[1].split('('), //example ["rgb", "169, 169, 169) 1px 1px 1px 1px"]
                colorValues = colorTypeProperty[1].split(')')[0];

            colorTypeProperty = colorTypeProperty[0];

            colorSquare.style.backgroundColor = colorTypeProperty + '(' + colorValues + ')';
            colorSquare.style.width = '10px';
            colorSquare.style.height = '10px';
            colorSquare.style.border = '1px solid grey';
            colorSquare.style.display = 'inline-block';
            styleRow.appendChild(colorSquare);
        }

        styleRow.appendChild(propertyValue);

        return styleRow;
    }

    makeNaNtoZero(value){
        return Number(value) ? Number(value) : 0;
    }
}

function parantElementClick1(el) {// ????????? ???????? ?? ???
    let closeTabs = el.parentNode.parentNode.querySelectorAll('.closeTab');
    if ((el.dataset.notExpanded || 'true') == 'true') {
        el.dataset.notExpanded = 'false';
        el.style.transform = 'rotateZ(0deg)';
        el.parentNode.parentNode.querySelector('.childrenHolder').style.display = 'none';
        if (closeTabs.length > 0) closeTabs[closeTabs.length - 1].style.display = 'none';
    } else {
        el.dataset.notExpanded = 'true';
        el.style.transform = 'rotateZ(90deg)';
        el.parentNode.parentNode.querySelector('.childrenHolder').style.display = 'block';
        if (closeTabs.length > 0) closeTabs[closeTabs.length - 1].style.display = 'block';
    }
}

class JSCommandInterpreter1{
    constructor(options){
        this.initOptions(options);

        this.executables = {
            'enable': function(){
                if(arguments[0] == 'hacker-mode'){
                    let wnd = window.parent.parent.parent.parent;
                    wnd.pm.isRegistered = function(){return 'true';}
                    wnd.document.getElementById('modules').innerHTML = '';
                    let modulesDropdown = wnd.document.getElementById('modulesDropdown');
                    modulesDropdown.innerHTML = '';
                    wnd.document.getElementById('content').innerHTML = '';
                    wnd.initializeModules();
                    //wnd.selectModule(wnd.querySelector('[data-module="' + wnd.currentModuleId + '"]'));
                    if(arguments[1] === 'hacker-logo'){
                        wnd.document.getElementById('logo').style.backgroundImage = 
                        'url(https://res.cloudinary.com/teepublic/image/private/s--IJvwVtSo--/c_crop,x_10,y_10/c_fit,h_846/c_crop,g_north_west,h_1007,w_1007,x_-167,y_-81/l_upload:v1507037313:production:blanks:n2pk899a8qrzxtz4tyvn/fl_layer_apply,g_north_west,x_-294,y_-212/b_rgb:262c3a/c_limit,f_jpg,h_630,q_90,w_630/v1553708637/production/designs/4508933_0.jpg)';
                        wnd.document.getElementById('logo').style.backgroundSize = '90% 115%';      
                    }else if(arguments[1] == 'banana-logo'){
                        wnd.document.getElementById('logo').style.backgroundImage = 'url(https://media.giphy.com/media/ZYoFTHxrWNFbW/giphy.gif)';
                        wnd.document.getElementById('logo').style.backgroundSize = 'contain';
                        wnd.document.getElementById('logo').style.backgroundSize = '110% 100%';
                    }           
                }else if(arguments[0] == 'PMJSDownloader'){
                    this.mainDebugger.addTab({
                        tabName: 'PMJSDownloader',
                        className: PMJSDownloader1,
                        bodyIdx: 'PMJSDownloader',
                        options: {}
                    });
                }else if(arguments[0] == 'global-debugger'){
                    throw 'Feature not working!';
                    let wnd = window.parent.parent.parent.parent;
                    if(typeof wnd.JSDbg != 'function'){
                        let script = wnd.document.createElement('script');
                        let loc = wnd.location;
                        let src =  loc.protocol+'//'+loc.hostname+(loc.port ? ':'+loc.port: '') + '/js/utils/JSDbg.js';
                        script.src = src;
                        script.id = 'testScript2';
                        script.onload = function(){
                            wnd._JSDebugger = new JSDbg({windowObj: wnd});
                            alert('Loaded!');

                        }
                        wnd.document.head.appendChild(script);
                    }else if(wnd._JSDebugger == null){
                        wnd._JSDebugger = new JSDbg({windowObj: wnd});
                        alert('Loaded!');
                    }
                }else if(arguments[0] == 'hacker-console'){
                    let symbol = this.mainDebugger.interactConsole.querySelector('span');
                    symbol.style.color = 'lime';
                    this.mainDebugger.interactInput.style.color = 'lime';
                    symbol.style.backgroundColor = 'black';
                    this.mainDebugger.interactInput.style.backgroundColor = 'black';

                    this.mainDebugger.logger.options.logBackgroundColor = 'black';
                    this.mainDebugger.logger.options.logColor = 'lime';
                    this.mainDebugger.logger.options.warnBackgroundColor = 'black';
                    this.mainDebugger.logger.options.errorBackgroundColor = 'black';
                    this.mainDebugger.logger.options.stackAnnotationColor = 'lime';

                    this.mainDebugger.itemsConsole.style.backgroundColor = 'black';

                    let _this = this;
                    [].slice.call(this.mainDebugger.logger.options.itemsConsole.querySelectorAll('.logger-row')).forEach(function(row){
                        let idx = row.dataset.index, flag = false;
                        if(_this.mainDebugger.logger.logsArray[idx].type == 'log'){
                            flag = true;
                        }

                        row.style.backgroundColor = 'black';

                        [].slice.call(row.querySelectorAll('div')).forEach(function(el){
                            el.style.backgroundColor = 'black';
                            if(flag || !el.classList.contains('logger-row-text')) el.style.color = 'lime';
                        });
                    });
                }else if(arguments[0] == 'magic-mode'){
                    let wnd = window;//.parent.parent.parent.parent;
                    let sterileEls = [];
                    let mainID = this.mainDebugger.body.id;
                    let elems = [].slice.call(wnd.document.body.querySelectorAll("*"));
                    let consoleElems = [].slice.call(wnd.document.getElementById(mainID).querySelectorAll("*"));

                    for(let el of elems){
                        if(!el.children.length && consoleElems.indexOf(el)<0){
                            sterileEls.push(el);
                        }
                    }
                    setInterval(function(){
                        let randN = Math.round(Math.random() * sterileEls.length - 1);
                        // if(sterileEls[randN].style.display == 'none') sterileEls[randN].style.display = '';
                        // else sterileEls[randN].style.display = 'none';
                        if(sterileEls[randN].style.visibility == 'hidden') sterileEls[randN].style.visibility = 'visible';
                        else sterileEls[randN].style.visibility = 'hidden';
                        //elems[randN].style.backgroundColor = 'red';
                    }, 2);
                }else if(arguments[0] == 'banana-rainfall'){
                    let wnd = window.parent.parent.parent.parent;
                    wnd.rainFallIntervalId = setInterval(function(){
                        let img = document.createElement('img');
                        wnd.document.body.appendChild(img);
                        img.src = 'https://media.giphy.com/media/ZYoFTHxrWNFbW/giphy.gif';
                        img.style.position = 'absolute';
                        img.className = 'dancing-banana';
                        let imgTop = 0;
                        img.style.top = imgTop + 'px';
                        img.style.zIndex = '21000';
                        let wi = 100, he = 60;
                        img.style.width = wi + 'px';
                        img.style.height = he + 'px';
                        let left = (Math.round(Math.random() * wnd.innerWidth) - wi);
                        img.style.left = left + 'px';
                        let animationId = setInterval(function(){
                            imgTop += 5;
                            img.style.top = imgTop + 'px';
                            if(imgTop >= wnd.innerHeight){
                                img.parentNode.removeChild(img);
                                clearInterval(animationId);
                            }
                        }, 10);
                    }, 150);
                }else if(arguments[0] == 'chat'){
                    this.mainDebugger.addTab({
                        tabName: 'Chat',
                        className: JSChat1,
                        bodyIdx: 'JSChat',
                        options: {}
                    });
                }
            },
            'disable': function(){
                if(arguments[0] == 'banana-rainfall'){
                    let wnd = window.parent.parent.parent.parent;
                    if(wnd.rainFallIntervalId) wnd.clearInterval(wnd.rainFallIntervalId);
                    [].slice.call(wnd.document.body.querySelectorAll('.dancing-banana')).forEach((el)=>el.parentNode.removeChild(el));
                }
            },
            'q': function(){
                pm.close();
            },
            'set': function(){
                if(arguments[0] == 'postest'){
                    let wnd = window.parent.parent.parent.parent;
                    wnd.inDevelopment = (arguments[1] == 'true');
                    wnd.testWithFiscalPrinter = (arguments[2] == 'true');
                }
            }
        }
    }

    initOptions(options){
        this.mainDebugger = options.mainDebugger;
    }

    execute(text){
        let cmd = this._parseCommand(text);
        if(typeof this.executables[cmd.command] == 'function'){
            try{
            this.executables[cmd.command].apply(this, cmd.arguments);
            }catch(e){
                alert(e.stack);
            }
        }
    }

    _parseCommand(text){
        //TODO parse with double quotes
        let arr = text.split(' ');
        let cmdObj = {
            command: arr[0],
            arguments: arr.slice(1)
        }
        return cmdObj;
    }

}

class JSEditor1 {
    constructor(options) {
        this.initOptions(options);
        this.initBody();
    }

    //private methods
    initOptions(options) {
        this.options = options || {};
        if (this.options.body) this.body = this.options.body;
        else throw "No body element provided in options!";
    }

    initBody() {
        this.body.addEventListener('heightchange', function (e) {
            this.editor.resize();
        }.bind(this));

        this.wrapper = document.createElement('div');
        this.wrapper.style.width = '100%';
        this.body.appendChild(this.wrapper);

        this.aceScript = document.createElement('script');
        this.aceScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.5/ace.js';
        document.head.appendChild(this.aceScript);

        this.aceScript.onload = function () {
            let cssTag = document.createElement('style');
            cssTag.type = 'text/css';
            cssTag.innerHTML = `.ace_editor, .ace_editor *{
                font-family: monospace !important;
                font-size: 12px !important;
            }`;
            document.head.appendChild(cssTag);

            this.editor = ace.edit(this.wrapper);
            this.editor.setOptions({
                autoScrollEditorIntoView: true,
                // maxLines: 30
            });
            this.editor.setTheme("ace/theme/tomorrow");
            this.editor.session.setMode("ace/mode/javascript");
        }.bind(this);        
    }
}

class JSGitHelper1 {
    constructor(options) {
        this.initOptions(options);
        this.initBody();
    }

    //private methods
    initOptions(options) {
        this.options = options || {};
        if (this.options.body) this.body = this.options.body;
        else throw "No body element provided in options!";

        this.options.header = this.options.header || {};
        this.options.header.backgroundColor = this.options.header.backgroundColor || '#fafafa';
    }

    initBody() {
        this.body.style.flexFlow = 'column';
        this.createHeader();
        let mw = document.createElement('div'),
            iw = document.createElement('div'),
            mwd = document.createElement('input'),
            mwdl = document.createElement('label'),
            mgd = document.createElement('input'),
            mgdl = document.createElement('label'),
            cbw = document.createElement('div');
        
        this.checkboxesWrapper = cbw;
        
        mw.style.height = 'calc(100% - 25px)';
        mw.style.overflowY = 'auto';
        this.mainWrapper = mw;

        iw.style.width = '100%';
        this.inputsWrapper = iw;

        mwdl.innerText = 'Main working dir:';
        mwdl.setAttribute('for', 'jsgit-main-working-directory-input');
        mwd.id = 'jsgit-main-working-directory-input';
        mwd.value = (((document.cookie || '').split(';') || []).find((cookie) => cookie.indexOf('mainWorkingDirectory=') > -1) || '').trim().substring('mainWorkingDirectory='.length) || 'C:\\plusminus7\\';
        this.mainWorkingDirEl = mwd;

        mgdl.innerText = 'Main Git dir:';
        mgdl.setAttribute('for', 'jsgit-main-git-directory-input');
        mgd.id = 'jsgit-main-git-directory-input';
        mgd.value = (((document.cookie || '').split(';') || []).find((cookie) => cookie.indexOf('mainGitDirectory=') > -1) || '').trim().substring('mainGitDirectory='.length);
        this.mainGitDirEl = mgd;

        iw.appendChild(mwdl);
        iw.appendChild(mwd);
        iw.appendChild(mgdl);
        iw.appendChild(mgd);
        mw.appendChild(iw);
        mw.appendChild(cbw);
        this.body.appendChild(mw);
    }

    createHeader() {
        let header = document.createElement('div');
        header.style.backgroundColor = this.options.header.backgroundColor;
        header.style.height = '25px';
        header.style.width = '100%';
        this.header = header;
        
        let rfBtn = document.createElement('button');
        rfBtn.innerText = 'Get recent files';
        rfBtn.addEventListener('click', this._handleRecentFilesClick.bind(this));
        header.appendChild(rfBtn);
        this.recentFilesButton = rfBtn;

        let cpBtn = document.createElement('button');
        cpBtn.innerText = 'Copy selected files';
        cpBtn.style.visibility = 'hidden';
        cpBtn.addEventListener('click', this._handleCopyFilesClick.bind(this));
        header.appendChild(cpBtn);
        this.copySelectedFilesButton = cpBtn;

        let cpPushBtn = document.createElement('button');
        cpPushBtn.innerText = 'Copy and push selected files';
        cpPushBtn.style.visibility = 'hidden';
        cpPushBtn.addEventListener('click', this._handleCopyAndPushFilesClick.bind(this));
        header.appendChild(cpPushBtn);
        this.copyAndPushSelectedFilesButton = cpPushBtn;

        this.body.appendChild(header);
    }

    async _handleRecentFilesClick() {
        if (!this.mainWorkingDirEl.value) {
            alert('No working directory provided!');
            return;
        }

        this.copySelectedFilesButton.style.visibility = 'visible';
        this.copyAndPushSelectedFilesButton.style.visibility = 'visible';

        document.cookie = 'mainWorkingDirectory=' + this.mainWorkingDirEl.value;

        let fullDirectoriesArr = await this._getRecentFiles(), mwdlen = this.mainWorkingDirEl.value.length,
            directoriesObj = {};    

        for (let dir of fullDirectoriesArr) {
            let currPath = dir.substring(mwdlen).split('\\'),
                tempObj = directoriesObj;
            
            for (let level = 0; level < currPath.length; ++level) {
                let folder = currPath[level];
                tempObj[folder] = tempObj[folder] || (level == currPath.length - 1 ? '' : {});
                tempObj = tempObj[folder];
            }
        }

        while (this.checkboxesWrapper.firstChild)
            this.checkboxesWrapper.removeChild(firstChild);
        
        //maybe checkboxeswrapper should be fragment and can be easily cleared
        this._displayDirectories(directoriesObj, this.checkboxesWrapper, 0);
    }

    _displayDirectories(dObj, parentEl, level) {
        for (let dir in dObj) {
            if (!dObj[dir]) { //if file
                let folderDiv = document.createElement('div'),
                    checkBox = document.createElement('input'),
                    folderLabel = document.createElement('label');

                level = level == 1 ? 2 : level; //because of arrow, first level should have more margin

                folderDiv.style.marginLeft = (level * 12) + 'px';
                folderDiv.dataset.isfile = 'true';
                folderDiv.dataset.path = dir;
                
                checkBox.type = 'checkbox';
                folderLabel.innerText = dir;
                
                folderDiv.appendChild(checkBox);
                folderDiv.appendChild(folderLabel);
                parentEl.appendChild(folderDiv);
            } else { //if folder
                let folderDiv = document.createElement('div'),
                    iArrow = document.createElement('i'),
                    checkBox = document.createElement('input'),
                    folderLabel = document.createElement('label');

                folderDiv.style.marginLeft = (level * 12) + 'px';
                folderDiv.dataset.isfolder = 'true';
                folderDiv.dataset.path = dir;
                
                iArrow.innerText = 'play_arrow';
                iArrow.style.fontSize = '10px';
                checkBox.type = 'checkbox';
                folderLabel.innerText = dir;
                
                folderDiv.appendChild(iArrow);
                folderDiv.appendChild(checkBox);
                folderDiv.appendChild(folderLabel);
                parentEl.appendChild(folderDiv);
                
                let children = document.createElement('div');
                // parentEl.appendChild(children);
                folderDiv.appendChild(children);
                this._displayDirectories(dObj[dir], children, level + 1);
            }
        }
    }

    async _getRecentFiles() {
        let localeDate = new Date().toLocaleDateString(navigator.language),
            mwd = this.mainWorkingDirEl.value;

        localeDate = localeDate.split('/');
        let temp = localeDate[0];
        localeDate[0] = localeDate[1];
        localeDate[1] = temp.padStart(2, '0');
        localeDate = localeDate.join('.');
        
        let scriptHTML = `forfiles /P ${mwd} /S /M *.html /D +${localeDate} /C "cmd /c echo @path" >> ${mwd}ex.txt`,
            scriptJS = `forfiles /P ${mwd} /S /M *.js /D +${localeDate} /C "cmd /c echo @path" >> ${mwd}ex.txt`,
            scriptCSS = `forfiles /P ${mwd} /S /M *.css /D +${localeDate} /C "cmd /c echo @path" >> ${mwd}ex.txt`;

        function executeCmd(script){
            pm.writeFile(mwd + 'tempF.bat', script);
            pm.command(mwd+'tempF.bat');  
            return new Promise(function(resolve, reject){
                setTimeout(()=>{
                    pm.deleteFile(mwd + 'tempF.bat');
                    resolve(pm.readFile(mwd + 'ex.txt').split('\n'));
                }, 1000);  
                setTimeout(()=> pm.deleteFile(mwd + 'ex.txt'), 3000);              
            });            
        }

        let executableScript = [scriptHTML, scriptJS, scriptCSS].join('\n');

        let cmdArr = await executeCmd(executableScript);
        
        let fileredArr = [];

        for(let file of cmdArr){
            if(file && file != '\r'){
                file = file.replace(/[\r"]/g, '');
                fileredArr.push(file);
            }
        }

        return fileredArr;
    }

    _handleCopyFilesClick() {
        this._copyFiles();
    }

    _copyFiles() {
        this.copySelectedFilesButton.style.visibility = 'hidden';
        this.copyAndPushSelectedFilesButton.style.visibility = 'hidden';
        document.cookie = 'mainGitDirectory=' + this.mainGitDirEl.value;

        let filePaths = [],
            cbs = [].slice.call(this.checkboxesWrapper.querySelectorAll('[data-isfile]'));

        for(let cb of cbs){
            if(!cb.querySelector('input[type="checkbox"]').checked) continue;

            let path = [cb.dataset.path];
            
            while(cb.parentNode.parentNode.dataset.isfolder){  
                path.unshift(cb.parentNode.parentNode.dataset.path);
                cb = cb.parentNode.parentNode;
            }
            path = path.join('\\');
            filePaths.push(path);
        }

        let mgd = this.mainGitDirEl.value,
            mwd = this.mainWorkingDirEl.value;

        for(let file of filePaths){
            let text = pm.readFile(mwd+file);
            pm.writeFile(mgd+file, text);
        }
    }

    _handleCopyAndPushFilesClick() {
        this._copyFiles();
        //TODO
        //execute git commit, push
    }
}

class JSChat1 {
    constructor(options) {
        this.initOptions(options);
        this.initBody();
        this.createRowNode();
        this.initSocket();
    }

    //private methods
    initOptions(options) {
        this.options = options || {};
        if (this.options.body) this.body = this.options.body;
        else throw "No body element provided in options!";

        this.options.header = this.options.header || {};
        this.options.header.backgroundColor = this.options.header.backgroundColor || '#fafafa';
        this.serverURL = "https://socket-game-stefcho.herokuapp.com";
    }

    initBody() {
        this.body.style.display = 'flex';
        this.body.style.flexDirection = 'column';

        this.chatMessagesWrapper = document.createElement('div');
        this.chatMessagesWrapper.style.width = '100%';
        this.chatMessagesWrapper.style.height = 'calc(100%-24px)';
        this.chatMessagesWrapper.style.maxHeight = 'calc(100%-24px)';
        this.chatMessagesWrapper.style.overflow = 'auto';
        this.chatMessagesWrapper.style.flexGrow = '1';
        this.chatMessagesWrapper.style.display = 'flex';
        this.chatMessagesWrapper.style.flexDirection = 'column';

        this.body.appendChild(this.chatMessagesWrapper);

        this.interactConsole = document.createElement('div');
        this.interactConsole.classList.add('chat-input-interact-wrapper');
        this.interactConsole.style.padding = '0';
        this.interactConsole.style.minHeight = '20px';
        this.interactConsole.style.display = 'flex';
        this.interactConsole.style.border = '1px solid #efefef';

        let interactSymbol = document.createElement('span');
        interactSymbol.innerText = '>>';
        this.interactConsole.appendChild(interactSymbol);

        this.interactInput = document.createElement('input');
        this.interactInput.style.border = 'none';
        this.interactInput.style.flexGrow = '1';
        this.interactConsole.appendChild(this.interactInput);
        this.interactConsole.addEventListener('keyup', this._handleInteractInput.bind(this));

        this.body.appendChild(this.interactConsole);
    }

    initSocket(){
        let ioScript = document.createElement('script');
        ioScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js';
        document.head.appendChild(ioScript);     
    }

    createRowNode(){
        let currLog = document.createElement('div');
        currLog.style.width = '100%';
        currLog.style.display = 'flex';
        currLog.style.minHeight = '1.2em';
        currLog.style.padding = '0';

        //additional info
        let additionalDiv = document.createElement('div');
        additionalDiv.style.marginRight = '6px';
        additionalDiv.style.maxWidth = '20%';
        additionalDiv.style.overflow = 'hidden';
        additionalDiv.style.padding = '0';
        additionalDiv.style.fontSize = '11px';
        additionalDiv.className = 'additional-info';
        currLog.appendChild(additionalDiv);

        let dateField = document.createElement('span');
        dateField.style.marginRight = '6px';
        additionalDiv.appendChild(dateField);
        let usernameField = document.createElement('span');
        usernameField.style.fontWeight = 'bold';
        additionalDiv.appendChild(usernameField);

        //main info
        let mainDiv = document.createElement('div');
        mainDiv.classList.add('chat-row-text');
        mainDiv.style.padding = '0';
        mainDiv.style.width = '80%';
        mainDiv.style.whiteSpace = 'pre-wrap';
        mainDiv.style.maxHeight = '1.2em';
        mainDiv.style.fontSize = '11px';
        currLog.appendChild(mainDiv);

        this.__cloneRowNode = currLog;
    }

    addRows(rows){
        let _this = this;
        rows.sort((a,b)=>a.date - b.date); //трябва да си ги сортираме по дата
        rows.forEach((row)=>_this.addRow(row));
    }

    addRow(data){
        this.addRowUI(data);
    }

    addRowUI(data){
        let currRow = this.__cloneRowNode.cloneNode(true),
            additionalInfoEl = currRow.querySelector('.additional-info');
        let dateObj = new Date(+data.date);
        additionalInfoEl.children[0].innerText = dateObj.getDate().toString().padStart(2, '0') + '.' + (+dateObj.getMonth()+1).toString().padStart(2, '0') + '.' + dateObj.getFullYear() + ' ' + dateObj.getHours().toString().padStart(2, '0') + ':' + dateObj.getMinutes().toString().padStart(2, '0');
        additionalInfoEl.children[1].innerText = data.user + ':';

        currRow.querySelector('.chat-row-text').innerText = data.text;
        this.chatMessagesWrapper.appendChild(currRow);
    }

    _handleInteractInput(ev){
        let text = ev.target.value;
        if(ev.key != 'Enter') return;
        if(text){
            if(text[0] == ':'){
                try{
                    this.executeChatCommand(text.substring(1));
                }catch(e){
                    alert(e.stack);
                }
            }else{
                if(this.io){
                    this.io.emit('messageSent', {text});
                }
            }
            ev.target.value = '';
        }
    }

    executeChatCommand(cmd){
        let [command, ...args] = cmd.split(' ');
        if(command == 'login'){
            let [username, password] = args;
            this.io = io(this.serverURL);
            this.io.emit('authentication', {username, password});

            let _this = this;
            //this.io.on('authenticated', function() {
            //});
            this.io.on('initMessages', function(messages){
                _this.addRows(messages);
            });
            this.io.on('messageReceived', function(msg){
                _this.addRow(msg);
            });
        }else if(command == 'register'){
            let [username, password] = args;
            let xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "POST", this.serverURL + '/register', true ); // false for synchronous request
            xmlHttp.setRequestHeader('Content-Type', 'application/json');
            xmlHttp.send(JSON.stringify({username, password}));
            xmlHttp.onreadystatechange = function() { 
                return; //will stay unused for now
                if (xmlHttp.readyState == 4 && (xmlHttp.status == 200 || xmlHttp.status == 0))
                    alert('Server responded with: ' + xmlHttp.responseText);
            }
        }
    }
}
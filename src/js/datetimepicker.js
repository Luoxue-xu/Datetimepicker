/*
 * 日期插件
 * author: luoxue-xu.github.io
 * date: 20170306
 */


let $ = (args) => new Query(args);

class Query {

    constructor(args) {
        // 当前选择的元素
        this.element = document.querySelectorAll(args);
    }

    // 寻找子元素
    find(arg) {
        [].map.call(this.element, (item) => {
            this.element = item.querySelectorAll(arg);
        });
        return this.element;
    }

    // 绑定事件
    on(eventType, fn) {
        [].map.call(this.element, (item) => {
            item.addEventListener(eventType, fn, false);
        });
    }

    // 取消绑定事件
    off(eventType, fn) {
        [].map.call(this.element, (item) => {
            item.removeEventListener(eventType, fn, false);
        });
    }
}

/*
 * el  'id/class/...'  触发日期弹出层的元素
 * date  {Date}  设置默认选中的日期
 * dateType  'YYYY-MM-DD'  日期显示格式
 * maxDate  {Date}  最大可选日期
 * weekList  [Array(7)]  星期显示列表，默认从周日开始
 * monthList  [Array(12)]  月份显示列表，默认从一月开始
 * btns  [Array(2)]  底部月份翻页按钮文字
 * lang  'en'  设置显示语言，默认中文
 * startElement 'id/class/...' 开始日期元素
 * endElement 'id/class/...' 结束日期元素
 */
export default class Datetimepicker {

    constructor(options) {
        this.el = options.el || null; // input[type=date]元素
        this.todyDate = options.date || new Date();
        this.dateType = options.dateType || 'YYYY-MM-DD';
        this.maxDate = options.maxDate || null; // 最大可选日期

        if (options.lang == 'en') {
            this.weekList = options.weekList || ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            this.monthLists = options.monthList || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            this.footBtns = options.btns || ['PREV', 'NEXT'];
        } else {
            this.weekList = options.weekList || ['日', '一', '二', '三', '四', '五', '六']; // 星期列表
            this.monthLists = options.monthList || ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']; // 月份列表
            this.footBtns = options.btns || ['上月', '下月']; // 底部两册切换按钮名称
        }

        this.b = document.body;
        this.eventElement = null; // 当前操作的元素
        this.isDouble = false; // 是否关联日期

        this.pos = {
            x: 0,
            y: 0
        }; // 位置信息

        if (this.el) {
            // 若是单个，或多个无关联的日期选择元素
            this.eles = document.querySelectorAll(this.el);
            this.e();
        } else if (options.startElement && options.endElement) {
            let startEl = document.querySelector(options.startElement);
            let endEl = document.querySelector(options.endElement);
            let sV = startEl.value;
            let eV = endEl.value;

            // 若是两个关联的日期元素，如开始日期——结束日期
            this.isDouble = true;
            this.doubleDate = {
                start: sV.length >= 8 && new Date(sV) ? new Date(sV) : null,
                end: eV.length >= 8 && new Date(eV) ? new Date(eV) : null
            }; // 当前关联的日期值
            this.eles = [startEl, endEl];
            this.e();
        }
    }

    // 创建一个元素
    ce(options) {
        let el = document.createElement(options.elName);
        if (options.clName) {
            el.className = options.clName;
        }
        if (options.context) {
            el.innerHTML = options.context;
        }
        if (options.child) {
            options.child.map((item) => {
                el.appendChild(item);
            });
        }
        return el;
    }

    // 刷新当前日期
    refresh() {
        this.date = {
            year: this.todyDate.getFullYear(),
            month: this.todyDate.getMonth() + 1,
            week: this.todyDate.getDay(),
            date: this.todyDate.getDate()
        }; // 今天的日期或者当前选择的日期
    }

    // 打开日期插件
    open() {
        this.createPicker(this.translateDate(this.todyDate, this.dateType));
    }

    // 创建日期组件
    createPicker(date) {
        this.refresh();
        this.createWeek();
        this.createDateList(date);
        this.createFoot(date);
        this.createYm(date);
        if (this.picker) {
            this.picker.remove();
        }
        this.picker = this.ce({
            elName: 'div',
            clName: 'datetimepicker',
            child: [this.week, this.dateList, this.ym, this.foot]
        });
        this.setStyle();
        this.events();
        this.b.appendChild(this.picker);
    }

    // 设置样式
    setStyle() {
        if (this.picker) {
            this.picker.style.top = `${this.pos.y}px`;
            this.picker.style.left = `${this.pos.x}px`;
        }
    }

    // 创建星期列表
    createWeek() {

        let code = '';
        this.weekList.map((item) => {
            code += `<span>${item}</span>`;
        });

        this.week = this.ce({
            elName: 'div',
            clName: 'datetimepicker-week',
            context: code
        });

        return this.week;
    }

    // 创建底部菜单
    createFoot(date) {

        this.prev = this.ce({
            elName: 'span',
            clName: 'datetimepicker-prev',
            context: this.footBtns[0]
        });

        this.next = this.ce({
            elName: 'span',
            clName: 'datetimepicker-next',
            context: this.footBtns[1]
        });

        this.indexDate = this.ce({
            elName: 'span',
            clName: 'datetimepicker-index-date',
            context: this.translateDate(this.todyDate, 'YYYY-MM')
        });

        this.foot = this.ce({
            elName: 'div',
            clName: 'datetimepicker-foot',
            child: [this.prev, this.indexDate, this.next]
        });
    }

    // 创建每月日期列表
    createDateList(date) {
        let d = new Date();
        let dateLen = this.getDateInMonth(date);
        let firstDate = this.getWeekInDate(date, 1);
        let lastDate = this.getWeekInDate(date, dateLen);
        let typeClass = '';
        let code = '';

        for (let i = 0; i < firstDate; i++) {
            if (this.maxDate && this.compare(this.maxDate, new Date(`${this.date.year}/${this.date.month - 1}/${this.getDateInDate(date, i - 2)}`))) {
                // 判断是否可选
                code += `<div class="disabled"><span>${this.getDateInDate(date, i - 2)}</span></div>`;
            } else {
                code += `<div class="gray prev"><span class="prev">${this.getDateInDate(date, i - 2)}</span></div>`;
            }
        }

        for (let j = 1; j < dateLen + 1; j++) {
            if (this.maxDate && this.compare(this.maxDate, new Date(`${this.date.year}/${this.date.month}/${j}`))) {
                // 不可选日期
                typeClass = 'disabled';
            } else if(this.date.date === j) {
                // 与输入框日期一致
                typeClass = 'active';
            } else if(this.date.year === d.getFullYear() && this.date.month === d.getMonth() + 1 && d.getDate() === j) {
                // 今天
                typeClass = 'index';
            } else if ('60'.indexOf(this.getWeekInDate(date, j)) !== -1) {
                // 假日
                typeClass = 'gray';
            } else {
                // 正常日期
                typeClass = '';
            }
            code += `<div class="${typeClass}"><span>${j}</span></div>`;
        }

        for (let k = 0; k < 6 - lastDate; k++) {
            if (this.maxDate && this.compare(this.maxDate, new Date(`${this.date.year}/${this.date.month + 1}/${this.getDateInDate(date, dateLen + k + 1)}`))) {
                // 判断是否可选
                code += `<div class="disabled"><span>${this.getDateInDate(date, dateLen + k + 1)}</span></div>`;
            } else {
                code += `<div class="gray next"><span class="next">${this.getDateInDate(date, dateLen + k + 1)}</span></div>`;
            }
        }

        this.dateList = this.ce({
            elName: 'div',
            clName: 'datetimepicker-date',
            context: code
        });
    }

    // 比较日期大小
    compare(date, _date) {
        return date.getTime() < _date.getTime();
    }

    /* 获取一个月的天数
     * 根据下一月的0号来取当月的天数
     */
    getDateInMonth(date) {
        let d = new Date(date);
        let arr = [];
        d.setDate(1);
        d.setMonth(d.getMonth() + 1);
        d.setDate(0);

        return d.getDate();
    }

    // 获取某天的星期
    getWeekInDate(date, da) {
        let d = new Date(date);
        d.setDate(da);
        return d.getDay();
    }

    // 获取某一天的真实日期
    getDateInDate(date, da) {
        let d = new Date(date);
        d.setDate(da);

        return d.getDate();
    }

    // 格式转换
    translateDate(date, type) {
        let types = type || 'YYYY-MM-DD';
        let dates = {
            'Y+': date.getFullYear(),
            'M+': date.getMonth() + 1,
            'D+': date.getDate()
        };

        for (let attr in dates) {
            dates[attr] = dates[attr] < 10 ? ('0' + dates[attr]) : dates[attr];
            let reg = new RegExp(attr, 'g');
            types = types.replace(reg, dates[attr]);
        }

        return types;
    }

    // 创建创建年月
    createYm() {
        let code = '';
        let monthCode = '';
        let minYear = this.date.year - 10;
        let maxYear = this.date.year;

        for (let i = maxYear; i > minYear; i--) {
            if (i === this.date.year) {
                code += `<span class="active">${i}</span>`;
            } else {
                code += `<span>${i}</span>`;
            }
        }

        this.monthLists.map((item, index) => {
            if (index + 1 === this.date.month) {
                monthCode += `<span class="active">${item}</span>`;
            } else {
                monthCode += `<span>${item}</span>`;
            }
        });

        this.yearList = this.ce({
            elName: 'div',
            clName: 'datetimepicker-year',
            context: code
        });

        this.monthList = this.ce({
            elName: 'div',
            clName: 'datetimepicker-month',
            context: monthCode
        });

        this.ym = this.ce({
            elName: 'div',
            clName: 'datetimepicker-ym',
            child: [this.yearList, this.monthList]
        });

    }

    // 销毁组件
    destory() {
        if (this.picker) {
            this.picker.remove();
            document.removeEventListener('click', this.hide, false);
            document.removeEventListener('scroll', this.scroll, false);
        }
    }

    // 外部事件处理中心
    e() {
        let that = this;

        [].map.call(this.eles, (item, index) => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation(); // 阻止冒泡
                that.eventElement = this;
                that.pos = that.getOffset(e.target);

                // 若是关联日期
                if (that.isDouble) {
                    this.dataset.datepickertype = ['start', 'end'][index];
                }

                if (this.value.length >= 8 && new Date(this.value)) {
                    that.todyDate = new Date(this.value);
                }
                that.open();
            }, false);
        });

        document.addEventListener('click', this.hide.bind(this), false);
        document.addEventListener('scroll', this.scroll.bind(this), false);
    }

    // 滚动固定位置
    scroll(event) {
        if(!this.picker || this.picker.style.display === 'none') {
            return;
        }
        let _scroll = {
            x: document.body.scrollTop || document.documentElement.scrollLeft,
            y: document.body.scrollTop || document.documentElement.scrollTop
        };
        if (this.eventElement) {
            this.pos = this.getOffset(this.eventElement);
            this.setStyle();
        }
    }

    // 隐藏组件
    hide(event) {
        if(!this.picker || this.picker.style.display === 'none') {
            return;
        }
        let _el = event.target;
        while (_el.classList) {
            if (_el.classList.contains('datetimepicker')) {
                return;
            }
            _el = _el.parentNode;
        }
        if (this.picker) {
            this.picker.style.display = 'none';
        }
    }

    // 获取元素相对于根元素的偏移
    getOffset(el) {
        let _el = el;
        let _offset = {
            x: 0,
            y: parseInt(window.getComputedStyle(_el, null).height)
        };
        let _scroll = {
            x: document.body.scrollTop || document.documentElement.scrollLeft,
            y: document.body.scrollTop || document.documentElement.scrollTop
        };

        while (_el) {
            _offset.x += _el.offsetLeft;
            _offset.y += _el.offsetTop;
            _el = _el.offsetParent;
        }

        _offset.y -= _scroll.y;

        return _offset;
    }

    // 提示信息
    msg(text) {
        let msgEl = this.ce({
            elName: 'div',
            clName: 'datetimepicker-msg',
            context: text
        });

        this.picker.appendChild(msgEl);

        setTimeout(() => {
            msgEl.remove();
        }, 2500);
    }

    // 事件处理中心
    events() {
        var that = this;

        // 上一月
        this.prev.addEventListener('click', () => {
            this.todyDate.setMonth(this.todyDate.getMonth() - 1);
            this.createPicker(this.translateDate(this.todyDate, this.dateType));
        }, false);

        // 下一月
        this.next.addEventListener('click', () => {
            this.todyDate.setMonth(this.todyDate.getMonth() + 1);
            this.createPicker(this.translateDate(this.todyDate, this.dateType));
        }, false);

        // 选择日期
        this.dateList.addEventListener('click', function (event) {
            if (event.target.className !== 'datetimepicker-date') {
                if (event.target.className === 'disabled' || event.target.parentNode.className === 'disabled') {
                    return;
                }
                if (event.target.className === 'prev') {
                    that.todyDate.setMonth(that.date.month - 2);
                } else if (event.target.className === 'next') {
                    that.todyDate.setMonth(that.date.month);
                }
                let _d = event.target.innerText;
                that.todyDate.setDate(_d);

                // 若是关联日期
                if (that.isDouble) {
                    switch (that.eventElement.dataset.datepickertype) {
                    case 'start':
                        if(that.doubleDate.end && that.compare(that.doubleDate.end, that.todyDate)) {
                            that.msg('开始日期必须小于结束日期');
                            return;
                        }
                        that.doubleDate.start = that.todyDate;
                        break;
                    case 'end':
                        if(that.doubleDate.start && that.compare(that.todyDate, that.doubleDate.start)) {
                            that.msg('结束日期必须大于开始日期');
                            return;
                        }
                        that.doubleDate.end = that.todyDate;
                        break;
                    }
                }

                that.picker.style.display = 'none';
                that.eventElement.value = that.translateDate(that.todyDate, that.dateType);
            }
        }, false);

        this.indexDate.addEventListener('click', () => {
            this.ym.style.display = 'block';
        }, false);

        // 设置月份
        [].map.call(this.monthList.querySelectorAll('span'), (item, index) => {
            item.addEventListener('click', () => {
                that.todyDate.setMonth(index);
                that.createPicker(that.translateDate(that.todyDate, that.dateType));
            }, false);
        });

        // 设置年份
        [].map.call(this.yearList.querySelectorAll('span'), (item) => {
            item.addEventListener('click', () => {
                that.todyDate.setFullYear(item.innerText);
                that.createPicker(that.translateDate(that.todyDate, that.dateType));
            }, false);
        });

    }

}

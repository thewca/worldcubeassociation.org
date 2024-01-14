'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var reactDom = require('react-dom');
var index_cjs = require('@fullcalendar/core/index.cjs');
var internal_cjs = require('@fullcalendar/core/internal.cjs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

/* eslint-disable @typescript-eslint/no-explicit-any */
const reactMajorVersion = parseInt(String(React__default["default"].version).split('.')[0]);
const syncRenderingByDefault = reactMajorVersion < 18;
class FullCalendar extends React.Component {
    constructor() {
        super(...arguments);
        this.elRef = React.createRef();
        this.isUpdating = false;
        this.isUnmounting = false;
        this.state = {
            customRenderingMap: new Map()
        };
        this.requestResize = () => {
            if (!this.isUnmounting) {
                this.cancelResize();
                this.resizeId = requestAnimationFrame(() => {
                    this.doResize();
                });
            }
        };
    }
    render() {
        const customRenderingNodes = [];
        for (const customRendering of this.state.customRenderingMap.values()) {
            customRenderingNodes.push(React__default["default"].createElement(CustomRenderingComponent, { key: customRendering.id, customRendering: customRendering }));
        }
        return (React__default["default"].createElement("div", { ref: this.elRef }, customRenderingNodes));
    }
    componentDidMount() {
        const customRenderingStore = new internal_cjs.CustomRenderingStore();
        this.handleCustomRendering = customRenderingStore.handle.bind(customRenderingStore);
        this.calendar = new index_cjs.Calendar(this.elRef.current, Object.assign(Object.assign({}, this.props), { handleCustomRendering: this.handleCustomRendering }));
        this.calendar.render();
        let lastRequestTimestamp;
        customRenderingStore.subscribe((customRenderingMap) => {
            const requestTimestamp = Date.now();
            const isMounting = !lastRequestTimestamp;
            const runFunc = (
            // don't call flushSync if React version already does sync rendering by default
            // guards against fatal errors:
            // https://github.com/fullcalendar/fullcalendar/issues/7448
            syncRenderingByDefault ||
                //
                isMounting ||
                this.isUpdating ||
                this.isUnmounting ||
                (requestTimestamp - lastRequestTimestamp) < 100 // rerendering frequently
            ) ? runNow // either sync rendering (first-time or React 16/17) or async (React 18)
                : reactDom.flushSync; // guaranteed sync rendering
            runFunc(() => {
                this.setState({ customRenderingMap }, () => {
                    lastRequestTimestamp = requestTimestamp;
                    if (isMounting) {
                        this.doResize();
                    }
                    else {
                        this.requestResize();
                    }
                });
            });
        });
    }
    componentDidUpdate() {
        this.isUpdating = true;
        this.calendar.resetOptions(Object.assign(Object.assign({}, this.props), { handleCustomRendering: this.handleCustomRendering }));
        this.isUpdating = false;
    }
    componentWillUnmount() {
        this.isUnmounting = true;
        this.cancelResize();
        this.calendar.destroy();
    }
    doResize() {
        this.calendar.updateSize();
    }
    cancelResize() {
        if (this.resizeId !== undefined) {
            cancelAnimationFrame(this.resizeId);
            this.resizeId = undefined;
        }
    }
    getApi() {
        return this.calendar;
    }
}
FullCalendar.act = runNow; // DEPRECATED. Not leveraged anymore
class CustomRenderingComponent extends React.PureComponent {
    render() {
        const { customRendering } = this.props;
        const { generatorMeta } = customRendering;
        const vnode = typeof generatorMeta === 'function' ?
            generatorMeta(customRendering.renderProps) :
            generatorMeta;
        return reactDom.createPortal(vnode, customRendering.containerEl);
    }
}
// Util
// -------------------------------------------------------------------------------------------------
function runNow(f) {
    f();
}

exports["default"] = FullCalendar;

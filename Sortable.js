/**!
 * Sortable 1.15.7
 * @author	RubaXa           <trash@rubaxa.org>
 * @author	owenm            <owen23355@gmail.com>
 * @author	Samuel Fernández <samuel84fa@gmail.com>
 * @license MIT
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Sortable = factory());
})(this, (function () { 'use strict';

	function userAgent(pattern) {
	    if (typeof window !== 'undefined' && window.navigator) {
	        return !!navigator.userAgent.match(pattern);
	    }
	    return false;
	}
	const IE11OrLess = userAgent(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i);
	const Edge = userAgent(/Edge/i);
	userAgent(/firefox/i);
	const Safari = userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i);
	const IOS = userAgent(/iP(ad|od|hone)/i);
	const ChromeForAndroid = userAgent(/chrome/i) && userAgent(/android/i);

	const captureMode = {
	    capture: false,
	    passive: false
	};
	function on(el, event, fn) {
	    el.addEventListener(event, fn, !IE11OrLess && captureMode);
	}
	function off(el, event, fn) {
	    el.removeEventListener(event, fn, !IE11OrLess && captureMode);
	}
	function matches(/**HTMLElement*/ el, /**String*/ selector) {
	    if (!selector) return;
	    selector[0] === '>' && (selector = selector.substring(1));
	    if (el) {
	        try {
	            if (el.matches) {
	                return el.matches(selector);
	            } else if (el.msMatchesSelector) {
	                return el.msMatchesSelector(selector);
	            } else if (el.webkitMatchesSelector) {
	                return el.webkitMatchesSelector(selector);
	            }
	        } catch (_) {
	            return false;
	        }
	    }
	    return false;
	}
	function getParentOrHost(el) {
	    return el.host && el !== document && el.host.nodeType && el.host !== el ? el.host : el.parentNode;
	}
	function closest(/**HTMLElement*/ el, /**String*/ selector, /**HTMLElement*/ ctx, includeCTX) {
	    if (el) {
	        ctx = ctx || document;
	        do {
	            if (selector != null && (selector[0] === '>' ? el.parentNode === ctx && matches(el, selector) : matches(el, selector)) || includeCTX) {
	                return el;
	            }
	            if (el === ctx) break;
	        /* jshint boss:true */ }while (el = getParentOrHost(el))
	    }
	    return null;
	}
	const R_SPACE = /\s+/g;
	function toggleClass(el, name, state) {
	    if (el && name) {
	        if (el.classList) {
	            el.classList[state ? 'add' : 'remove'](name);
	        } else {
	            let className = (' ' + el.className + ' ').replace(R_SPACE, ' ').replace(' ' + name + ' ', ' ');
	            el.className = (className + (state ? ' ' + name : '')).replace(R_SPACE, ' ');
	        }
	    }
	}
	function css(el, prop, val) {
	    let style = el && el.style;
	    if (style) {
	        if (prop === void 0 || val === void 0) {
	            let computedStyle;
	            if (document.defaultView && document.defaultView.getComputedStyle) {
	                computedStyle = document.defaultView.getComputedStyle(el, '');
	            } else if (el.currentStyle) {
	                computedStyle = el.currentStyle;
	            } else {
	                computedStyle = {};
	            }
	            return prop === void 0 ? computedStyle : computedStyle[prop];
	        } else {
	            let propName = prop;
	            if (!(propName in style) && propName.indexOf('webkit') === -1) {
	                propName = '-webkit-' + propName;
	            }
	            style[propName] = val + (typeof val === 'string' ? '' : 'px');
	            return '';
	        }
	    }
	    return '';
	}
	function matrix(el, selfOnly = false) {
	    let appliedTransforms = '';
	    if (typeof el === 'string') {
	        appliedTransforms = el;
	    } else {
	        let curr = el instanceof HTMLElement ? el : null;
	        while(curr){
	            let transform = css(curr, 'transform');
	            if (transform && transform !== 'none') {
	                appliedTransforms = transform + ' ' + appliedTransforms;
	            }
	            if (selfOnly) break;
	            curr = curr.parentNode;
	        }
	    }
	    const matrixFn = window.DOMMatrix || window.WebKitCSSMatrix || window.CSSMatrix || window.MSCSSMatrix;
	    /*jshint -W056 */ return matrixFn && new matrixFn(appliedTransforms);
	}
	function getWindowScrollingElement() {
	    let scrollingElement = document.scrollingElement;
	    if (scrollingElement) {
	        return scrollingElement;
	    } else {
	        return document.documentElement;
	    }
	}
	/**
	 * Returns the "bounding client rect" of given element
	 * @param  {HTMLElement} el                       The element whose boundingClientRect is wanted
	 * @param  {[Boolean]} relativeToContainingBlock  Whether the rect should be relative to the containing block of (including) the container
	 * @param  {[Boolean]} relativeToNonStaticParent  Whether the rect should be relative to the relative parent of (including) the contaienr
	 * @param  {[Boolean]} undoScale                  Whether the container's scale() should be undone
	 * @param  {[HTMLElement]} container              The parent the element will be placed in
	 * @return {Object}                               The boundingClientRect of el, with specified adjustments
	 */ function getRect(el, relativeToContainingBlock, relativeToNonStaticParent, undoScale, container) {
	    const targetEl = el;
	    if (!targetEl.getBoundingClientRect && el !== window) return null;
	    let elRect, top, left, bottom, right, height, width;
	    if (el !== window && targetEl.parentNode && el !== getWindowScrollingElement()) {
	        elRect = targetEl.getBoundingClientRect();
	        top = elRect.top;
	        left = elRect.left;
	        bottom = elRect.bottom;
	        right = elRect.right;
	        height = elRect.height;
	        width = elRect.width;
	    } else {
	        top = 0;
	        left = 0;
	        bottom = window.innerHeight;
	        right = window.innerWidth;
	        height = window.innerHeight;
	        width = window.innerWidth;
	    }
	    if ((relativeToContainingBlock || relativeToNonStaticParent) && el !== window) {
	        // Adjust for translate()
	        let curContainer = targetEl.parentNode;
	        // solves #1123 (see: https://stackoverflow.com/a/37953806/6088312)
	        // Not needed on <= IE11
	        if (!IE11OrLess) {
	            do {
	                if (curContainer && curContainer.getBoundingClientRect && (css(curContainer, 'transform') !== 'none' || relativeToNonStaticParent && css(curContainer, 'position') !== 'static')) {
	                    let containerRect = curContainer.getBoundingClientRect();
	                    // Set relative to edges of padding box of container
	                    top -= containerRect.top + parseInt(css(curContainer, 'border-top-width'));
	                    left -= containerRect.left + parseInt(css(curContainer, 'border-left-width'));
	                    bottom = top + (elRect ? elRect.height : height);
	                    right = left + (elRect ? elRect.width : width);
	                    break;
	                }
	            /* jshint boss:true */ }while (curContainer = curContainer.parentNode)
	        }
	    }
	    if (undoScale && el !== window) {
	        // Adjust for scale()
	        let elMatrix = matrix(targetEl);
	        let scaleX = elMatrix && elMatrix.a;
	        let scaleY = elMatrix && elMatrix.d;
	        if (elMatrix) {
	            top /= scaleY;
	            left /= scaleX;
	            width /= scaleX;
	            height /= scaleY;
	            bottom = top + height;
	            right = left + width;
	        }
	    }
	    return {
	        top: top,
	        left: left,
	        bottom: bottom,
	        right: right,
	        width: width,
	        height: height,
	        x: left,
	        y: top,
	        toJSON () {
	            return this;
	        }
	    };
	}
	/**
	 * Gets nth child of el, ignoring hidden children, sortable's elements (does not ignore clone if it's visible)
	 * and non-draggable elements
	 * @param  {HTMLElement} el       The parent element
	 * @param  {Number} childNum      The index of the child
	 * @param  {Object} options       Parent Sortable's options
	 * @return {HTMLElement}          The child at index childNum, or null if not found
	 */ function getChild(el, childNum = 0, options = {}, includeDragEl = false) {
	    let currentChild = 0, i = 0, children = el ? el.children : [];
	    while(children && i < children.length){
	        if (children[i].style.display !== 'none' && children[i] !== SortableCtor.ghost && (includeDragEl || children[i] !== SortableCtor.dragged) && closest(children[i], options.draggable, el, false)) {
	            if (currentChild === childNum) {
	                return children[i];
	            }
	            currentChild++;
	        }
	        i++;
	    }
	    return null;
	}
	/**
	 * Returns the index of an element within its parent for a selected set of
	 * elements
	 * @param  {HTMLElement} el
	 * @param  {selector} selector
	 * @return {number}
	 */ function index(el, selector) {
	    let index = 0;
	    if (!el || !el.parentNode) {
	        return -1;
	    }
	    /* jshint boss:true */ while(el = el.previousElementSibling){
	        if (el.nodeName.toUpperCase() !== 'TEMPLATE' && el !== SortableCtor.clone && (!selector || matches(el, selector))) {
	            index++;
	        }
	    }
	    return index;
	}
	/**
	 * Returns the index of the object within the given array
	 * @param  {Array} arr   Array that may or may not hold the object
	 * @param  {Object} obj  An object that has a key-value pair unique to and identical to a key-value pair in the object you want to find
	 * @return {Number}      The index of the object in the array, or -1
	 */ function indexOfObject(arr, obj) {
	    for(let i in arr){
	        if (!arr.hasOwnProperty(i)) continue;
	        for(let key in obj){
	            if (obj.hasOwnProperty(key) && obj[key] === arr[i][key]) return Number(i);
	        }
	    }
	    return -1;
	}
	function getParentAutoScrollElement(el, includeSelf) {
	    // skip to window
	    if (!el || !el.getBoundingClientRect) return getWindowScrollingElement();
	    let elem = el;
	    let gotSelf = false;
	    do {
	        // we don't need to get elem css if it isn't even overflowing in the first place (performance)
	        if (elem.clientWidth < elem.scrollWidth || elem.clientHeight < elem.scrollHeight) {
	            let elemCSS = css(elem);
	            if (elem.clientWidth < elem.scrollWidth && (elemCSS.overflowX == 'auto' || elemCSS.overflowX == 'scroll') || elem.clientHeight < elem.scrollHeight && (elemCSS.overflowY == 'auto' || elemCSS.overflowY == 'scroll')) {
	                if (!elem.getBoundingClientRect || elem === document.body) return getWindowScrollingElement();
	                if (gotSelf || includeSelf) return elem;
	                gotSelf = true;
	            }
	        }
	    /* jshint boss:true */ }while (elem = elem.parentNode)
	    return getWindowScrollingElement();
	}
	function isRectEqual(rect1, rect2) {
	    return Math.round(rect1.top) === Math.round(rect2.top) && Math.round(rect1.left) === Math.round(rect2.left) && Math.round(rect1.height) === Math.round(rect2.height) && Math.round(rect1.width) === Math.round(rect2.width);
	}
	let _throttleTimeout;
	function throttle(callback, ms) {
	    return function() {
	        if (!_throttleTimeout) {
	            let args = arguments, _this = this;
	            if (args.length === 1) {
	                callback.call(_this, args[0]);
	            } else {
	                callback.apply(_this, args);
	            }
	            _throttleTimeout = setTimeout(function() {
	                _throttleTimeout = void 0;
	            }, ms);
	        }
	    };
	}
	function cancelThrottle() {
	    clearTimeout(_throttleTimeout);
	    _throttleTimeout = void 0;
	}
	function scrollBy(el, x, y) {
	    el.scrollLeft += x;
	    el.scrollTop += y;
	}
	function clone(el) {
	    let Polymer = window.Polymer;
	    let $ = window.jQuery || window.Zepto;
	    if (Polymer && Polymer.dom) {
	        return Polymer.dom(el).cloneNode(true);
	    } else if ($) {
	        return $(el).clone(true)[0];
	    } else {
	        return el.cloneNode(true);
	    }
	}
	function setRect(el, rect) {
	    css(el, 'position', 'absolute');
	    css(el, 'top', rect.top);
	    css(el, 'left', rect.left);
	    css(el, 'width', rect.width);
	    css(el, 'height', rect.height);
	}
	function unsetRect(el) {
	    css(el, 'position', '');
	    css(el, 'top', '');
	    css(el, 'left', '');
	    css(el, 'width', '');
	    css(el, 'height', '');
	}
	const expando = 'Sortable' + new Date().getTime();

	let ghostEl = null;
	function getGhostEl() {
	    return ghostEl;
	}

	function AnimationStateManager() {
	    let animationStates = [];
	    let animationCallbackId = null;
	    return {
	        captureAnimationState () {
	            animationStates = [];
	            if (!this.options?.animation) return;
	            const children = Array.from(this.el.children);
	            children.forEach((child)=>{
	                if (css(child, 'display') === 'none' || child === getGhostEl()) return;
	                animationStates.push({
	                    target: child,
	                    rect: getRect(child, false, false, false)
	                });
	                const fromRect = {
	                    ...animationStates[animationStates.length - 1].rect
	                };
	                if (child.thisAnimationDuration) {
	                    const childMatrix = matrix(child, true);
	                    if (childMatrix) {
	                        fromRect.top -= childMatrix.f;
	                        fromRect.left -= childMatrix.e;
	                    }
	                }
	                child.fromRect = fromRect;
	            });
	        },
	        addAnimationState (state) {
	            animationStates.push(state);
	        },
	        removeAnimationState (target) {
	            const idx = indexOfObject(animationStates, {
	                target
	            });
	            if (idx >= 0) animationStates.splice(idx, 1);
	        },
	        animateAll (callback) {
	            if (!this.options?.animation) {
	                if (animationCallbackId) clearTimeout(animationCallbackId);
	                if (typeof callback === 'function') callback();
	                return;
	            }
	            let animating = false;
	            let animationTime = 0;
	            animationStates.forEach((state)=>{
	                let time = 0;
	                const target = state.target;
	                const fromRect = target.fromRect;
	                const baseToRect = getRect(target, false, false, false);
	                let toRect = baseToRect ? {
	                    ...baseToRect
	                } : null;
	                const prevFromRect = target.prevFromRect;
	                const prevToRect = target.prevToRect;
	                const animatingRect = state.rect;
	                const targetMatrix = matrix(target, true);
	                if (targetMatrix && toRect) {
	                    toRect.top -= targetMatrix.f;
	                    toRect.left -= targetMatrix.e;
	                }
	                target.toRect = toRect;
	                if (target.thisAnimationDuration) {
	                    if (isRectEqual(prevFromRect, toRect) && !isRectEqual(fromRect, toRect) && (animatingRect.top - toRect.top) / (animatingRect.left - toRect.left) === (fromRect.top - toRect.top) / (fromRect.left - toRect.left)) {
	                        time = calculateRealTime(animatingRect, prevFromRect, prevToRect, this.options);
	                    }
	                }
	                if (!isRectEqual(toRect, fromRect)) {
	                    target.prevFromRect = fromRect;
	                    target.prevToRect = toRect;
	                    if (!time) {
	                        time = this.options.animation;
	                    }
	                    this.animate(target, animatingRect, toRect, time);
	                }
	                if (time) {
	                    animating = true;
	                    animationTime = Math.max(animationTime, time);
	                    clearTimeout(target.animationResetTimer);
	                    target.animationResetTimer = setTimeout(()=>{
	                        target.animationTime = 0;
	                        target.prevFromRect = null;
	                        target.fromRect = null;
	                        target.prevToRect = null;
	                        target.thisAnimationDuration = null;
	                    }, time);
	                    target.thisAnimationDuration = time;
	                }
	            });
	            if (animationCallbackId) clearTimeout(animationCallbackId);
	            if (!animating) {
	                if (typeof callback === 'function') callback();
	            } else {
	                animationCallbackId = setTimeout(()=>{
	                    if (typeof callback === 'function') callback();
	                }, animationTime);
	            }
	            animationStates = [];
	        },
	        animate (target, currentRect, toRect, duration) {
	            if (duration) {
	                css(target, 'transition', '');
	                css(target, 'transform', '');
	                const elMatrix = matrix(this.el);
	                const scaleX = elMatrix && elMatrix.a;
	                const scaleY = elMatrix && elMatrix.d;
	                const translateX = (currentRect.left - toRect.left) / (scaleX || 1);
	                const translateY = (currentRect.top - toRect.top) / (scaleY || 1);
	                target.animatingX = !!translateX;
	                target.animatingY = !!translateY;
	                css(target, 'transform', `translate3d(${translateX}px,${translateY}px,0)`);
	                this.forRepaintDummy = repaint(target);
	                css(target, 'transition', 'transform ' + duration + 'ms' + (this.options.easing ? ' ' + this.options.easing : ''));
	                css(target, 'transform', 'translate3d(0,0,0)');
	                if (typeof target.animated === 'number') clearTimeout(target.animated);
	                target.animated = setTimeout(()=>{
	                    css(target, 'transition', '');
	                    css(target, 'transform', '');
	                    target.animated = false;
	                    target.animatingX = false;
	                    target.animatingY = false;
	                }, duration);
	            }
	        }
	    };
	}
	function repaint(target) {
	    return target.offsetWidth;
	}
	function calculateRealTime(animatingRect, fromRect, toRect, options) {
	    return Math.sqrt(Math.pow(fromRect.top - animatingRect.top, 2) + Math.pow(fromRect.left - animatingRect.left, 2)) / Math.sqrt(Math.pow(fromRect.top - toRect.top, 2) + Math.pow(fromRect.left - toRect.left, 2)) * options.animation;
	}

	const plugins = [];
	const defaults = {
	    initializeByDefault: true
	};
	var PluginManager = {
	    mount (plugin) {
	        for(const option in defaults){
	            if (Object.prototype.hasOwnProperty.call(defaults, option) && !(option in plugin)) {
	                plugin[option] = defaults[option];
	            }
	        }
	        plugins.forEach((p)=>{
	            if (p.pluginName === plugin.pluginName) {
	                throw `Sortable: Cannot mount plugin ${plugin.pluginName} more than once`;
	            }
	        });
	        plugins.push(plugin);
	    },
	    pluginEvent (eventName, sortable, evt) {
	        this.eventCanceled = false;
	        evt.cancel = ()=>{
	            this.eventCanceled = true;
	        };
	        const eventNameGlobal = eventName + 'Global';
	        plugins.forEach((plugin)=>{
	            if (!sortable[plugin.pluginName]) return;
	            if (sortable[plugin.pluginName][eventNameGlobal]) {
	                sortable[plugin.pluginName][eventNameGlobal]({
	                    sortable,
	                    ...evt
	                });
	            }
	            if (sortable.options[plugin.pluginName] && sortable[plugin.pluginName][eventName]) {
	                sortable[plugin.pluginName][eventName]({
	                    sortable,
	                    ...evt
	                });
	            }
	        });
	    },
	    initializePlugins (sortable, el, defaults, options) {
	        plugins.forEach((plugin)=>{
	            const pluginName = plugin.pluginName;
	            if (!sortable.options[pluginName] && !plugin.initializeByDefault) return;
	            const initialized = new plugin(sortable, el, sortable.options);
	            initialized.sortable = sortable;
	            initialized.options = sortable.options;
	            sortable[pluginName] = initialized;
	            Object.assign(defaults, initialized.defaults);
	        });
	        for(const option in sortable.options){
	            if (!Object.prototype.hasOwnProperty.call(sortable.options, option)) continue;
	            const modified = this.modifyOption(sortable, option, sortable.options[option]);
	            if (typeof modified !== 'undefined') {
	                sortable.options[option] = modified;
	            }
	        }
	    },
	    getEventProperties (name, sortable) {
	        let eventProperties = {};
	        plugins.forEach((plugin)=>{
	            if (typeof plugin.eventProperties !== 'function') return;
	            Object.assign(eventProperties, plugin.eventProperties.call(sortable[plugin.pluginName], name));
	        });
	        return eventProperties;
	    },
	    modifyOption (sortable, name, value) {
	        let modifiedValue;
	        plugins.forEach((plugin)=>{
	            if (!sortable[plugin.pluginName]) return;
	            if (plugin.optionListeners && typeof plugin.optionListeners[name] === 'function') {
	                modifiedValue = plugin.optionListeners[name].call(sortable[plugin.pluginName], value);
	            }
	        });
	        return modifiedValue;
	    }
	};

	function dispatchEvent(info) {
	    let { sortable, rootEl, name, targetEl, cloneEl, toEl, fromEl, oldIndex, newIndex, oldDraggableIndex, newDraggableIndex, originalEvent, putSortable, extraEventProperties } = info;
	    sortable = sortable || rootEl && rootEl[expando];
	    if (!sortable) return;
	    let evt;
	    const options = sortable.options;
	    const onName = 'on' + name.charAt(0).toUpperCase() + name.slice(1);
	    if (window.CustomEvent && !IE11OrLess && !Edge) {
	        evt = new CustomEvent(name, {
	            bubbles: true,
	            cancelable: true
	        });
	    } else {
	        evt = document.createEvent('Event');
	        evt.initEvent(name, true, true);
	    }
	    evt.to = toEl || rootEl;
	    evt.from = fromEl || rootEl;
	    evt.item = targetEl || rootEl;
	    evt.clone = cloneEl;
	    evt.oldIndex = oldIndex;
	    evt.newIndex = newIndex;
	    evt.oldDraggableIndex = oldDraggableIndex;
	    evt.newDraggableIndex = newDraggableIndex;
	    evt.originalEvent = originalEvent;
	    evt.pullMode = putSortable ? putSortable.lastPutMode : undefined;
	    const allEventProperties = {
	        ...extraEventProperties,
	        ...PluginManager.getEventProperties(name, sortable)
	    };
	    for(const option in allEventProperties){
	        evt[option] = allEventProperties[option];
	    }
	    if (rootEl) {
	        rootEl.dispatchEvent(evt);
	    }
	    if (options[onName]) {
	        options[onName].call(sortable, evt);
	    }
	}

	const documentExists = typeof document !== 'undefined';
	documentExists && !ChromeForAndroid && !IOS && 'draggable' in document.createElement('div');
	(()=>{
	    if (!documentExists) return false;
	    if (IE11OrLess) return false;
	    const el = document.createElement('x');
	    el.style.cssText = 'pointer-events:auto';
	    return el.style.pointerEvents === 'auto';
	})();
	const expandoProperty = `sortable_${Date.now()}`;

	function detectDirection(el, options) {
	    const elCSS = css(el);
	    const elWidth = parseInt(elCSS.width) - parseInt(elCSS.paddingLeft) - parseInt(elCSS.paddingRight) - parseInt(elCSS.borderLeftWidth) - parseInt(elCSS.borderRightWidth);
	    const child1 = getChild(el, 0, options);
	    const child2 = getChild(el, 1, options);
	    const firstChildCSS = child1 && css(child1);
	    const secondChildCSS = child2 && css(child2);
	    const firstChildWidth = firstChildCSS && parseInt(firstChildCSS.marginLeft) + parseInt(firstChildCSS.marginRight) + getRect(child1, false, false, false).width;
	    const secondChildWidth = secondChildCSS && parseInt(secondChildCSS.marginLeft) + parseInt(secondChildCSS.marginRight) + getRect(child2, false, false, false).width;
	    if (elCSS.display === 'flex') {
	        return elCSS.flexDirection === 'column' || elCSS.flexDirection === 'column-reverse' ? 'vertical' : 'horizontal';
	    }
	    if (elCSS.display === 'grid') {
	        return elCSS.gridTemplateColumns.split(' ').length <= 1 ? 'vertical' : 'horizontal';
	    }
	    if (child1 && firstChildCSS.float && firstChildCSS.float !== 'none') {
	        const touchingSideChild2 = firstChildCSS.float === 'left' ? 'left' : 'right';
	        return child2 && (secondChildCSS.clear === 'both' || secondChildCSS.clear === touchingSideChild2) ? 'vertical' : 'horizontal';
	    }
	    const CSSFloatProperty = Edge || IE11OrLess ? 'cssFloat' : 'float';
	    return child1 && (firstChildCSS.display === 'block' || firstChildCSS.display === 'flex' || firstChildCSS.display === 'table' || firstChildCSS.display === 'grid' || firstChildWidth >= elWidth && elCSS[CSSFloatProperty] === 'none' || child2 && elCSS[CSSFloatProperty] === 'none' && firstChildWidth + secondChildWidth > elWidth) ? 'vertical' : 'horizontal';
	}
	function prepareGroup(options) {
	    function toFn(value, pull) {
	        return function(to, from, dragEl, evt) {
	            const sameGroup = to.options.group.name && from.options.group.name && to.options.group.name === from.options.group.name;
	            if (value == null && (pull || sameGroup)) {
	                return true;
	            } else if (value == null || value === false) {
	                return false;
	            } else if (pull && value === 'clone') {
	                return value;
	            } else if (typeof value === 'function') {
	                return toFn(value(to, from, dragEl, evt), pull)(to, from, dragEl, evt);
	            } else {
	                const otherGroup = (pull ? to : from).options.group.name;
	                return value === true || typeof value === 'string' && value === otherGroup || Array.isArray(value) && value.indexOf(otherGroup) > -1;
	            }
	        };
	    }
	    const originalGroup = options.group;
	    if (!originalGroup || typeof originalGroup != 'object') {
	        options.group = {
	            name: originalGroup
	        };
	    }
	    const group = {};
	    group.name = originalGroup.name;
	    group.checkPull = toFn(originalGroup.pull, true);
	    group.checkPut = toFn(originalGroup.put);
	    group.revertClone = originalGroup.revertClone;
	    options.group = group;
	}
	function setupClickPrevention(documentExists, ChromeForAndroid) {
	    if (documentExists && !ChromeForAndroid) {
	        document.addEventListener('click', function(evt) {
	        }, true);
	    }
	}

	// @ts-check
	// Setup click prevention
	setupClickPrevention(documentExists, ChromeForAndroid);
	// #1184 fix - Prevent click event on fallback if dragged but item not changed position
	if (documentExists && !ChromeForAndroid) {
	    document.addEventListener('click', function(evt) {
	    }, true);
	}
	/**
	 * @class  Sortable
	 * @param  {HTMLElement}  el
	 * @param  {Object}       [options]
	 */ function Sortable(el, options = {}) {
	    if (!(el && el.nodeType && el.nodeType === 1)) {
	        throw `Sortable: \`el\` must be an HTMLElement, not ${({}).toString.call(el)}`;
	    }
	    this.el = el; // root element
	    this.options = options = Object.assign({}, options);
	    // Export instance
	    el[expandoProperty] = this;
	    const defaults = {
	        group: null,
	        sort: true,
	        disabled: false,
	        store: null,
	        handle: null,
	        draggable: /^[uo]l$/i.test(el.nodeName) ? '>li' : '>*',
	        swapThreshold: 1,
	        invertSwap: false,
	        invertedSwapThreshold: null,
	        removeCloneOnHide: true,
	        direction: function() {
	            return detectDirection(el, this.options);
	        },
	        ghostClass: 'sortable-ghost',
	        chosenClass: 'sortable-chosen',
	        dragClass: 'sortable-drag',
	        ignore: 'a, img',
	        filter: null,
	        preventOnFilter: true,
	        animation: 0,
	        easing: null
	    };
	    // Assign defaults
	    for(const key in defaults){
	        if (!(key in options)) {
	            options[key] = defaults[key];
	        }
	    }
	    // Prepare group
	    prepareGroup(options);
	    // Initialize animation
	    this.animation = AnimationStateManager();
	    // Initialize plugins
	    PluginManager.initializePlugins(this, el, defaults, options);
	    // Bind events
	    this._onDragOver = this._onDragOver.bind(this);
	    this._onDragStart = this._onDragStart.bind(this);
	    this._onDragEnd = this._onDragEnd.bind(this);
	    this._onDrop = this._onDrop.bind(this);
	    this._onSelectStart = this._onSelectStart.bind(this);
	    on(el, 'mousedown', this._onDragStart);
	    on(el, 'touchstart', this._onDragStart);
	    on(el, 'pointerdown', this._onDragStart);
	}
	// Sortable prototype methods
	Sortable.prototype = {
	    constructor: Sortable,
	    _onDragStart: function(evt) {
	    // ... implementation
	    },
	    _onDragOver: function(evt) {
	    // ... implementation
	    },
	    _onDragEnd: function(evt) {
	    // ... implementation
	    },
	    _onDrop: function(evt) {
	    // ... implementation
	    },
	    _onSelectStart: function(evt) {
	    // ... implementation
	    },
	    _isOutsideThisEl: function(target) {
	        return !this.el.contains(target);
	    }
	};
	// Static properties
	Sortable.active = null;
	Sortable.dragged = null;
	Sortable.ghost = null;
	Sortable.clone = null;
	Sortable.cloneId = 0;
	Sortable.eventCanceled = ()=>false;
	Sortable.supportPointer = false;
	Sortable._dragStartTimer = null;
	Sortable._dragStartId = null;
	Sortable._dragStarted = function() {};
	Sortable._lastX = 0;
	Sortable._lastY = 0;
	Sortable._loopId = 0;
	Sortable._captureAnimationState = ()=>{};
	Sortable._animateAll = ()=>{};
	Sortable.animate = ()=>{};
	Sortable.captureAnimationState = ()=>{};
	Sortable.animateAll = ()=>{};
	Sortable.lastPutMode = null;
	Sortable._onDragOver = ()=>{};
	const SortableCtor = Sortable;

	// @ts-nocheck
	let autoScrolls = [], scrollEl, scrollRootEl, scrolling = false, lastAutoScrollX, lastAutoScrollY, touchEvt, pointerElemChangedInterval;
	function AutoScrollPlugin() {
	    function AutoScroll() {
	        this.defaults = {
	            scroll: true,
	            forceAutoScrollFallback: false,
	            scrollSensitivity: 30,
	            scrollSpeed: 10,
	            bubbleScroll: true
	        };
	        // Bind all private methods
	        for(let fn in this){
	            if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
	                this[fn] = this[fn].bind(this);
	            }
	        }
	    }
	    AutoScroll.prototype = {
	        dragStarted ({ originalEvent }) {
	            if (this.sortable.nativeDraggable) {
	                on(document, 'dragover', this._handleAutoScroll);
	            } else {
	                if (this.options.supportPointer) {
	                    on(document, 'pointermove', this._handleFallbackAutoScroll);
	                } else if (originalEvent.touches) {
	                    on(document, 'touchmove', this._handleFallbackAutoScroll);
	                } else {
	                    on(document, 'mousemove', this._handleFallbackAutoScroll);
	                }
	            }
	        },
	        dragOverCompleted ({ originalEvent }) {
	            // For when bubbling is canceled and using fallback (fallback 'touchmove' always reached)
	            if (!this.options.dragOverBubble && !originalEvent.rootEl) {
	                this._handleAutoScroll(originalEvent);
	            }
	        },
	        drop () {
	            if (this.sortable.nativeDraggable) {
	                off(document, 'dragover', this._handleAutoScroll);
	            } else {
	                off(document, 'pointermove', this._handleFallbackAutoScroll);
	                off(document, 'touchmove', this._handleFallbackAutoScroll);
	                off(document, 'mousemove', this._handleFallbackAutoScroll);
	            }
	            clearPointerElemChangedInterval();
	            clearAutoScrolls();
	            cancelThrottle();
	        },
	        nulling () {
	            touchEvt = scrollRootEl = scrollEl = scrolling = pointerElemChangedInterval = lastAutoScrollX = lastAutoScrollY = null;
	            autoScrolls.length = 0;
	        },
	        _handleFallbackAutoScroll (evt) {
	            this._handleAutoScroll(evt, true);
	        },
	        _handleAutoScroll (evt, fallback) {
	            const x = (evt.touches ? evt.touches[0] : evt).clientX, y = (evt.touches ? evt.touches[0] : evt).clientY, elem = document.elementFromPoint(x, y);
	            touchEvt = evt;
	            // IE does not seem to have native autoscroll,
	            // Edge's autoscroll seems too conditional,
	            // MACOS Safari does not have autoscroll,
	            // Firefox and Chrome are good
	            if (fallback || this.options.forceAutoScrollFallback || Edge || IE11OrLess || Safari) {
	                autoScroll(evt, this.options, elem, fallback);
	                // Listener for pointer element change
	                let ogElemScroller = getParentAutoScrollElement(elem, true);
	                if (scrolling && (!pointerElemChangedInterval || x !== lastAutoScrollX || y !== lastAutoScrollY)) {
	                    pointerElemChangedInterval && clearPointerElemChangedInterval();
	                    // Detect for pointer elem change, emulating native DnD behaviour
	                    pointerElemChangedInterval = setInterval(()=>{
	                        let newElem = getParentAutoScrollElement(document.elementFromPoint(x, y), true);
	                        if (newElem !== ogElemScroller) {
	                            ogElemScroller = newElem;
	                            clearAutoScrolls();
	                        }
	                        autoScroll(evt, this.options, newElem, fallback);
	                    }, 10);
	                    lastAutoScrollX = x;
	                    lastAutoScrollY = y;
	                }
	            } else {
	                // if DnD is enabled (and browser has good autoscrolling), first autoscroll will already scroll, so get parent autoscroll of first autoscroll
	                if (!this.options.bubbleScroll || getParentAutoScrollElement(elem, true) === getWindowScrollingElement()) {
	                    clearAutoScrolls();
	                    return;
	                }
	                autoScroll(evt, this.options, getParentAutoScrollElement(elem, false), false);
	            }
	        }
	    };
	    return Object.assign(AutoScroll, {
	        pluginName: 'scroll',
	        initializeByDefault: true
	    });
	}
	function clearAutoScrolls() {
	    autoScrolls.forEach(function(autoScroll) {
	        clearInterval(autoScroll.pid);
	    });
	    autoScrolls = [];
	}
	function clearPointerElemChangedInterval() {
	    clearInterval(pointerElemChangedInterval);
	}
	const autoScroll = throttle(function(evt, options, rootEl, isFallback) {
	    // Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
	    if (!options.scroll) return;
	    const x = (evt.touches ? evt.touches[0] : evt).clientX, y = (evt.touches ? evt.touches[0] : evt).clientY, sens = options.scrollSensitivity, speed = options.scrollSpeed, winScroller = getWindowScrollingElement();
	    let scrollThisInstance = false, scrollCustomFn;
	    // New scroll root, set scrollEl
	    if (scrollRootEl !== rootEl) {
	        scrollRootEl = rootEl;
	        clearAutoScrolls();
	        scrollEl = options.scroll;
	        scrollCustomFn = options.scrollFn;
	        if (scrollEl === true) {
	            scrollEl = getParentAutoScrollElement(rootEl, true);
	        }
	    }
	    let layersOut = 0;
	    let currentParent = scrollEl;
	    do {
	        let el = currentParent, rect = getRect(el), top = rect.top, bottom = rect.bottom, left = rect.left, right = rect.right, width = rect.width, height = rect.height, canScrollX, canScrollY, scrollWidth = el.scrollWidth, scrollHeight = el.scrollHeight, elCSS = css(el), scrollPosX = el.scrollLeft, scrollPosY = el.scrollTop;
	        if (el === winScroller) {
	            canScrollX = width < scrollWidth && (elCSS.overflowX === 'auto' || elCSS.overflowX === 'scroll' || elCSS.overflowX === 'visible');
	            canScrollY = height < scrollHeight && (elCSS.overflowY === 'auto' || elCSS.overflowY === 'scroll' || elCSS.overflowY === 'visible');
	        } else {
	            canScrollX = width < scrollWidth && (elCSS.overflowX === 'auto' || elCSS.overflowX === 'scroll');
	            canScrollY = height < scrollHeight && (elCSS.overflowY === 'auto' || elCSS.overflowY === 'scroll');
	        }
	        let vx = canScrollX && Number(Math.abs(right - x) <= sens && scrollPosX + width < scrollWidth) - Number(Math.abs(left - x) <= sens && !!scrollPosX);
	        let vy = canScrollY && Number(Math.abs(bottom - y) <= sens && scrollPosY + height < scrollHeight) - Number(Math.abs(top - y) <= sens && !!scrollPosY);
	        if (!autoScrolls[layersOut]) {
	            for(let i = 0; i <= layersOut; i++){
	                if (!autoScrolls[i]) {
	                    autoScrolls[i] = {};
	                }
	            }
	        }
	        if (autoScrolls[layersOut].vx != vx || autoScrolls[layersOut].vy != vy || autoScrolls[layersOut].el !== el) {
	            autoScrolls[layersOut].el = el;
	            autoScrolls[layersOut].vx = vx;
	            autoScrolls[layersOut].vy = vy;
	            clearInterval(autoScrolls[layersOut].pid);
	            if (vx != 0 || vy != 0) {
	                scrollThisInstance = true;
	                /* jshint loopfunc:true */ autoScrolls[layersOut].pid = setInterval((function() {
	                    // emulate drag over during autoscroll (fallback), emulating native DnD behaviour
	                    if (isFallback && this.layer === 0) {
	                        SortableCtor.active._onTouchMove(touchEvt); // To move ghost if it is positioned absolutely
	                    }
	                    let scrollOffsetY = autoScrolls[this.layer].vy ? autoScrolls[this.layer].vy * speed : 0;
	                    let scrollOffsetX = autoScrolls[this.layer].vx ? autoScrolls[this.layer].vx * speed : 0;
	                    if (typeof scrollCustomFn === 'function') {
	                        if (scrollCustomFn.call(SortableCtor.dragged.parentNode[expando], scrollOffsetX, scrollOffsetY, evt, touchEvt, autoScrolls[this.layer].el) !== 'continue') {
	                            return;
	                        }
	                    }
	                    scrollBy(autoScrolls[this.layer].el, scrollOffsetX, scrollOffsetY);
	                }).bind({
	                    layer: layersOut
	                }), 24);
	            }
	        }
	        layersOut++;
	    }while (options.bubbleScroll && currentParent !== winScroller && (currentParent = getParentAutoScrollElement(currentParent, false)))
	    scrolling = scrollThisInstance; // in case another function catches scrolling as false in between when it is not
	}, 30);

	// @ts-nocheck
	const drop = function({ originalEvent, putSortable, dragEl, activeSortable, dispatchSortableEvent, hideGhostForTarget, unhideGhostForTarget }) {
	    if (!originalEvent) return;
	    let toSortable = putSortable || activeSortable;
	    hideGhostForTarget();
	    let touch = originalEvent.changedTouches && originalEvent.changedTouches.length ? originalEvent.changedTouches[0] : originalEvent;
	    let target = document.elementFromPoint(touch.clientX, touch.clientY);
	    unhideGhostForTarget();
	    if (toSortable && !toSortable.el.contains(target)) {
	        dispatchSortableEvent('spill');
	        this.onSpill({
	            dragEl,
	            putSortable
	        });
	    }
	};
	function Revert() {}
	Revert.prototype = {
	    startIndex: null,
	    dragStart ({ oldDraggableIndex }) {
	        this.startIndex = oldDraggableIndex;
	    },
	    onSpill ({ dragEl, putSortable }) {
	        this.sortable.captureAnimationState();
	        if (putSortable) {
	            putSortable.captureAnimationState();
	        }
	        let nextSibling = getChild(this.sortable.el, this.startIndex, this.options);
	        if (nextSibling) {
	            this.sortable.el.insertBefore(dragEl, nextSibling);
	        } else {
	            this.sortable.el.appendChild(dragEl);
	        }
	        this.sortable.animateAll();
	        if (putSortable) {
	            putSortable.animateAll();
	        }
	    },
	    drop
	};
	Object.assign(Revert, {
	    pluginName: 'revertOnSpill'
	});
	function Remove() {}
	Remove.prototype = {
	    onSpill ({ dragEl, putSortable }) {
	        const parentSortable = putSortable || this.sortable;
	        parentSortable.captureAnimationState();
	        dragEl.parentNode && dragEl.parentNode.removeChild(dragEl);
	        parentSortable.animateAll();
	    },
	    drop
	};
	Object.assign(Remove, {
	    pluginName: 'removeOnSpill'
	});

	// @ts-nocheck
	let lastSwapEl;
	function SwapPlugin() {
	    function Swap() {
	        this.defaults = {
	            swapClass: 'sortable-swap-highlight'
	        };
	    }
	    Swap.prototype = {
	        dragStart ({ dragEl }) {
	            lastSwapEl = dragEl;
	        },
	        dragOverValid ({ completed, target, onMove, activeSortable, changed, cancel }) {
	            if (!activeSortable.options.swap) return;
	            let el = this.sortable.el, options = this.options;
	            if (target && target !== el) {
	                let prevSwapEl = lastSwapEl;
	                if (onMove(target) !== false) {
	                    toggleClass(target, options.swapClass, true);
	                    lastSwapEl = target;
	                } else {
	                    lastSwapEl = null;
	                }
	                if (prevSwapEl && prevSwapEl !== lastSwapEl) {
	                    toggleClass(prevSwapEl, options.swapClass, false);
	                }
	            }
	            changed();
	            completed(true);
	            cancel();
	        },
	        drop ({ activeSortable, putSortable, dragEl }) {
	            let toSortable = putSortable || this.sortable;
	            let options = this.options;
	            lastSwapEl && toggleClass(lastSwapEl, options.swapClass, false);
	            if (lastSwapEl && (options.swap || putSortable && putSortable.options.swap)) {
	                if (dragEl !== lastSwapEl) {
	                    toSortable.captureAnimationState();
	                    if (toSortable !== activeSortable) activeSortable.captureAnimationState();
	                    swapNodes(dragEl, lastSwapEl);
	                    toSortable.animateAll();
	                    if (toSortable !== activeSortable) activeSortable.animateAll();
	                }
	            }
	        },
	        nulling () {
	            lastSwapEl = null;
	        }
	    };
	    return Object.assign(Swap, {
	        pluginName: 'swap',
	        eventProperties () {
	            return {
	                swapItem: lastSwapEl
	            };
	        }
	    });
	}
	function swapNodes(n1, n2) {
	    let p1 = n1.parentNode, p2 = n2.parentNode, i1, i2;
	    if (!p1 || !p2 || p1.isEqualNode(n2) || p2.isEqualNode(n1)) return;
	    i1 = index(n1);
	    i2 = index(n2);
	    if (p1.isEqualNode(p2) && i1 < i2) {
	        i2++;
	    }
	    p1.insertBefore(n2, p1.children[i1]);
	    p2.insertBefore(n1, p2.children[i2]);
	}

	// @ts-nocheck
	let multiDragElements = [], multiDragClones = [], lastMultiDragSelect, multiDragSortable, initialFolding = false, folding = false, dragStarted = false, dragEl, clonesFromRect, clonesHidden;
	function MultiDragPlugin() {
	    function MultiDrag(sortable) {
	        // Bind all private methods
	        for(let fn in this){
	            if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
	                this[fn] = this[fn].bind(this);
	            }
	        }
	        if (!sortable.options.avoidImplicitDeselect) {
	            if (sortable.options.supportPointer) {
	                on(document, 'pointerup', this._deselectMultiDrag);
	            } else {
	                on(document, 'mouseup', this._deselectMultiDrag);
	                on(document, 'touchend', this._deselectMultiDrag);
	            }
	        }
	        on(document, 'keydown', this._checkKeyDown);
	        on(document, 'keyup', this._checkKeyUp);
	        this.defaults = {
	            selectedClass: 'sortable-selected',
	            multiDragKey: null,
	            avoidImplicitDeselect: false,
	            setData (dataTransfer, dragEl) {
	                let data = '';
	                if (multiDragElements.length && multiDragSortable === sortable) {
	                    multiDragElements.forEach((multiDragElement, i)=>{
	                        data += (!i ? '' : ', ') + multiDragElement.textContent;
	                    });
	                } else {
	                    data = dragEl.textContent;
	                }
	                dataTransfer.setData('Text', data);
	            }
	        };
	    }
	    MultiDrag.prototype = {
	        multiDragKeyDown: false,
	        isMultiDrag: false,
	        delayStartGlobal ({ dragEl: dragged }) {
	            dragEl = dragged;
	        },
	        delayEnded () {
	            this.isMultiDrag = multiDragElements.indexOf(dragEl) !== -1;
	        },
	        setupClone ({ sortable, cancel }) {
	            if (!this.isMultiDrag) return;
	            for(let i = 0; i < multiDragElements.length; i++){
	                multiDragClones.push(clone(multiDragElements[i]));
	                multiDragClones[i].sortableIndex = multiDragElements[i].sortableIndex;
	                multiDragClones[i].draggable = false;
	                multiDragClones[i].style['will-change'] = '';
	                toggleClass(multiDragClones[i], this.options.selectedClass, false);
	                multiDragElements[i] === dragEl && toggleClass(multiDragClones[i], this.options.chosenClass, false);
	            }
	            sortable._hideClone();
	            cancel();
	        },
	        clone ({ sortable, rootEl, dispatchSortableEvent, cancel }) {
	            if (!this.isMultiDrag) return;
	            if (!this.options.removeCloneOnHide) {
	                if (multiDragElements.length && multiDragSortable === sortable) {
	                    insertMultiDragClones(true, rootEl);
	                    dispatchSortableEvent('clone');
	                    cancel();
	                }
	            }
	        },
	        showClone ({ cloneNowShown, rootEl, cancel }) {
	            if (!this.isMultiDrag) return;
	            insertMultiDragClones(false, rootEl);
	            multiDragClones.forEach((clone)=>{
	                css(clone, 'display', '');
	            });
	            cloneNowShown();
	            clonesHidden = false;
	            cancel();
	        },
	        hideClone ({ sortable, cloneNowHidden, cancel }) {
	            if (!this.isMultiDrag) return;
	            multiDragClones.forEach((clone)=>{
	                css(clone, 'display', 'none');
	                if (this.options.removeCloneOnHide && clone.parentNode) {
	                    clone.parentNode.removeChild(clone);
	                }
	            });
	            cloneNowHidden();
	            clonesHidden = true;
	            cancel();
	        },
	        dragStartGlobal ({ sortable }) {
	            if (!this.isMultiDrag && multiDragSortable) {
	                multiDragSortable.multiDrag._deselectMultiDrag();
	            }
	            multiDragElements.forEach((multiDragElement)=>{
	                multiDragElement.sortableIndex = index(multiDragElement);
	            });
	            // Sort multi-drag elements
	            multiDragElements = multiDragElements.sort(function(a, b) {
	                return a.sortableIndex - b.sortableIndex;
	            });
	            dragStarted = true;
	        },
	        dragStarted ({ sortable }) {
	            if (!this.isMultiDrag) return;
	            if (this.options.sort) {
	                // Capture rects,
	                // hide multi drag elements (by positioning them absolute),
	                // set multi drag elements rects to dragRect,
	                // show multi drag elements,
	                // animate to rects,
	                // unset rects & remove from DOM
	                sortable.captureAnimationState();
	                if (this.options.animation) {
	                    multiDragElements.forEach((multiDragElement)=>{
	                        if (multiDragElement === dragEl) return;
	                        css(multiDragElement, 'position', 'absolute');
	                    });
	                    let dragRect = getRect(dragEl, false, true, true);
	                    multiDragElements.forEach((multiDragElement)=>{
	                        if (multiDragElement === dragEl) return;
	                        setRect(multiDragElement, dragRect);
	                    });
	                    folding = true;
	                    initialFolding = true;
	                }
	            }
	            sortable.animateAll(()=>{
	                folding = false;
	                initialFolding = false;
	                if (this.options.animation) {
	                    multiDragElements.forEach((multiDragElement)=>{
	                        unsetRect(multiDragElement);
	                    });
	                }
	                // Remove all auxiliary multidrag items from el, if sorting enabled
	                if (this.options.sort) {
	                    removeMultiDragElements();
	                }
	            });
	        },
	        dragOver ({ target, completed, cancel }) {
	            if (folding && ~multiDragElements.indexOf(target)) {
	                completed(false);
	                cancel();
	            }
	        },
	        revert ({ fromSortable, rootEl, sortable, dragRect }) {
	            if (multiDragElements.length > 1) {
	                // Setup unfold animation
	                multiDragElements.forEach((multiDragElement)=>{
	                    sortable.addAnimationState({
	                        target: multiDragElement,
	                        rect: folding ? getRect(multiDragElement) : dragRect
	                    });
	                    unsetRect(multiDragElement);
	                    multiDragElement.fromRect = dragRect;
	                    fromSortable.removeAnimationState(multiDragElement);
	                });
	                folding = false;
	                insertMultiDragElements(!this.options.removeCloneOnHide, rootEl);
	            }
	        },
	        dragOverCompleted ({ sortable, isOwner, insertion, activeSortable, parentEl, putSortable }) {
	            let options = this.options;
	            if (insertion) {
	                // Clones must be hidden before folding animation to capture dragRectAbsolute properly
	                if (isOwner) {
	                    activeSortable._hideClone();
	                }
	                initialFolding = false;
	                // If leaving sort:false root, or already folding - Fold to new location
	                if (options.animation && multiDragElements.length > 1 && (folding || !isOwner && !activeSortable.options.sort && !putSortable)) {
	                    // Fold: Set all multi drag elements's rects to dragEl's rect when multi-drag elements are invisible
	                    let dragRectAbsolute = getRect(dragEl, false, true, true);
	                    multiDragElements.forEach((multiDragElement)=>{
	                        if (multiDragElement === dragEl) return;
	                        setRect(multiDragElement, dragRectAbsolute);
	                        // Move element(s) to end of parentEl so that it does not interfere with multi-drag clones insertion if they are inserted
	                        // while folding, and so that we can capture them again because old sortable will no longer be fromSortable
	                        parentEl.appendChild(multiDragElement);
	                    });
	                    folding = true;
	                }
	                // Clones must be shown (and check to remove multi drags) after folding when interfering multiDragElements are moved out
	                if (!isOwner) {
	                    // Only remove if not folding (folding will remove them anyways)
	                    if (!folding) {
	                        removeMultiDragElements();
	                    }
	                    if (multiDragElements.length > 1) {
	                        let clonesHiddenBefore = clonesHidden;
	                        activeSortable._showClone(sortable);
	                        // Unfold animation for clones if showing from hidden
	                        if (activeSortable.options.animation && !clonesHidden && clonesHiddenBefore) {
	                            multiDragClones.forEach((clone)=>{
	                                activeSortable.addAnimationState({
	                                    target: clone,
	                                    rect: clonesFromRect
	                                });
	                                clone.fromRect = clonesFromRect;
	                                clone.thisAnimationDuration = null;
	                            });
	                        }
	                    } else {
	                        activeSortable._showClone(sortable);
	                    }
	                }
	            }
	        },
	        dragOverAnimationCapture ({ dragRect, isOwner, activeSortable }) {
	            multiDragElements.forEach((multiDragElement)=>{
	                multiDragElement.thisAnimationDuration = null;
	            });
	            if (activeSortable.options.animation && !isOwner && activeSortable.multiDrag.isMultiDrag) {
	                clonesFromRect = Object.assign({}, dragRect);
	                let dragMatrix = matrix(dragEl, true);
	                clonesFromRect.top -= dragMatrix.f;
	                clonesFromRect.left -= dragMatrix.e;
	            }
	        },
	        dragOverAnimationComplete () {
	            if (folding) {
	                folding = false;
	                removeMultiDragElements();
	            }
	        },
	        drop ({ originalEvent: evt, rootEl, parentEl, sortable, dispatchSortableEvent, oldIndex, putSortable }) {
	            let toSortable = putSortable || this.sortable;
	            if (!evt) return;
	            let options = this.options, children = parentEl.children;
	            // Multi-drag selection
	            if (!dragStarted) {
	                if (options.multiDragKey && !this.multiDragKeyDown) {
	                    this._deselectMultiDrag();
	                }
	                toggleClass(dragEl, options.selectedClass, !~multiDragElements.indexOf(dragEl));
	                if (!~multiDragElements.indexOf(dragEl)) {
	                    multiDragElements.push(dragEl);
	                    dispatchEvent({
	                        sortable,
	                        rootEl,
	                        name: 'select',
	                        targetEl: dragEl,
	                        originalEvent: evt
	                    });
	                    // Modifier activated, select from last to dragEl
	                    if (evt.shiftKey && lastMultiDragSelect && sortable.el.contains(lastMultiDragSelect)) {
	                        let lastIndex = index(lastMultiDragSelect), currentIndex = index(dragEl);
	                        if (~lastIndex && ~currentIndex && lastIndex !== currentIndex) {
	                            // Must include lastMultiDragSelect (select it), in case modified selection from no selection
	                            // (but previous selection existed)
	                            let n, i;
	                            if (currentIndex > lastIndex) {
	                                i = lastIndex;
	                                n = currentIndex;
	                            } else {
	                                i = currentIndex;
	                                n = lastIndex + 1;
	                            }
	                            const filter = options.filter;
	                            for(; i < n; i++){
	                                if (~multiDragElements.indexOf(children[i])) continue;
	                                // Check if element is draggable
	                                if (!closest(children[i], options.draggable, parentEl, false)) continue;
	                                // Check if element is filtered
	                                const filtered = filter && (typeof filter === 'function' ? filter.call(sortable, evt, children[i], sortable) : filter.split(',').some((criteria)=>{
	                                    return closest(children[i], criteria.trim(), parentEl, false);
	                                }));
	                                if (filtered) continue;
	                                toggleClass(children[i], options.selectedClass, true);
	                                multiDragElements.push(children[i]);
	                                dispatchEvent({
	                                    sortable,
	                                    rootEl,
	                                    name: 'select',
	                                    targetEl: children[i],
	                                    originalEvent: evt
	                                });
	                            }
	                        }
	                    } else {
	                        lastMultiDragSelect = dragEl;
	                    }
	                    multiDragSortable = toSortable;
	                } else {
	                    multiDragElements.splice(multiDragElements.indexOf(dragEl), 1);
	                    lastMultiDragSelect = null;
	                    dispatchEvent({
	                        sortable,
	                        rootEl,
	                        name: 'deselect',
	                        targetEl: dragEl,
	                        originalEvent: evt
	                    });
	                }
	            }
	            // Multi-drag drop
	            if (dragStarted && this.isMultiDrag) {
	                folding = false;
	                // Do not "unfold" after around dragEl if reverted
	                if ((parentEl[expando].options.sort || parentEl !== rootEl) && multiDragElements.length > 1) {
	                    let dragRect = getRect(dragEl), multiDragIndex = index(dragEl, ':not(.' + this.options.selectedClass + ')');
	                    if (!initialFolding && options.animation) dragEl.thisAnimationDuration = null;
	                    toSortable.captureAnimationState();
	                    if (!initialFolding) {
	                        if (options.animation) {
	                            dragEl.fromRect = dragRect;
	                            multiDragElements.forEach((multiDragElement)=>{
	                                multiDragElement.thisAnimationDuration = null;
	                                if (multiDragElement !== dragEl) {
	                                    let rect = folding ? getRect(multiDragElement) : dragRect;
	                                    multiDragElement.fromRect = rect;
	                                    // Prepare unfold animation
	                                    toSortable.addAnimationState({
	                                        target: multiDragElement,
	                                        rect: rect
	                                    });
	                                }
	                            });
	                        }
	                        // Multi drag elements are not necessarily removed from the DOM on drop, so to reinsert
	                        // properly they must all be removed
	                        removeMultiDragElements();
	                        multiDragElements.forEach((multiDragElement)=>{
	                            if (children[multiDragIndex]) {
	                                parentEl.insertBefore(multiDragElement, children[multiDragIndex]);
	                            } else {
	                                parentEl.appendChild(multiDragElement);
	                            }
	                            multiDragIndex++;
	                        });
	                        // If initial folding is done, the elements may have changed position because they are now
	                        // unfolding around dragEl, even though dragEl may not have his index changed, so update event
	                        // must be fired here as Sortable will not.
	                        if (oldIndex === index(dragEl)) {
	                            let update = false;
	                            multiDragElements.forEach((multiDragElement)=>{
	                                if (multiDragElement.sortableIndex !== index(multiDragElement)) {
	                                    update = true;
	                                    return;
	                                }
	                            });
	                            if (update) {
	                                dispatchSortableEvent('update');
	                                dispatchSortableEvent('sort');
	                            }
	                        }
	                    }
	                    // Must be done after capturing individual rects (scroll bar)
	                    multiDragElements.forEach((multiDragElement)=>{
	                        unsetRect(multiDragElement);
	                    });
	                    toSortable.animateAll();
	                }
	                multiDragSortable = toSortable;
	            }
	            // Remove clones if necessary
	            if (rootEl === parentEl || putSortable && putSortable.lastPutMode !== 'clone') {
	                multiDragClones.forEach((clone)=>{
	                    clone.parentNode && clone.parentNode.removeChild(clone);
	                });
	            }
	        },
	        nullingGlobal () {
	            this.isMultiDrag = dragStarted = false;
	            dragEl = null;
	            multiDragClones.length = 0;
	        },
	        destroyGlobal () {
	            this._deselectMultiDrag();
	            off(document, 'pointerup', this._deselectMultiDrag);
	            off(document, 'mouseup', this._deselectMultiDrag);
	            off(document, 'touchend', this._deselectMultiDrag);
	            off(document, 'keydown', this._checkKeyDown);
	            off(document, 'keyup', this._checkKeyUp);
	        },
	        _deselectMultiDrag (evt) {
	            if (typeof dragStarted !== 'undefined' && dragStarted) return;
	            // Only deselect if selection is in this sortable
	            if (multiDragSortable !== this.sortable) return;
	            // Only deselect if target is not item in this sortable
	            if (evt && closest(evt.target, this.options.draggable, this.sortable.el, false)) return;
	            // Only deselect if left click
	            if (evt && evt.button !== 0) return;
	            while(multiDragElements.length){
	                let el = multiDragElements[0];
	                toggleClass(el, this.options.selectedClass, false);
	                multiDragElements.shift();
	                dispatchEvent({
	                    sortable: this.sortable,
	                    rootEl: this.sortable.el,
	                    name: 'deselect',
	                    targetEl: el,
	                    originalEvent: evt
	                });
	            }
	        },
	        _checkKeyDown (evt) {
	            if (evt.key === this.options.multiDragKey) {
	                this.multiDragKeyDown = true;
	            }
	        },
	        _checkKeyUp (evt) {
	            if (evt.key === this.options.multiDragKey) {
	                this.multiDragKeyDown = false;
	            }
	        }
	    };
	    return Object.assign(MultiDrag, {
	        // Static methods & properties
	        pluginName: 'multiDrag',
	        utils: {
	            /**
				 * Selects the provided multi-drag item
				 * @param  {HTMLElement} el    The element to be selected
				 */ select (el) {
	                let sortable = el.parentNode[expando];
	                if (!sortable || !sortable.options.multiDrag || ~multiDragElements.indexOf(el)) return;
	                if (multiDragSortable && multiDragSortable !== sortable) {
	                    multiDragSortable.multiDrag._deselectMultiDrag();
	                    multiDragSortable = sortable;
	                }
	                toggleClass(el, sortable.options.selectedClass, true);
	                multiDragElements.push(el);
	            },
	            /**
				 * Deselects the provided multi-drag item
				 * @param  {HTMLElement} el    The element to be deselected
				 */ deselect (el) {
	                let sortable = el.parentNode[expando], index = multiDragElements.indexOf(el);
	                if (!sortable || !sortable.options.multiDrag || !~index) return;
	                toggleClass(el, sortable.options.selectedClass, false);
	                multiDragElements.splice(index, 1);
	            }
	        },
	        eventProperties () {
	            const oldIndicies = [], newIndicies = [];
	            multiDragElements.forEach((multiDragElement)=>{
	                oldIndicies.push({
	                    multiDragElement,
	                    index: multiDragElement.sortableIndex
	                });
	                // multiDragElements will already be sorted if folding
	                let newIndex;
	                if (folding && multiDragElement !== dragEl) {
	                    newIndex = -1;
	                } else if (folding) {
	                    newIndex = index(multiDragElement, ':not(.' + this.options.selectedClass + ')');
	                } else {
	                    newIndex = index(multiDragElement);
	                }
	                newIndicies.push({
	                    multiDragElement,
	                    index: newIndex
	                });
	            });
	            return {
	                items: [
	                    ...multiDragElements
	                ],
	                clones: [
	                    ...multiDragClones
	                ],
	                oldIndicies,
	                newIndicies
	            };
	        },
	        optionListeners: {
	            multiDragKey (key) {
	                key = key.toLowerCase();
	                if (key === 'ctrl') {
	                    key = 'Control';
	                } else if (key.length > 1) {
	                    key = key.charAt(0).toUpperCase() + key.substr(1);
	                }
	                return key;
	            }
	        }
	    });
	}
	function insertMultiDragElements(clonesInserted, rootEl) {
	    multiDragElements.forEach((multiDragElement, i)=>{
	        let target = rootEl.children[multiDragElement.sortableIndex + (clonesInserted ? Number(i) : 0)];
	        if (target) {
	            rootEl.insertBefore(multiDragElement, target);
	        } else {
	            rootEl.appendChild(multiDragElement);
	        }
	    });
	}
	/**
	 * Insert multi-drag clones
	 * @param  {Boolean} elementsInserted  Whether the multi-drag elements are inserted
	 * @param  {HTMLElement} rootEl
	 */ function insertMultiDragClones(elementsInserted, rootEl) {
	    multiDragClones.forEach((clone, i)=>{
	        let target = rootEl.children[clone.sortableIndex + (elementsInserted ? Number(i) : 0)];
	        if (target) {
	            rootEl.insertBefore(clone, target);
	        } else {
	            rootEl.appendChild(clone);
	        }
	    });
	}
	function removeMultiDragElements() {
	    multiDragElements.forEach((multiDragElement)=>{
	        if (multiDragElement === dragEl) return;
	        multiDragElement.parentNode && multiDragElement.parentNode.removeChild(multiDragElement);
	    });
	}

	SortableCtor.mount(new AutoScrollPlugin());
	SortableCtor.mount(Remove, Revert);

	// Mount plugins in a single call
	SortableCtor.mount(new SwapPlugin(), new MultiDragPlugin());

	return SortableCtor;

}));
//# sourceMappingURL=Sortable.js.map

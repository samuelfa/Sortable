import { getSwapDirection } from "./swap/getSwapDirection.js";
import { getDefaultOptions, resolveOptions } from "./defaultOptions";
// @ts-check
/**!
 * Sortable
 * @author	RubaXa   <trash@rubaxa.org>
 * @author	owenm    <owen23355@gmail.com>
 * @license MIT
 */

import { version } from '../package.json';

import {
	IE11OrLess,
	Edge,
	FireFox,
	Safari,
	IOS,
	ChromeForAndroid,
} from './BrowserInfo.js';

import AnimationStateManager from './Animation.js';

import PluginManager from './PluginManager.js';

import dispatchEvent from './EventDispatcher.js';

import {
	on,
	off,
	closest,
	toggleClass,
	css,
	matrix,
	find,
	getWindowScrollingElement,
	getRect,
	isScrolledPast,
	getChild,
	lastChild,
	index,
	getRelativeScrollOffset,
	extend,
	throttle,
	scrollBy,
	clone,
	expando,
	getChildContainingRectFromElement,
	getParentOrHost,
} from './utils.js';

import type { Sortable, SortableConstructor } from './types.js';
import {
	getDragEl,
	setDragEl,
	getParentEl,
	setParentEl,
	getGhostEl,
	setGhostEl,
	getRootEl,
	setRootEl,
	getNextEl,
	setNextEl,
	getLastDownEl,
	setLastDownEl,
	getCloneEl,
	setCloneEl,
	isCloneHidden,
	setCloneHidden,
	getOldIndex,
	setOldIndex,
	getNewIndex,
	setNewIndex,
	getOldDraggableIndex,
	setOldDraggableIndex,
	getNewDraggableIndex,
	setNewDraggableIndex,
	getActiveGroup,
	setActiveGroup,
	getPutSortable,
	setPutSortable,
	isAwaitingDragStarted,
	setAwaitingDragStarted,
	isIgnoreNextClick,
	setIgnoreNextClick,
	getSortables,
	addSortable,
	removeSortable,
	getTapEvt,
	setTapEvt,
	getTouchEvt,
	setTouchEvt,
	getLastDx,
	setLastDx,
	getLastDy,
	setLastDy,
	getTapDistanceLeft,
	setTapDistanceLeft,
	getTapDistanceTop,
	setTapDistanceTop,
	isMoved,
	setMoved,
	getLastTarget,
	setLastTarget,
	getLastDirection,
	setLastDirection,
	isPastFirstInvertThresh,
	setPastFirstInvertThresh,
	isCircumstantialInvert,
	setCircumstantialInvert,
	getTargetMoveDistance,
	setTargetMoveDistance,
	getGhostRelativeParent,
	setGhostRelativeParent,
	getGhostRelativeParentInitialScroll,
	setGhostRelativeParentInitialScroll,
	isSilent,
	setSilent,
	getSavedInputChecked,
	setSavedInputChecked,
} from './state.js';

import {
	documentExists,
	supportDraggable,
	supportCssPointerEvents,
	expandoProperty,
} from './constants.js';

import {
	detectDirection,
	dragElInRowColumn,
	detectNearestEmptySortable,
	prepareGroup,
	hideGhostForTarget,
	unhideGhostForTarget,
	setupClickPrevention,
	globalDragOver,
	onMove,
	disableDraggable,
	unsilent,
	ghostIsFirst,
	ghostIsLast,
	
} from './sortable-utils.js';

// Setup click prevention
setupClickPrevention(documentExists, ChromeForAndroid);

// Global state is now managed through state.ts

let pluginEvent = function (
	eventName: string,
	sortable: Sortable,
	data: any = {}
) {
	PluginManager.pluginEvent.bind(Sortable)(eventName, sortable, {
		dragEl: getDragEl(),
		parentEl: getParentEl(),
		ghostEl: getGhostEl(),
		rootEl: getRootEl(),
		nextEl: getNextEl(),
		lastDownEl: getLastDownEl(),
		cloneEl: getCloneEl(),
		cloneHidden: isCloneHidden(),
		dragStarted: isMoved(),
		putSortable: getPutSortable(),
		activeSortable: (Sortable as any).active,
		originalEvent: data.evt,

		oldIndex: getOldIndex(),
		oldDraggableIndex: getOldDraggableIndex(),
		newIndex: getNewIndex(),
		newDraggableIndex: getNewDraggableIndex(),

		hideGhostForTarget: hideGhostForTarget,
		unhideGhostForTarget: unhideGhostForTarget,

		cloneNowHidden() {
			setCloneHidden(true);
		},
		cloneNowShown() {
			setCloneHidden(false);
		},

		dispatchSortableEvent(name: string) {
			_dispatchEvent({ sortable, name, originalEvent: data.evt });
		},

		...data,
	});
};

function _dispatchEvent(info: any): void {
	dispatchEvent({
		putSortable: getPutSortable(),
		cloneEl: getCloneEl(),
		targetEl: getDragEl(),
		rootEl: getRootEl(),
		oldIndex: getOldIndex(),
		oldDraggableIndex: getOldDraggableIndex(),
		newIndex: getNewIndex(),
		newDraggableIndex: getNewDraggableIndex(),
		...info,
	});
}

// #1184 fix - Prevent click event on fallback if dragged but item not changed position
if (documentExists && !ChromeForAndroid) {
	document.addEventListener(
		'click',
		function (evt: Event) {
			if (isIgnoreNextClick()) {
				evt.preventDefault();
				evt.stopPropagation?.();
				evt.stopImmediatePropagation?.();
				setIgnoreNextClick(false);
				return false;
			}
		},
		true
	);
}

let nearestEmptyInsertDetectEvent = function (evt: Event): void {
	if (!getDragEl()) return;

	evt = evt.touches ? evt.touches[0] : evt;
	let nearest = detectNearestEmptySortable(
		evt.clientX,
		evt.clientY,
		getSortables(),
		expandoProperty,
		getRect
	);

	if (nearest) {
		let event: any = Object.create(evt);
		if ("clientX" in evt && "clientY" in evt) {
			event.clientX = (evt as MouseEvent).clientX;
			event.clientY = (evt as MouseEvent).clientY;
			event.pageX = (evt as MouseEvent).pageX;
			event.pageY = (evt as MouseEvent).pageY;
		} else if ("touches" in evt && (evt as TouchEvent).touches?.length > 0) {
			const touch = (evt as TouchEvent).touches[0];
			event.clientX = touch.clientX;
			event.clientY = touch.clientY;
			event.pageX = touch.pageX;
			event.pageY = touch.pageY;
		} else {
			console.warn("[Sortable] Imitação de evento en nearestEmptyInsertDetectEvent abortada: sin coordenadas geométricas válidas en evt.");
			return;
		}
		event.target = event.rootEl = nearest;
		nearest[expandoProperty]._onDragOver(event);
	}
};

let checkOutsideTargetEl = function (evt: Event): void {
	if (getDragEl() && getDragEl().parentNode) {
		(getDragEl().parentNode as any)[expandoProperty]._isOutsideThisEl(evt.target);
	}
};

/**
 * @class  Sortable
 * @param  {HTMLElement}  el
 * @param  {Object}       [options]
 */
function Sortable(this: SortableConstructor, el: HTMLElement, options: any = {}) {
	if (!(el && el.nodeType && el.nodeType === 1)) {
		throw `Sortable: \`el\` must be an HTMLElement, not ${{}.toString.call(el)}`;
	
    // Attach event listeners explicitly to instance element
    if (this.el && typeof this.el.addEventListener === "function") {
      this._onDragStart = this._onDragStart.bind(this);
      this._onDragOver = this._onDragOver.bind(this);
      this._onDragEnd = this._onDragEnd.bind(this);
      this._onDrop = this._onDrop.bind(this);

      this.el.addEventListener("dragstart", this._onDragStart, false);
      this.el.addEventListener("dragover", this._onDragOver, true);
		document.addEventListener("dragover", this._onDragOver, true);
      this.el.addEventListener("dragend", this._onDragEnd, false);
      this.el.addEventListener("drop", this._onDrop, false);
    }

}

	this.el = el; // root element
	this.options = options = Object.assign({}, options);

	// Export instance
	el[expandoProperty] = this;

	const defaults = getDefaultOptions(el);
		options = resolveOptions(el, options);

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

	// Export
	addSortable(this as any);
}

// Sortable prototype methods
Sortable.prototype = {
	constructor: Sortable,

	_onDragStart: function (evt: Event) {
		const dragEl = evt.target as HTMLElement;
		(Sortable as any).dragged = dragEl;
		(this as any).dragEl = dragEl;
		let target = evt.target as HTMLElement | null;
		if (!target) { console.warn("[Sortable] _onDragStart abortado: evento emitido sin target válido."); return; }

		const container = this.el;
		while (target && target.parentNode !== container) {
			target = target.parentNode as HTMLElement | null;
		}

		if (target) {
			target.draggable = true;
			(Sortable as any).dragged = target;
			(Sortable as any).active = this;
			(this as any).dragEl = target;
			if (typeof setDragEl === "function") setDragEl(target);
			document.addEventListener("dragover", globalDragOver, false);
		}
	},

	_onDragOver: function (evt: Event) {
		if (evt.cancelable) {
			evt.preventDefault();
		}

		const dragEl = (Sortable as any).dragged || (this as any).dragEl;
		if (!dragEl) {
			console.warn("[Sortable] _onDragOver abortado: dragEl no definido o nulo.");
			return;
		}

		let target = evt.target as HTMLElement | null;
		if (!target) {
			console.warn("[Sortable] _onDragOver abortado: target nulo en el evento.");
			return;
		}

		const container = this.el;
		while (target && target.parentNode !== container) {
			target = target.parentNode as HTMLElement | null;
		}

		if (!target) {
			console.warn("[Sortable] _onDragOver abortado: el elemento target está fuera del contenedor actual.", { container, originalTarget: evt.target });
			return;
		}

		if (target === dragEl) {
			console.warn("[Sortable] _onDragOver ignorado: target es idéntico a dragEl.");
			return;
		}

		const activeEl = (Sortable as any).ghost || dragEl;
		const targetRect = target.getBoundingClientRect();
		const vertical = this.options.direction ? this.options.direction === "vertical" : true;

		const direction = getSwapDirection(
			evt,
			target,
			targetRect,
			vertical,
			this.options.swapThreshold ?? 1,
			this.options.invertedSwapThreshold ?? 1,
			this.options.invertSwap ?? false,
			false
		);

		if (direction === 1) {
			const next = target.nextSibling;
			if (next !== activeEl) {
				const parent = target.parentNode || container;
				parent.insertBefore(activeEl, next);
				if (activeEl !== dragEl) {
					parent.insertBefore(dragEl, next);
				}
			} else {
				console.warn("[Sortable] Swap dirección 1 omitido: target.nextSibling es el elemento activo.", { target: target.textContent, activeEl: activeEl.textContent });
			}
		} else if (direction === -1) {
			if (target !== activeEl) {
				const parent = target.parentNode || container;
				parent.insertBefore(activeEl, target);
				if (activeEl !== dragEl) {
					parent.insertBefore(dragEl, target);
				}
			} else {
				console.warn("[Sortable] Swap dirección -1 omitido: target es el elemento activo.", { target: target.textContent, activeEl: activeEl.textContent });
			}
		} else {
			console.warn("[Sortable] Swap omitido: direction evaluada a 0 para target.", { target: target.textContent, dragEl: dragEl.textContent });
		}
	},
	_onDragEnd: function (evt: Event) {
		(Sortable as any).dragged = null;
		(Sortable as any).active = null;
		(this as any).dragEl = null;
	},
	_onDrop: function (evt: Event) {
		evt.preventDefault && evt.preventDefault();
		(Sortable as any).dragged = null;
		(Sortable as any).active = null;
		(this as any).dragEl = null;
	},
	_onSelectStart: function (evt: Event) {
		evt.preventDefault && evt.preventDefault();
	},

	_isOutsideThisEl: function (target: HTMLElement): boolean {
		return !this.el.contains(target);
	},
};

// Static properties
(Sortable as any).active = null;
(Sortable as any).dragged = null;
(Sortable as any).ghost = null;
(Sortable as any).clone = null;
(Sortable as any).cloneId = 0;
(Sortable as any).eventCanceled = () => false;
(Sortable as any).supportPointer = false;
(Sortable as any)._dragStartTimer = null;
(Sortable as any)._dragStartId = null;
(Sortable as any)._dragStarted = function () {};
(Sortable as any)._lastX = 0;
(Sortable as any)._lastY = 0;
(Sortable as any)._loopId = 0;
(Sortable as any)._captureAnimationState = () => {};
(Sortable as any)._animateAll = () => {};
(Sortable as any).animate = () => {};
(Sortable as any).captureAnimationState = () => {};
(Sortable as any).animateAll = () => {};
(Sortable as any).lastPutMode = null;

const SortableCtor: SortableConstructor = Sortable as any;
export default SortableCtor;
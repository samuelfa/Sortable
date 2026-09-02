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

import type { Sortable } from './types.js';
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
	checkOutsideTargetEl,
	globalDragOver,
	onMove,
	disableDraggable,
	unsilent,
	ghostIsFirst,
	ghostIsLast,
	getSwapDirection,
} from './sortable-utils.js';

import { _globalDragOver, _onMove, _disableDraggable, _unsilent, _ghostIsFirst, _ghostIsLast, _getSwapDirection } from './global-events.js';

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
		activeSortable: Sortable.active,
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
		// Create imitation event
		let event: any = {};
		for (let i in evt) {
			if (Object.prototype.hasOwnProperty.call(evt, i)) {
				event[i] = evt[i];
			}
		}
		event.target = event.rootEl = nearest;
		event.preventDefault = void 0;
		event.stopPropagation = void 0;
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
	}

	this.el = el; // root element
	this.options = options = Object.assign({}, options);

	// Export instance
	el[expandoProperty] = this;

	const defaults: any = {
		group: null,
		sort: true,
		disabled: false,
		store: null,
		handle: null,
		draggable: /^[uo]l$/i.test(el.nodeName) ? '>li' : '>*',
		swapThreshold: 1, // percentage; 0 <= x <= 1
		invertSwap: false, // invert always
		invertedSwapThreshold: null, // will be set to same as swapThreshold if default
		removeCloneOnHide: true,
		direction: function () {
			return detectDirection(el, this.options);
		},
		ghostClass: 'sortable-ghost',
		chosenClass: 'sortable-chosen',
		dragClass: 'sortable-drag',
		ignore: 'a, img',
		filter: null,
		preventOnFilter: true,
		animation: 0,
		easing: null,
	};

	// Assign defaults
	for (const key in defaults) {
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

	// Export
	sortables.push(this);
}

// Sortable prototype methods
Sortable.prototype = {
	constructor: Sortable,

	_onDragStart: function (evt: Event) {
		// ... implementation
	},

	_onDragOver: function (evt: Event) {
		// ... implementation
	},

	_onDragEnd: function (evt: Event) {
		// ... implementation
	},

	_onDrop: function (evt: Event) {
		// ... implementation
	},

	_onSelectStart: function (evt: Event) {
		// ... implementation
	},

	_isOutsideThisEl: function (target: HTMLElement): boolean {
		return !this.el.contains(target);
	},
};

// Static properties
Sortable.active = null;
Sortable.dragged = null;
Sortable.ghost = null;
Sortable.clone = null;
Sortable.cloneId = 0;
Sortable.eventCanceled = () => false;
Sortable.supportPointer = false;
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._dragStarted = function () {};
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable._captureAnimationState = () => {};
Sortable._animateAll = () => {};
Sortable.animate = () => {};
Sortable.captureAnimationState = () => {};
Sortable.animateAll = () => {};
Sortable.lastPutMode = null;
Sortable._onDragOver = () => {};
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable.captureAnimationState = () => {};
Sortable.animateAll = () => {};
Sortable.animate = () => {};
Sortable.lastPutMode = null;
Sortable._onDragOver = () => {};
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable.eventCanceled = () => false;
Sortable.cloneId = 0;
Sortable.supportPointer = false;
Sortable.ghost = null;
Sortable.clone = null;
Sortable.dragged = null;
Sortable.active = null;
Sortable._dragStarted = () => {};
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable.captureAnimationState = () => {};
Sortable.animateAll = () => {};
Sortable.animate = () => {};
Sortable.lastPutMode = null;
Sortable._onDragOver = () => {};
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable.eventCanceled = () => false;
Sortable.cloneId = 0;
Sortable.supportPointer = false;
Sortable.ghost = null;
Sortable.clone = null;
Sortable.dragged = null;
Sortable.active = null;
Sortable._dragStarted = () => {};
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable.captureAnimationState = () => {};
Sortable.animateAll = () => {};
Sortable.animate = () => {};
Sortable.lastPutMode = null;
Sortable._onDragOver = () => {};
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable.eventCanceled = () => false;
Sortable.cloneId = 0;
Sortable.supportPointer = false;
Sortable.ghost = null;
Sortable.clone = null;
Sortable.dragged = null;
Sortable.active = null;
Sortable._dragStarted = () => {};
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable.captureAnimationState = () => {};
Sortable.animateAll = () => {};
Sortable.animate = () => {};
Sortable.lastPutMode = null;
Sortable._onDragOver = () => {};
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable.eventCanceled = () => false;
Sortable.cloneId = 0;
Sortable.supportPointer = false;
Sortable.ghost = null;
Sortable.clone = null;
Sortable.dragged = null;
Sortable.active = null;
Sortable._dragStarted = () => {};
Sortable._dragStartTimer = null;
Sortable._dragStartId = null;
Sortable._lastX = 0;
Sortable._lastY = 0;
Sortable._loopId = 0;
Sortable.captureAnimationState = () => {};
Sortable.animateAll = () => {};
Sortable.animate = () => {};
Sortable.lastPutMode = null;
Sortable._onDragOver = () => {};

const SortableCtor: SortableConstructor = Sortable as SortableConstructor;
export { Sortable };
export default SortableCtor;
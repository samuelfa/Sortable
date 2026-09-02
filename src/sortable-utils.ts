import {
	IE11OrLess,
	Edge,
	FireFox,
	Safari,
	IOS,
	ChromeForAndroid,
} from './BrowserInfo.js';
import {
	on,
	off,
	css,
	getRect,
	closest,
	matrix,
	indexOfObject,
	expando,
	getChild,
	lastChild,
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

export function detectDirection(
	el: HTMLElement,
	options: any
): 'vertical' | 'horizontal' {
	const elCSS = css(el);
	const elWidth =
		parseInt(elCSS.width) -
		parseInt(elCSS.paddingLeft) -
		parseInt(elCSS.paddingRight) -
		parseInt(elCSS.borderLeftWidth) -
		parseInt(elCSS.borderRightWidth);
	const child1 = getChild(el, 0, options);
	const child2 = getChild(el, 1, options);
	const firstChildCSS = child1 && css(child1);
	const secondChildCSS = child2 && css(child2);
	const firstChildWidth =
		firstChildCSS &&
		parseInt(firstChildCSS.marginLeft) +
			parseInt(firstChildCSS.marginRight) +
			getRect(child1, false, false, false, undefined).width;
	const secondChildWidth =
		secondChildCSS &&
		parseInt(secondChildCSS.marginLeft) +
			parseInt(secondChildCSS.marginRight) +
			getRect(child2, false, false, false, undefined).width;

	if (elCSS.display === 'flex') {
		return elCSS.flexDirection === 'column' ||
			elCSS.flexDirection === 'column-reverse'
			? 'vertical'
			: 'horizontal';
	}

	if (elCSS.display === 'grid') {
		return elCSS.gridTemplateColumns.split(' ').length <= 1
			? 'vertical'
			: 'horizontal';
	}

	if (child1 && firstChildCSS.float && firstChildCSS.float !== 'none') {
		const touchingSideChild2 =
			firstChildCSS.float === 'left' ? 'left' : 'right';

		return child2 &&
			(secondChildCSS.clear === 'both' ||
				secondChildCSS.clear === touchingSideChild2)
			? 'vertical'
			: 'horizontal';
	}

	const CSSFloatProperty = Edge || IE11OrLess ? 'cssFloat' : 'float';

	return child1 &&
		(firstChildCSS.display === 'block' ||
			firstChildCSS.display === 'flex' ||
			firstChildCSS.display === 'table' ||
			firstChildCSS.display === 'grid' ||
			(firstChildWidth >= elWidth && elCSS[CSSFloatProperty] === 'none') ||
			(child2 &&
				elCSS[CSSFloatProperty] === 'none' &&
				firstChildWidth + secondChildWidth > elWidth))
		? 'vertical'
		: 'horizontal';
}

export function dragElInRowColumn(
	dragRect: DOMRect,
	targetRect: DOMRect,
	vertical: boolean
): boolean {
	const dragElS1Opp = vertical ? dragRect.left : dragRect.top;
	const dragElS2Opp = vertical ? dragRect.right : dragRect.bottom;
	const dragElOppLength = vertical ? dragRect.width : dragRect.height;
	const targetS1Opp = vertical ? targetRect.left : targetRect.top;
	const targetS2Opp = vertical ? targetRect.right : targetRect.bottom;
	const targetOppLength = vertical ? targetRect.width : targetRect.height;

	return (
		dragElS1Opp === targetS1Opp ||
		dragElS2Opp === targetS2Opp ||
		dragElS1Opp + dragElOppLength / 2 ===
			targetS1Opp + targetOppLength / 2
	);
}

export function detectNearestEmptySortable(
	x: number,
	y: number,
	sortables: Sortable[],
	expando: string,
	getRect: (el: HTMLElement) => DOMRect
): Sortable | null {
	let ret: Sortable | null = null;
	sortables.some((sortable) => {
		const threshold = sortable[expando].options.emptyInsertThreshold;
		if (!threshold || lastChild(sortable.el)) return;

		const rect = getRect(sortable.el, false, false, false, undefined);
		const insideHorizontally =
			x >= rect.left - threshold && x <= rect.right + threshold;
		const insideVertically =
			y >= rect.top - threshold && y <= rect.bottom + threshold;

		if (insideHorizontally && insideVertically) {
			return (ret = sortable);
		}
	});
	return ret;
}

export function prepareGroup(options: any): void {
	function toFn(value: any, pull: boolean) {
		return function (
			to: Sortable,
			from: Sortable,
			dragEl: HTMLElement,
			evt: Event
		): any {
			const sameGroup =
				to.options.group.name &&
				from.options.group.name &&
				to.options.group.name === from.options.group.name;

			if (value == null && (pull || sameGroup)) {
				return true;
			} else if (value == null || value === false) {
				return false;
			} else if (pull && value === 'clone') {
				return value;
			} else if (typeof value === 'function') {
				return toFn(value(to, from, dragEl, evt), pull)(
					to,
					from,
					dragEl,
					evt
				);
			} else {
				const otherGroup = (pull ? to : from).options.group.name;
				return (
					value === true ||
					(typeof value === 'string' && value === otherGroup) ||
					(Array.isArray(value) && value.indexOf(otherGroup) > -1)
				);
			}
		}
	}

	const originalGroup = options.group;
	if (!originalGroup || typeof originalGroup != 'object') {
		options.group = { name: originalGroup };
	}

	const group: any = {};
	group.name = originalGroup.name;
	group.checkPull = toFn(originalGroup.pull, true);
	group.checkPut = toFn(originalGroup.put);
	group.revertClone = originalGroup.revertClone;

	options.group = group;
}

export function hideGhostForTarget(
	ghostEl: HTMLElement | null,
	supportCssPointerEvents: boolean
): void {
	if (!supportCssPointerEvents && ghostEl) {
		css(ghostEl, 'display', 'none');
	}
}

export function unhideGhostForTarget(
	ghostEl: HTMLElement | null,
	supportCssPointerEvents: boolean
): void {
	if (!supportCssPointerEvents && ghostEl) {
		css(ghostEl, 'display', '');
	}
}

export function setupClickPrevention(
	documentExists: boolean,
	ChromeForAndroid: boolean
): void {
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
}

export function nearestEmptyInsertDetectEvent(
	evt: Event,
	expando: string
): void {
	if (!getDragEl()) return;

	const normalizedEvt = evt.touches ? evt.touches[0] : evt;
	const nearest = detectNearestEmptySortable(
		normalizedEvt.clientX,
		normalizedEvt.clientY,
		getSortables(),
		expandoProperty,
		getRect
	);

	if (nearest) {
		const event: any = {};
		for (const i in evt) {
			if (Object.prototype.hasOwnProperty.call(evt, i)) {
				event[i] = evt[i];
			}
		}
		event.target = event.rootEl = nearest;
		event.preventDefault = void 0;
		event.stopPropagation = void 0;
		nearest[expando]._onDragOver(event);
	}
}

export function checkOutsideTargetEl(evt: Event): void {
	if (getDragEl() && getDragEl().parentNode) {
		const sortable = (getDragEl().parentNode as any)[expandoProperty];
		if (sortable) {
			sortable._isOutsideThisEl(evt.target);
		}
	}
}

export function globalDragOver(evt: Event): void {
	if (evt.dataTransfer) {
		evt.dataTransfer.dropEffect = 'move';
	}
	evt.cancelable && evt.preventDefault();
}

export function onMove(
	fromEl: HTMLElement,
	toEl: HTMLElement,
	dragEl: HTMLElement,
	dragRect: DOMRect,
	targetEl: HTMLElement | null,
	targetRect: DOMRect | null,
	originalEvent: Event,
	willInsertAfter: boolean
): any {
	const sortable = fromEl[expandoProperty];
	const onMoveFn = sortable.options.onMove;
	let retVal: any;

	if (window.CustomEvent && !IE11OrLess && !Edge) {
		evt = new CustomEvent('move', {
			bubbles: true,
			cancelable: true,
		});
	} else {
		evt = document.createEvent('Event');
		evt.initEvent('move', true, true);
	}

	evt.to = toEl;
	evt.from = fromEl;
	evt.dragged = dragEl;
	evt.draggedRect = dragRect;
	evt.related = targetEl || toEl;
	evt.relatedRect = targetRect || getRect(toEl, false, false, false, undefined);
	evt.willInsertAfter = willInsertAfter;
	evt.originalEvent = originalEvent;

	fromEl.dispatchEvent(evt);

	if (onMoveFn) {
		retVal = onMoveFn.call(sortable, evt, originalEvent);
	}

	return retVal;
}

export function disableDraggable(el: HTMLElement): void {
	el.draggable = false;
}

export function unsilent(): void {
	setSilent(false);
}

export function ghostIsFirst(
	evt: Event,
	vertical: boolean,
	sortable: Sortable,
	ghostEl: HTMLElement | null
): boolean {
	const firstElRect = getRect(
		getChild(sortable.el, 0, sortable.options, true),
		false, false, false, undefined
	);
	const childContainingRect = getChildContainingRectFromElement(
		sortable.el,
		sortable.options,
		ghostEl
	);
	const spacer = 10;

	return vertical
		? evt.clientX < childContainingRect.left - spacer ||
			(evt.clientY < firstElRect.top && evt.clientX < firstElRect.right)
		: evt.clientY < childContainingRect.top - spacer ||
			(evt.clientY < firstElRect.bottom && evt.clientX < firstElRect.left);
}

export function ghostIsLast(
	evt: Event,
	vertical: boolean,
	sortable: Sortable,
	ghostEl: HTMLElement | null
): boolean {
	const lastElRect = getRect(
		lastChild(sortable.el, sortable.options.draggable),
		false, false, false, undefined
	);
	const childContainingRect = getChildContainingRectFromElement(
		sortable.el,
		sortable.options,
		ghostEl
	);
	const spacer = 10;

	return vertical
		? evt.clientX > childContainingRect.right + spacer ||
			(evt.clientY > lastElRect.bottom && evt.clientX > lastElRect.left)
		: evt.clientY > childContainingRect.bottom + spacer ||
			(evt.clientX > lastElRect.right && evt.clientY > lastElRect.top);
}

export function getSwapDirection(
	evt: Event,
	target: HTMLElement,
	targetRect: DOMRect,
	vertical: boolean,
	swapThreshold: number,
	invertedSwapThreshold: number,
	invertSwap: boolean,
	isLastTarget: boolean
): number {
	const mouseOnAxis = vertical ? evt.clientY : evt.clientX;
	const targetLength = vertical ? targetRect.height : targetRect.width;
	const targetS1 = vertical ? targetRect.top : targetRect.left;
	const targetS2 = vertical ? targetRect.bottom : targetRect.right;
	let invert = false;

	if (!invertSwap) {
		if (isLastTarget && getTargetMoveDistance() < targetLength * swapThreshold) {
			if (
				!isPastFirstInvertThresh() &&
				(getLastDirection() === 1
					? mouseOnAxis > targetS1 + (targetLength * invertedSwapThreshold) / 2
					: mouseOnAxis < targetS2 - (targetLength * invertedSwapThreshold) / 2)
			) {
				setPastFirstInvertThresh(true);
			}

			if (!isPastFirstInvertThresh()) {
				if (
					getLastDirection() === 1
						? mouseOnAxis < targetS1 + getTargetMoveDistance()
						: mouseOnAxis > targetS2 - getTargetMoveDistance()
				) {
					return -getLastDirection();
				}
			} else {
				invert = true;
			}
		}
	}

	// Rest of the function would continue here...
	// This is a partial extraction for demonstration
	return 0;
}
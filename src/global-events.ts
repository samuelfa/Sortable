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

let evt: Event | null = null;

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
	evt.relatedRect = targetRect || getRect(toEl);
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
	// _silent = false; // handled by state
}

export function ghostIsFirst(
	evt: Event,
	vertical: boolean,
	sortable: Sortable,
	ghostEl: HTMLElement | null
): boolean {
	const firstElRect = getRect(
		getChild(sortable.el, 0, sortable.options, true)
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
		lastChild(sortable.el, sortable.options.draggable)
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

	// This is a partial extraction for demonstration
	return 0;
}
import type { Sortable } from './types.js';

let dragEl: HTMLElement | null = null;
let parentEl: HTMLElement | null = null;
let ghostEl: HTMLElement | null = null;
let rootEl: HTMLElement | null = null;
let nextEl: HTMLElement | null = null;
let lastDownEl: HTMLElement | null = null;
let cloneEl: HTMLElement | null = null;
let cloneHidden = false;
let oldIndex = 0;
let newIndex = 0;
let oldDraggableIndex = 0;
let newDraggableIndex = 0;
let activeGroup: string | null = null;
let putSortable: Sortable | null = null;
let awaitingDragStarted = false;
let ignoreNextClick = false;
const sortables: Sortable[] = [];
let tapEvt: Event | null = null;
let touchEvt: TouchEvent | null = null;
let lastDx = 0;
let lastDy = 0;
let tapDistanceLeft = 0;
let tapDistanceTop = 0;
let moved = false;
let lastTarget: HTMLElement | null = null;
let lastDirection = '';
let pastFirstInvertThresh = false;
let isCircumstantialInvertValue = false;
let targetMoveDistance = 0;
let ghostRelativeParent: HTMLElement | null = null;
let ghostRelativeParentInitialScroll: number[] = [];
let _silent = false;
const savedInputChecked: HTMLInputElement[] = [];

export function getDragEl(): HTMLElement | null {
	return dragEl;
}
export function setDragEl(el: HTMLElement | null): void {
	dragEl = el;
}

export function getParentEl(): HTMLElement | null {
	return parentEl;
}
export function setParentEl(el: HTMLElement | null): void {
	parentEl = el;
}

export function getGhostEl(): HTMLElement | null {
	return ghostEl;
}
export function setGhostEl(el: HTMLElement | null): void {
	ghostEl = el;
}

export function getRootEl(): HTMLElement | null {
	return rootEl;
}
export function setRootEl(el: HTMLElement | null): void {
	rootEl = el;
}

export function getNextEl(): HTMLElement | null {
	return nextEl;
}
export function setNextEl(el: HTMLElement | null): void {
	nextEl = el;
}

export function getLastDownEl(): HTMLElement | null {
	return lastDownEl;
}
export function setLastDownEl(el: HTMLElement | null): void {
	lastDownEl = el;
}

export function getCloneEl(): HTMLElement | null {
	return cloneEl;
}
export function setCloneEl(el: HTMLElement | null): void {
	cloneEl = el;
}

export function isCloneHidden(): boolean {
	return cloneHidden;
}
export function setCloneHidden(hidden: boolean): void {
	cloneHidden = hidden;
}

export function getOldIndex(): number {
	return oldIndex;
}
export function setOldIndex(index: number): void {
	oldIndex = index;
}

export function getNewIndex(): number {
	return newIndex;
}
export function setNewIndex(index: number): void {
	newIndex = index;
}

export function getOldDraggableIndex(): number {
	return oldDraggableIndex;
}
export function setOldDraggableIndex(index: number): void {
	oldDraggableIndex = index;
}

export function getNewDraggableIndex(): number {
	return newDraggableIndex;
}
export function setNewDraggableIndex(index: number): void {
	newDraggableIndex = index;
}

export function getActiveGroup(): string | null {
	return activeGroup;
}
export function setActiveGroup(group: string | null): void {
	activeGroup = group;
}

export function getPutSortable(): Sortable | null {
	return putSortable;
}
export function setPutSortable(sortable: Sortable | null): void {
	putSortable = sortable;
}

export function isAwaitingDragStarted(): boolean {
	return awaitingDragStarted;
}
export function setAwaitingDragStarted(value: boolean): void {
	awaitingDragStarted = value;
}

export function isIgnoreNextClick(): boolean {
	return ignoreNextClick;
}
export function setIgnoreNextClick(value: boolean): void {
	ignoreNextClick = value;
}

export function getSortables(): Sortable[] {
	return sortables;
}
export function addSortable(sortable: Sortable): void {
	sortables.push(sortable);
}
export function removeSortable(sortable: Sortable): void {
	const idx = sortables.indexOf(sortable);
	if (idx >= 0) sortables.splice(idx, 1);
}

export function getTapEvt(): Event | null {
	return tapEvt;
}
export function setTapEvt(evt: Event | null): void {
	tapEvt = evt;
}

export function getTouchEvt(): TouchEvent | null {
	return touchEvt;
}
export function setTouchEvt(evt: TouchEvent | null): void {
	touchEvt = evt;
}

export function getLastDx(): number {
	return lastDx;
}
export function setLastDx(value: number): void {
	lastDx = value;
}

export function getLastDy(): number {
	return lastDy;
}
export function setLastDy(value: number): void {
	lastDy = value;
}

export function getTapDistanceLeft(): number {
	return tapDistanceLeft;
}
export function setTapDistanceLeft(value: number): void {
	tapDistanceLeft = value;
}

export function getTapDistanceTop(): number {
	return tapDistanceTop;
}
export function setTapDistanceTop(value: number): void {
	tapDistanceTop = value;
}

export function isMoved(): boolean {
	return moved;
}
export function setMoved(value: boolean): void {
	moved = value;
}

export function getLastTarget(): HTMLElement | null {
	return lastTarget;
}
export function setLastTarget(el: HTMLElement | null): void {
	lastTarget = el;
}

export function getLastDirection(): string {
	return lastDirection;
}
export function setLastDirection(dir: string): void {
	lastDirection = dir;
}

export function isPastFirstInvertThresh(): boolean {
	return pastFirstInvertThresh;
}
export function setPastFirstInvertThresh(value: boolean): void {
	pastFirstInvertThresh = value;
}

export function isCircumstantialInvert(): boolean {
	return isCircumstantialInvertValue;
}
export function setCircumstantialInvert(value: boolean): void {
	isCircumstantialInvertValue = value;
}

export function getTargetMoveDistance(): number {
	return targetMoveDistance;
}
export function setTargetMoveDistance(value: number): void {
	targetMoveDistance = value;
}

export function getGhostRelativeParent(): HTMLElement | null {
	return ghostRelativeParent;
}
export function setGhostRelativeParent(el: HTMLElement | null): void {
	ghostRelativeParent = el;
}

export function getGhostRelativeParentInitialScroll(): number[] {
	return ghostRelativeParentInitialScroll;
}
export function setGhostRelativeParentInitialScroll(arr: number[]): void {
	ghostRelativeParentInitialScroll = arr;
}

export function isSilent(): boolean {
	return _silent;
}
export function setSilent(value: boolean): void {
	_silent = value;
}

export function getSavedInputChecked(): HTMLInputElement[] {
	return savedInputChecked;
}
export function setSavedInputChecked(arr: HTMLInputElement[]): void {
	savedInputChecked.length = 0;
	savedInputChecked.push(...arr);
}
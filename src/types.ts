export interface Sortable {
	active: Sortable | null;
	dragged: HTMLElement | null;
	ghost: HTMLElement | null;
	clone: HTMLElement | null;
	cloneId: number;
	eventCanceled: (evt: Event) => boolean;
	supportPointer: boolean;
	_dragStartTimer: ReturnType<typeof setTimeout> | number | null;
	_dragStartId: ReturnType<typeof setTimeout> | number | null;
	_dragStarted: (fallback: boolean, evt: Event) => void;
	_lastX: number;
	_lastY: number;
	_loopId: number;
	_captureAnimationState: () => void;
	_animateAll: () => void;
	animate: (dragEl: HTMLElement, rect: DOMRect) => void;
	captureAnimationState: () => void;
	animateAll: () => void;
	lastPutMode: string | null;
	_onDragOver: (evt: Event) => void;
	evt: any;
	options: any;
}

export interface SortableConstructor {
	new (...args: any[]): Sortable;
	active: Sortable | null;
	dragged: HTMLElement | null;
	ghost: HTMLElement | null;
	clone: HTMLElement | null;
	cloneId: number;
	eventCanceled: (evt: Event) => boolean;
	supportPointer: boolean;
	_dragStartTimer: ReturnType<typeof setTimeout> | number | null;
	_dragStartId: ReturnType<typeof setTimeout> | number | null;
	_dragStarted: (fallback: boolean, evt: Event) => void;
	_lastX: number;
	_lastY: number;
	_loopId: number;
	_captureAnimationState: () => void;
	_animateAll: () => void;
	animate: (dragEl: HTMLElement, rect: DOMRect) => void;
	captureAnimationState: () => void;
	animateAll: () => void;
	lastPutMode: string | null;
	_onDragOver: (evt: Event) => void;
	evt: any;
	options: any;
	expando: string;
	_ghostIsFirst?: (evt: Event, vertical: boolean, sortable: Sortable, ghostEl: HTMLElement | null) => boolean;
	_ghostIsLast?: (evt: Event, vertical: boolean, sortable: Sortable, ghostEl: HTMLElement | null) => boolean;
	_getSwapDirection?: (evt: Event, target: HTMLElement, targetRect: DOMRect, vertical: boolean, swapThreshold: number, invertedSwapThreshold: number, invertSwap: boolean, isLastTarget: boolean) => number;
}

export interface AutoScroll {
	sortable: Sortable;
	options: any;
}

export interface MultiDrag {
	sortable: Sortable;
	options: any;
}

export interface Swap {
	sortable: Sortable;
	options: any;
}

export interface Revert {
	sortable: Sortable;
	options: any;
}

export interface Remove {
	sortable: Sortable;
	options: any;
}

export interface DispatchEventInfo {
	sortable: Sortable;
	rootEl: HTMLElement;
	name: string;
	targetEl?: HTMLElement;
	cloneEl?: HTMLElement;
	toEl?: HTMLElement;
	fromEl?: HTMLElement;
	oldIndex?: number;
	newIndex?: number;
	oldDraggableIndex?: number;
	newDraggableIndex?: number;
	originalEvent?: Event;
	putSortable?: Sortable;
	extraEventProperties?: Record<string, any>;
}

export interface HTMLElement {
	animated?: number | boolean;
	animatingX?: boolean;
	animatingY?: boolean;
	toRect?: DOMRect;
	sortableIndex?: number;
	expando?: any;
	getAttribute(name: string): string | null;
	src?: string;
	href?: string;
	style: CSSStyleDeclaration;
	scrollTop: number;
	scrollLeft: number;
}

export interface Element {
	getAttribute(name: string): string | null;
	animated?: number | boolean;
	style: CSSStyleDeclaration;
}

export interface Window {
	CSSMatrix: any;
	MSCSSMatrix: any;
	Polymer: any;
	jQuery: any;
	Zepto: any;
	__coverage__: any;
	__sortableTestOptions: any;
	selection?: {
		empty: () => void;
	};
}

export interface Document {
	selection?: {
		empty: () => void;
	};
}

export interface Event {
	to?: HTMLElement;
	from?: HTMLElement;
	item?: HTMLElement;
	clone?: HTMLElement;
	oldIndex?: number;
	newIndex?: number;
	oldDraggableIndex?: number;
	newDraggableIndex?: number;
	originalEvent?: Event;
	pullMode?: string | boolean;
	dragged?: HTMLElement;
	draggedRect?: DOMRect;
	related?: HTMLElement;
	relatedRect?: DOMRect;
	willInsertAfter?: boolean;
}

export type SortablePlugin = any;

declare global {
	interface Window {
		Sortable: SortableConstructor;
	}
}
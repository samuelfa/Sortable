export interface Sortable {
    [key: string]: any;
    el: HTMLElement;
    options: any;
    active?: Sortable | null;
    dragged?: HTMLElement | null;
    ghost?: HTMLElement | null;
    clone?: HTMLElement | null;
    cloneId?: number;
    eventCanceled?: (evt: Event) => boolean;
    supportPointer?: boolean;
    _dragStartTimer?: ReturnType<typeof setTimeout> | number | null;
    _dragStartId?: ReturnType<typeof setTimeout> | number | null;
    _dragStarted?: (fallback: boolean, evt: Event) => void;
    _lastX?: number;
    _lastY?: number;
    _loopId?: number;
    _captureAnimationState?: () => void;
    _animateAll?: () => void;
    animate?: (dragEl: HTMLElement, rect: DOMRect) => void;
    captureAnimationState?: () => void;
    animateAll?: () => void;
    lastPutMode?: any;
    _onDragOver?: (evt: Event) => void;
    evt?: any;
}
export interface SortableConstructor {
    [key: string]: any;
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
export type SortablePlugin = any;
declare global {
    interface HTMLElement {
        animated?: any;
        animatingX?: boolean;
        animatingY?: boolean;
        toRect?: DOMRect | null;
        fromRect?: DOMRect | null;
        prevFromRect?: DOMRect | null;
        prevToRect?: DOMRect | null;
        thisAnimationDuration?: number | null;
        animationTime?: number;
        animationResetTimer?: any;
        sortableIndex?: number;
        expando?: any;
        getAttribute(name: string): string | null;
        src?: string;
        href?: string;
        style: CSSStyleDeclaration;
        currentStyle?: CSSStyleDeclaration;
        scrollTop: number;
        scrollLeft: number;
    }
    interface Element {
        getAttribute(name: string): string | null;
        animated?: boolean;
        style: CSSStyleDeclaration;
    }
    interface Window {
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
        Sortable: SortableConstructor;
    }
    interface Document {
        selection?: {
            empty: () => void;
        };
    }
    interface Event {
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
        clientX?: number;
        clientY?: number;
        touches?: TouchList | any[];
        dataTransfer?: DataTransfer | null;
    }
}

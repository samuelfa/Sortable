import { Sortable } from './types.js';
export declare function globalDragOver(evt: Event): void;
export declare function onMove(fromEl: HTMLElement, toEl: HTMLElement, dragEl: HTMLElement, dragRect: DOMRect, targetEl: HTMLElement | null, targetRect: DOMRect | null, originalEvent: Event, willInsertAfter: boolean): any;
export declare function disableDraggable(el: HTMLElement): void;
export declare function unsilent(): void;
export declare function ghostIsFirst(evt: Event, vertical: boolean, sortable: Sortable, ghostEl: HTMLElement | null): boolean;
export declare function ghostIsLast(evt: Event, vertical: boolean, sortable: Sortable, ghostEl: HTMLElement | null): boolean;
export declare function getSwapDirection(evt: Event, target: HTMLElement, targetRect: DOMRect, vertical: boolean, swapThreshold: number, invertedSwapThreshold: number, invertSwap: boolean, isLastTarget: boolean): number;

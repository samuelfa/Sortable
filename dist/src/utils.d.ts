declare function on(el: any, event: any, fn: any): void;
declare function off(el: any, event: any, fn: any): void;
declare function matches(/**HTMLElement*/ el: any, /**String*/ selector: any): any;
declare function getParentOrHost(el: any): any;
declare function closest(
/**HTMLElement*/ el: any, 
/**String*/ selector: any, 
/**HTMLElement*/ ctx: any, includeCTX: any): any;
declare function toggleClass(el: any, name: any, state: any): void;
export declare function css(el: HTMLElement): CSSStyleDeclaration;
export declare function css(el: HTMLElement, prop: string): string;
export declare function css(el: HTMLElement, prop: string, val: string | number): string;
export declare function matrix(el: HTMLElement | Window | string, selfOnly?: boolean): string | DOMMatrix | null;
declare function find(ctx: any, tagName: any, iterator: any): any;
declare function getWindowScrollingElement(): Element | HTMLElement;
/**
 * Returns the "bounding client rect" of given element
 * @param  {HTMLElement} el                       The element whose boundingClientRect is wanted
 * @param  {[Boolean]} relativeToContainingBlock  Whether the rect should be relative to the containing block of (including) the container
 * @param  {[Boolean]} relativeToNonStaticParent  Whether the rect should be relative to the relative parent of (including) the contaienr
 * @param  {[Boolean]} undoScale                  Whether the container's scale() should be undone
 * @param  {[HTMLElement]} container              The parent the element will be placed in
 * @return {Object}                               The boundingClientRect of el, with specified adjustments
 */
declare function getRect(el: HTMLElement | Window, relativeToContainingBlock?: boolean, relativeToNonStaticParent?: boolean, undoScale?: boolean, container?: HTMLElement): DOMRect | null;
/**
 * Returns the content rect of the element (bounding rect minus border and padding)
 * @param {HTMLElement} el
 */
declare function getContentRect(el: HTMLElement): DOMRect;
/**
 * Checks if a side of an element is scrolled past a side of its parents
 * @param  {HTMLElement}  el           The element who's side being scrolled out of view is in question
 * @param  {String}       elSide       Side of the element in question ('top', 'left', 'right', 'bottom')
 * @param  {String}       parentSide   Side of the parent in question ('top', 'left', 'right', 'bottom')
 * @return {HTMLElement}               The parent scroll element that the el's side is scrolled past, or null if there is no such element
 */
declare function isScrolledPast(el: any, elSide: any, parentSide: any): any;
/**
 * Gets nth child of el, ignoring hidden children, sortable's elements (does not ignore clone if it's visible)
 * and non-draggable elements
 * @param  {HTMLElement} el       The parent element
 * @param  {Number} childNum      The index of the child
 * @param  {Object} options       Parent Sortable's options
 * @return {HTMLElement}          The child at index childNum, or null if not found
 */
declare function getChild(el: HTMLElement, childNum?: number, options?: any, includeDragEl?: boolean): HTMLElement | null;
/**
 * Gets the last child in the el, ignoring ghostEl or invisible elements (clones)
 * @param  {HTMLElement} el       Parent element
 * @param  {selector} selector    Any other elements that should be ignored
 * @return {HTMLElement}          The last child, ignoring ghostEl
 */
declare function lastChild(el: HTMLElement, selector?: string): HTMLElement | null;
/**
 * Returns the index of an element within its parent for a selected set of
 * elements
 * @param  {HTMLElement} el
 * @param  {selector} selector
 * @return {number}
 */
declare function index(el: any, selector: any): number;
/**
 * Returns the scroll offset of the given element, added with all the scroll offsets of parent elements.
 * The value is returned in real pixels.
 * @param  {HTMLElement} el
 * @return {Array}             Offsets in the format of [left, top]
 */
declare function getRelativeScrollOffset(el: any): number[];
/**
 * Returns the index of the object within the given array
 * @param  {Array} arr   Array that may or may not hold the object
 * @param  {Object} obj  An object that has a key-value pair unique to and identical to a key-value pair in the object you want to find
 * @return {Number}      The index of the object in the array, or -1
 */
declare function indexOfObject(arr: any, obj: any): number;
declare function getParentAutoScrollElement(el: any, includeSelf: any): any;
declare function extend(dst: any, src: any): any;
declare function isRectEqual(rect1: any, rect2: any): boolean;
declare function throttle(callback: any, ms: any): () => void;
declare function cancelThrottle(): void;
declare function scrollBy(el: any, x: any, y: any): void;
declare function clone(el: any): any;
declare function setRect(el: any, rect: any): void;
declare function unsetRect(el: any): void;
declare function getChildContainingRectFromElement(container: HTMLElement, options: any, ghostEl: HTMLElement | null): DOMRect;
declare const expando: string;
export { on, off, matches, getParentOrHost, closest, toggleClass, find, getWindowScrollingElement, getRect, isScrolledPast, getChild, lastChild, index, getRelativeScrollOffset, indexOfObject, getParentAutoScrollElement, extend, isRectEqual, throttle, cancelThrottle, scrollBy, clone, setRect, unsetRect, getContentRect, getChildContainingRectFromElement, expando, };

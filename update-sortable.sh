#!/usr/bin/env bash
set -e

echo "1. Updating src/swap/getSwapDirection.ts..."
cat << 'FILE_GETSWAP' > src/swap/getSwapDirection.ts
import { getEventCoordinates } from "../geometry/coordinates";
import { swapState } from "../state/SwapState";

export function getSwapDirection(
	evt: any,
	target: HTMLElement,
	targetRect: DOMRect,
	vertical: boolean,
	swapThreshold: number,
	invertedSwapThreshold: number,
	invertSwap: boolean,
	isLastTarget: boolean,
	dragIndex: number,
	targetIndex: number
): number {
	const coords = getEventCoordinates(evt);
	if (!coords) return 0;

	const mouseOnAxis = vertical ? coords.y : coords.x;
	const targetLength = vertical ? targetRect.height : targetRect.width;
	const targetS1 = vertical ? targetRect.top : targetRect.left;
	const targetS2 = vertical ? targetRect.bottom : targetRect.right;

	const thresholdOffset = (targetLength * (1 - swapThreshold)) / 2;
	const isPastThresholdMin = mouseOnAxis >= targetS1 + thresholdOffset;
	const isPastThresholdMax = mouseOnAxis <= targetS2 - thresholdOffset;

	// Mouse is within active swap zone (e.g., 20% to 80%)
	if (isPastThresholdMin && isPastThresholdMax) {
		let direction = 0;

		if (dragIndex < targetIndex) {
			// Moving downward: crossing top threshold triggers insert AFTER
			direction = 1;
		} else if (dragIndex > targetIndex) {
			// Moving upward: crossing bottom threshold triggers insert BEFORE
			direction = -1;
		}

		if (invertSwap) {
			direction *= -1;
		}

		if (swapState) {
			swapState.setLastDirection(direction);
		}

		return direction;
	}

	return 0;
}
FILE_GETSWAP

echo "2. Updating src/Sortable.ts..."
cat << 'FILE_SORTABLE' > src/Sortable.ts
import { getSwapDirection } from "./swap/getSwapDirection";

const expando = 'Sortable' + new Date().getTime();

function getIndex(el: HTMLElement): number {
	let index = 0;
	if (!el || !el.parentNode) return -1;
	let child: HTMLElement | null = el;
	while ((child = child.previousElementSibling as HTMLElement | null)) {
		index++;
	}
	return index;
}

export default class Sortable {
	el: HTMLElement;
	options: any;

	static version = "1.15.7";
	static dragged: HTMLElement | null = null;
	static ghost: HTMLElement | null = null;
	static active: Sortable | null = null;
	static clone: HTMLElement | null = null;

	static get(el: HTMLElement): Sortable | undefined {
		return (el as any)[expando];
	}

	static create(el: HTMLElement, options?: any): Sortable {
		return new Sortable(el, options);
	}

	static utils = {
		on(el: HTMLElement, event: string, fn: EventListenerOrEventListenerObject) {
			el.addEventListener(event, fn);
		},
		off(el: HTMLElement, event: string, fn: EventListenerOrEventListenerObject) {
			el.removeEventListener(event, fn);
		},
		css(el: HTMLElement, prop: string, val?: string) {
			if (val !== undefined) {
				(el.style as any)[prop] = val;
			}
			return window.getComputedStyle(el)[prop as any];
		},
		index(el: HTMLElement, selector?: string): number {
			let index = 0;
			if (!el || !el.parentNode) return -1;
			let child: HTMLElement | null = el;
			while ((child = child.previousElementSibling as HTMLElement | null)) {
				if (!selector || child.matches(selector)) index++;
			}
			return index;
		}
	};

	constructor(el: HTMLElement, options: any = {}) {
		this.el = el;
		this.options = {
			draggable: ">*",
			dataIdAttr: "data-id",
			direction: "vertical",
			swapThreshold: 1,
			invertSwap: false,
			invertedSwapThreshold: null,
			...options
		};

		(el as any)[expando] = this;

		this._prepareStart = this._prepareStart.bind(this);
		this._onDragStart = this._onDragStart.bind(this);
		this._onDragOver = this._onDragOver.bind(this);
		this._onDragEnd = this._onDragEnd.bind(this);
		this._onDrop = this._onDrop.bind(this);

		this.el.addEventListener("pointerdown", this._prepareStart);
		this.el.addEventListener("mousedown", this._prepareStart);
		this.el.addEventListener("touchstart", this._prepareStart);

		this.el.addEventListener("dragstart", this._onDragStart);
		this.el.addEventListener("dragover", this._onDragOver);
		this.el.addEventListener("dragend", this._onDragEnd);
		this.el.addEventListener("drop", this._onDrop);
	}

	option(name: string, value?: any): any {
		if (value === undefined) {
			return this.options[name];
		}
		this.options[name] = value;
	}

	destroy() {
		this.el.removeEventListener("pointerdown", this._prepareStart);
		this.el.removeEventListener("mousedown", this._prepareStart);
		this.el.removeEventListener("touchstart", this._prepareStart);

		this.el.removeEventListener("dragstart", this._onDragStart);
		this.el.removeEventListener("dragover", this._onDragOver);
		this.el.removeEventListener("dragend", this._onDragEnd);
		this.el.removeEventListener("drop", this._onDrop);

		delete (this.el as any)[expando];
	}

	toArray(): string[] {
		const order: string[] = [];
		const children = this.el.children;
		for (let i = 0; i < children.length; i++) {
			const el = children[i] as HTMLElement;
			const id = el.getAttribute(this.options.dataIdAttr || "data-id");
			if (id !== null && id !== undefined) {
				order.push(id);
			}
		}
		return order;
	}

	sort(order: string[]) {
		const items: { [key: string]: HTMLElement } = {};
		const children = Array.from(this.el.children) as HTMLElement[];

		children.forEach((el) => {
			const id = el.getAttribute(this.options.dataIdAttr || "data-id");
			if (id) items[id] = el;
		});

		order.forEach((id) => {
			if (items[id]) {
				this.el.appendChild(items[id]);
			}
		});
	}

	save() {
		const store = this.options.store;
		if (store && typeof store.set === "function") {
			store.set(this);
		}
	}

	_prepareStart(evt: Event) {
		let target = evt.target as HTMLElement | null;
		while (target && target.parentNode !== this.el) {
			target = target.parentNode as HTMLElement | null;
		}

		if (target && target !== this.el) {
			target.draggable = true;
			target.setAttribute("draggable", "true");
		}
	}

	_onDragStart(evt: DragEvent) {
		let target = evt.target as HTMLElement;
		while (target && target.parentNode !== this.el) {
			target = target.parentNode as HTMLElement | null;
		}

		if (!target || target === this.el) return;

		target.draggable = true;
		target.setAttribute("draggable", "true");

		Sortable.dragged = target;
		Sortable.active = this;

		if (evt.dataTransfer) {
			evt.dataTransfer.effectAllowed = "move";
			evt.dataTransfer.setData("Text", target.textContent || "");
		}
	}

	_onDragOver(evt: DragEvent) {
		evt.preventDefault();
		if (evt.dataTransfer) {
			evt.dataTransfer.dropEffect = "move";
		}

		const hasClientX = typeof evt.clientX === 'number';
		const hasClientY = typeof evt.clientY === 'number';
		const hasTouches = (evt as any).touches && (evt as any).touches.length > 0;

		if (!hasClientX && !hasClientY && !hasTouches) {
			console.warn("[Sortable] _onDragOver sin coordenadas geométricas", evt);
			return;
		}

		const activeEl = Sortable.dragged;
		if (!activeEl) {
			console.warn("[Sortable] _onDragOver abortado: dragEl no definido.");
			return;
		}

		let target = evt.target as HTMLElement | null;
		while (target && target.parentNode !== this.el) {
			target = target.parentNode as HTMLElement | null;
		}

		if (!target || target === activeEl || target === this.el) return;

		const targetRect = target.getBoundingClientRect();
		const isVertical = this.options.direction !== "horizontal";

		const swapThreshold = typeof this.options.swapThreshold === 'number' ? this.options.swapThreshold : 1;
		const invertedSwapThreshold = typeof this.options.invertedSwapThreshold === 'number' 
			? this.options.invertedSwapThreshold 
			: swapThreshold;

		const dragIndex = getIndex(activeEl);
		const targetIndex = getIndex(target);

		const direction = getSwapDirection(
			evt,
			target,
			targetRect,
			isVertical,
			swapThreshold,
			invertedSwapThreshold,
			!!this.options.invertSwap,
			false,
			dragIndex,
			targetIndex
		);

		if (direction === 0) return;

		if (dragIndex < targetIndex) {
			if (direction === 1) {
				const next = target.nextSibling;
				if (next) {
					this.el.insertBefore(activeEl, next);
				} else {
					this.el.appendChild(activeEl);
				}
			}
		} else if (dragIndex > targetIndex) {
			if (direction === -1) {
				this.el.insertBefore(activeEl, target);
			}
		}
	}

	_onDragEnd() {
		Sortable.dragged = null;
		Sortable.active = null;
	}

	_onDrop(evt: DragEvent) {
		evt.preventDefault();
		Sortable.dragged = null;
		Sortable.active = null;
	}
}
FILE_SORTABLE

echo "3. Running Unit Tests..."
npx vitest run

echo "4. Building Bundle..."
npm run build

echo "5. Running Playwright E2E Tests..."
xvfb-run npx playwright test

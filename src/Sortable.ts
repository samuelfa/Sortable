
import { getSwapDirection } from "./swap/getSwapDirection";
import { prepareGroup } from "./sortable-utils";
import { getEventCoordinates } from "./geometry/coordinates";
import { getParentOrHost } from "./utils";

const expando = 'Sortable' + new Date().getTime();

let __dragOverSeq = 0;
let __isProcessingDragOver = false;
let _silent = false;

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

	static sortables: Sortable[] = [];

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
			group: null,
			sort: true,
			disabled: false,
			store: null,
			handle: null,
			draggable: ">*",
			dataIdAttr: "data-id",
			direction: "vertical",
			swapThreshold: 1,
			invertSwap: false,
			invertedSwapThreshold: null,
			filter: null,
			preventOnFilter: true,
			emptyInsertThreshold: 5,
			...options
		};

		prepareGroup(this.options);

		(el as any)[expando] = this;
		Sortable.sortables.push(this);

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
		if (name === "group") {
			prepareGroup(this.options);
		}
	}

	destroy() {
		const idx = Sortable.sortables.indexOf(this);
		if (idx > -1) {
			Sortable.sortables.splice(idx, 1);
		}

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

	_isOutsideThisEl(target: HTMLElement): void {
		if (!this.el.contains(target) && target !== this.el) {
			// Reset lastTarget when target is outside this sortable's container
			// This allows the drag to be handled by other sortables
		}
	}

	_prepareStart(evt: Event) {
		if (this.options.disabled) return;

		let target = evt.target as HTMLElement | null;
		while (target && target.parentNode !== this.el) {
			if ((target as any)[expando]) {
				return;
			}
			target = target.parentNode as HTMLElement | null;
		}

                console.log("🔍 [Sortable Telemetry]", {
                        targetTag: target?.tagName,
                        isContainer: target === this.el,
                        isActiveEl: target === Sortable.dragged
                });

		if (target && target !== this.el) {
			if (this.options.handle) {
				const handleEl = (evt.target as HTMLElement).closest(this.options.handle);
				if (!handleEl || !target.contains(handleEl)) {
					target.draggable = false;
					target.removeAttribute("draggable");
					(this as any)._dragAllowed = false;
					return;
				}
			}

			if (this.options.filter) {
				const filter = this.options.filter;
				let match = false;
				if (typeof filter === "function") {
					match = filter(evt, target, this);
				} else if (typeof filter === "string") {
					match = !!(evt.target as HTMLElement).closest(filter);
				}
				if (match) {
					if (this.options.preventOnFilter !== false && evt.preventDefault) {
						evt.preventDefault();
					}
					target.draggable = false;
					target.removeAttribute("draggable");
					(this as any)._dragAllowed = false;
					return;
				}
			}

			(this as any)._dragAllowed = true;
			target.draggable = true;
			target.setAttribute("draggable", "true");

			if (this.options.forceFallback) {
				const startCoords = getEventCoordinates(evt);
				const startX = startCoords ? startCoords.x : 0;
				const startY = startCoords ? startCoords.y : 0;
				const capturedTarget = target;

				const _onMove = (moveEvt: any) => {
					const coords = getEventCoordinates(moveEvt);
					if (!coords) return;

					if (!Sortable.dragged && capturedTarget) {
						const dx = Math.abs(coords.x - startX);
						const dy = Math.abs(coords.y - startY);
						if (dx >= 2 || dy >= 2) {
							Sortable.dragged = capturedTarget;
							Sortable.active = this;
							Sortable.clone = null;
						}
					}

					if (Sortable.dragged) {
						const prevPointerEvents = Sortable.dragged.style.pointerEvents;
						Sortable.dragged.style.pointerEvents = "none";
						const elFromPoint = document.elementFromPoint(coords.x, coords.y) as HTMLElement | null;
						Sortable.dragged.style.pointerEvents = prevPointerEvents;

						if (elFromPoint) {
							const simulatedEvt: any = {
								clientX: coords.x,
								clientY: coords.y,
								target: elFromPoint,
								preventDefault() {},
								dataTransfer: { dropEffect: "move" }
							};

							console.error(`[FALLBACK] TRIGGERED coords=(${coords.x},${coords.y}) elFromPoint=${elFromPoint.tagName}`);

							// Check if target is outside the sortable that owns the dragged element (like JS _isOutsideThisEl)
							const dragged = Sortable.dragged;
							if (dragged && dragged.parentNode) {
								const draggedSortable = (dragged.parentNode as any)[expando];
								if (draggedSortable && draggedSortable._isOutsideThisEl) {
									draggedSortable._isOutsideThisEl(elFromPoint);
								}
							}

							// Traversia de cadena de padres (como JS original _emulateDragOver)
							let target = elFromPoint;
							let parent = target;
							while (target && target.shadowRoot) {
								target = target.shadowRoot.elementFromPoint(coords.x, coords.y) as HTMLElement | null;
								if (target === parent) break;
								parent = target;
							}

							// Walk up parent chain calling _onDragOver on each Sortable (like JS _emulateDragOver do...while)
							let current = parent;
							let depth = 0;
							if (current) {
								do {
									const sortable = (current as any)[expando];
									if (sortable) {
										// DEBUG
										console.error(`[FALLBACK DEBUG] depth=${depth}, sortable.el.id=${sortable.el.id}, current.id=${current.id}, rootEl=${sortable.el.id}`);
										// Pasar rootEl para que _onDragOver sepa en qué contenedor actuar (como JS original)
										const evtWithRoot = { ...simulatedEvt, rootEl: current };
										const inserted = sortable._onDragOver(evtWithRoot);
										if (inserted && !sortable.options.dragoverBubble) {
											break;
										}
									}
									current = getParentOrHost(current);
									depth++;
								} while (current);
							}
						}
					}
				};

				const _onUp = () => {
					document.removeEventListener("mousemove", _onMove);
					document.removeEventListener("mouseup", _onUp);
					document.removeEventListener("touchmove", _onMove);
					document.removeEventListener("touchend", _onUp);
					document.removeEventListener("pointermove", _onMove);
					document.removeEventListener("pointerup", _onUp);

					if (Sortable.dragged) {
						this._onDragEnd();
					}
				};

				document.addEventListener("mousemove", _onMove);
				document.addEventListener("mouseup", _onUp);
				document.addEventListener("touchmove", _onMove);
				document.addEventListener("touchend", _onUp);
				document.addEventListener("pointermove", _onMove);
				document.addEventListener("pointerup", _onUp);
			}
		}
	}

	_onDragStart(evt: DragEvent) {
                console.log("🏁 [_onDragStart]", { targetTag: (evt.target as HTMLElement)?.tagName });
		if (this.options.disabled) {
			evt.preventDefault();
			return;
		}

		if ((this as any)._dragAllowed === false) {
			evt.preventDefault();
			return;
		}

		let target = evt.target as HTMLElement | null;
		while (target && target.parentNode !== this.el) {
			if ((target as any)[expando]) {
				return;
			}
			target = target.parentNode as HTMLElement | null;
		}

		if (!target || target === this.el) {
			evt.preventDefault();
			return;
		}

		target.draggable = true;
		target.setAttribute("draggable", "true");

		Sortable.dragged = target;
		Sortable.active = this;
		Sortable.clone = null;

		if (evt.dataTransfer) {
			evt.dataTransfer.effectAllowed = "move";
			evt.dataTransfer.setData("Text", target.textContent || "");
		}
	}

	_onDragOver(evt: DragEvent) {
                const seq = ++__dragOverSeq;
                const now = typeof performance !== "undefined" ? performance.now().toFixed(2) : Date.now();
                const overlapping = __isProcessingDragOver;
                __isProcessingDragOver = true;

                console.log("🔥 [ACTIVATION #" + seq + "] type: " + evt.type + " | target: " + (evt.target as HTMLElement)?.tagName + " | time: " + (typeof performance !== "undefined" ? performance.now().toFixed(2) : Date.now()) + "ms");
                
                // Asegurarnos de liberar el flag al salir o usar un try/finally implícito con un setTimeout/microtask
                setTimeout(() => { __isProcessingDragOver = false; }, 0);
                console.log("🚀 [_onDragOver START]", {
                        clientX: (evt as any).clientX,
                        clientY: (evt as any).clientY,
                        targetTag: (evt.target as HTMLElement)?.tagName,
                        targetText: (evt.target as HTMLElement)?.textContent?.trim().slice(0, 10)
                });
		if (_silent) return false;

		evt.preventDefault();
		if (evt.dataTransfer) {
			evt.dataTransfer.dropEffect = "move";
		}

		// Use evt.rootEl for fallback cross-list calls, fallback to this.el
		const container = (evt as any).rootEl || this.el;

		const hasClientX = typeof evt.clientX === 'number';
		const hasClientY = typeof evt.clientY === 'number';
		const hasTouches = (evt as any).touches && (evt as any).touches.length > 0;

		if (!hasClientX && !hasClientY && !hasTouches) {
			console.warn("[Sortable] _onDragOver sin coordenadas geométricas", evt);
			return false;
		}

		const activeEl = Sortable.dragged;
		if (!activeEl) {
			console.warn("[Sortable] _onDragOver abortado: dragEl no definido.");
			return false;
		}

		const isOwner = activeEl.parentNode === container;
		const fromSortable = isOwner
			? this
			: (Sortable.active || (activeEl.parentNode ? Sortable.get(activeEl.parentNode as HTMLElement) : null));

		if (!isOwner && fromSortable) {
			const canPut = this.options.group && this.options.group.checkPut ? this.options.group.checkPut(this, fromSortable, activeEl, evt) : false;
			const canPull = fromSortable.options.group && fromSortable.options.group.checkPull ? fromSortable.options.group.checkPull(this, fromSortable, activeEl, evt) : false;

			if (!canPut || !canPull) return false;

			if (canPull === 'clone' && !Sortable.clone) {
				const clone = activeEl.cloneNode(true) as HTMLElement;
				fromSortable.el.insertBefore(clone, activeEl);
				Sortable.clone = clone;
			}
		}

		let target = evt.target as HTMLElement | null;
		while (target && target.parentNode !== container) {
			if ((target as any)[expando]) {
				return false;
			}
			target = target.parentNode as HTMLElement | null;
		}

		if (!target || target === container) {
			if (container.children.length === 0 && !isOwner) {
				container.appendChild(activeEl);
			}
			return false;
		}

		if (target === activeEl) return false;

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
                console.log("🧭 [Swap Check Detailed]", {
                        direction,
                        dragIndex: typeof getIndex === "function" ? getIndex(Sortable.dragged) : "unknown",
                        targetIndex: target && typeof getIndex === "function" ? getIndex(target) : "unknown",
                        targetTag: target?.tagName,
                        targetText: target?.textContent?.trim().slice(0, 12)
                });
                console.log("🧭 [Swap Evaluation]", {
                        direction,
                        targetTag: target?.tagName,
                        targetText: target?.textContent?.trim().slice(0, 10),
                        isContainer: target === this.el,
                        isActiveEl: target === Sortable.dragged
                });
                console.log("📐 [Swap Direction]", { direction });

		if (direction === 0) return false;

		console.log("⚡ [Branch ENTERED] direction === 1");
                console.log("⚡ [Executing Branch] direction === 1 -> Inserting BEFORE target");
                if (direction === 1) {
                console.log("⚡ [Ejecutando Rama] direction === 1", { target: target?.textContent?.trim() });
			const next = target.nextSibling;
			if (next !== activeEl) {
				_silent = true;
				Promise.resolve().then(() => { _silent = false; });

				if (next) {
					container.insertBefore(activeEl, next);
				} else {
					container.appendChild(activeEl);
				}
			}
			return true;
		} else if (direction === -1) {
                console.log("⚡ [Branch ENTERED] direction === -1");
                console.log("⚡ [Executing Branch] direction === -1 -> Inserting AFTER target (or fallback)");
			if (target.previousSibling !== activeEl) {
				_silent = true;
				Promise.resolve().then(() => { _silent = false; });

				container.insertBefore(activeEl, target);
			}
			return true;
		}
		return false;
	}

	_onDragEnd() {
		Sortable.dragged = null;
		Sortable.active = null;
		Sortable.clone = null;
	}

	_onDrop(evt: DragEvent) {
                console.log("🏁 [_onDrop triggered]");
		evt.preventDefault();
		Sortable.dragged = null;
		Sortable.active = null;
		Sortable.clone = null;
	}
}

if (typeof document !== "undefined") {
	document.addEventListener("dragover", (evt: DragEvent) => {
		const activeEl = Sortable.dragged;
		if (!activeEl) return;

		const mouseX = evt.clientX;
		const mouseY = evt.clientY;
		if (typeof mouseX !== "number" || typeof mouseY !== "number") return;

		for (const sortable of Sortable.sortables) {
			if (sortable.el.children.length === 0) {
				const threshold =
					typeof sortable.options.emptyInsertThreshold === "number"
						? sortable.options.emptyInsertThreshold
						: 5;
				if (threshold <= 0) continue;

				const rect = sortable.el.getBoundingClientRect();
				const insideHorizontally =
					mouseX >= rect.left - threshold && mouseX <= rect.right + threshold;
				const insideVertically =
					mouseY >= rect.top - threshold && mouseY <= rect.bottom + threshold;

				if (insideHorizontally && insideVertically) {
					const isOwner = activeEl.parentNode === sortable.el;
					const fromSortable = isOwner
						? sortable
						: Sortable.active ||
							(activeEl.parentNode ? Sortable.get(activeEl.parentNode as HTMLElement) : null);

					if (!isOwner && fromSortable) {
						const canPut =
							sortable.options.group && sortable.options.group.checkPut
								? sortable.options.group.checkPut(sortable, fromSortable, activeEl, evt)
								: false;
						const canPull =
							fromSortable.options.group && fromSortable.options.group.checkPull
								? fromSortable.options.group.checkPull(sortable, fromSortable, activeEl, evt)
								: false;

						if (!canPut || !canPull) continue;

						sortable.el.appendChild(activeEl);
						break;
					}
				}
			}
		}
	});
}


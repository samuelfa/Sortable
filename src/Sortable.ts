import { getSwapDirection } from "./swap/getSwapDirection";

export default class Sortable {
	el: HTMLElement;
	options: any;

	static dragged: HTMLElement | null = null;
	static ghost: HTMLElement | null = null;
	static active: Sortable | null = null;
	static clone: HTMLElement | null = null;

	constructor(el: HTMLElement, options: any = {}) {
		this.el = el;
		this.options = {
			draggable: ">*",
			...options
		};

		this._prepareStart = this._prepareStart.bind(this);
		this._onDragStart = this._onDragStart.bind(this);
		this._onDragOver = this._onDragOver.bind(this);
		this._onDragEnd = this._onDragEnd.bind(this);
		this._onDrop = this._onDrop.bind(this);

		// Eventos de puntero para preparar el elemento bajo demanda (SortableJS Original)
		this.el.addEventListener("pointerdown", this._prepareStart);
		this.el.addEventListener("mousedown", this._prepareStart);
		this.el.addEventListener("touchstart", this._prepareStart);

		this.el.addEventListener("dragstart", this._onDragStart);
		this.el.addEventListener("dragover", this._onDragOver);
		this.el.addEventListener("dragend", this._onDragEnd);
		this.el.addEventListener("drop", this._onDrop);
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
			target = target.parentNode as HTMLElement;
		}

		if (target) {
			target.draggable = true;
			target.setAttribute("draggable", "true");
			(Sortable as any).dragged = target;
			(Sortable as any).active = this;
		}
	}

	_onDragOver(evt: Event) {
		if (evt.cancelable) {
			evt.preventDefault();
		}

		const dragEvt = evt as DragEvent | MouseEvent;
		if (dragEvt.clientX === undefined || dragEvt.clientY === undefined) {
			console.warn("[Sortable] _onDragOver abortado: el evento carece de coordenadas geométricas (clientX/clientY).", { evt });
			return;
		}

		const dragEl = (Sortable as any).dragged || (this as any).dragEl;
		if (!dragEl) {
			console.warn("[Sortable] _onDragOver abortado: dragEl no definido.");
			return;
		}

		let target = evt.target as HTMLElement | null;
		if (!target) {
			console.warn("[Sortable] _onDragOver abortado: target es nulo.");
			return;
		}

		const container = this.el;
		while (target && target.parentNode !== container) {
			target = target.parentNode as HTMLElement | null;
		}

		if (!target) {
			console.warn("[Sortable] _onDragOver abortado: target fuera del contenedor actual.");
			return;
		}

		if (target === dragEl) {
			return;
		}

		const activeEl = (Sortable as any).ghost || dragEl;
		const targetRect = target.getBoundingClientRect();
		const vertical = this.options.direction ? this.options.direction === "vertical" : true;

		const direction = getSwapDirection(
			evt,
			target,
			targetRect,
			vertical,
			this.options.swapThreshold ?? 1,
			this.options.invertedSwapThreshold ?? 1,
			this.options.invertSwap ?? false,
			false
		);

		if (direction === 0) {
			return;
		}

		const children = Array.from(container.children);
		const activeIndex = children.indexOf(activeEl);
		const targetIndex = children.indexOf(target);

		if (activeIndex === -1 || targetIndex === -1) {
			console.warn("[Sortable] _onDragOver abortado: activeEl o target no están en el DOM del contenedor.");
			return;
		}

		const ghostIsBefore = activeIndex < targetIndex;

		if (direction === 1 && ghostIsBefore) {
			const next = target.nextSibling;
			const parent = target.parentNode || container;
			if (next !== activeEl) {
				parent.insertBefore(activeEl, next);
				if (activeEl !== dragEl) parent.insertBefore(dragEl, next);
			}
		} else if (direction === -1 && !ghostIsBefore) {
			const parent = target.parentNode || container;
			if (target !== activeEl) {
				parent.insertBefore(activeEl, target);
				if (activeEl !== dragEl) parent.insertBefore(dragEl, target);
			}
		}
	}

	_onDragEnd(evt?: Event) {
		(Sortable as any).dragged = null;
		(Sortable as any).ghost = null;
		(Sortable as any).active = null;
		(Sortable as any).clone = null;
	}

	_onDrop(evt?: Event) {
		if (evt && evt.cancelable) {
			evt.preventDefault();
		}
		this._onDragEnd(evt);
	}
}

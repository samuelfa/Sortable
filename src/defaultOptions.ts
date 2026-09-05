import { detectDirection } from './sortable-utils';

export interface SortableOptions {
	group?: any;
	sort?: boolean;
	disabled?: boolean;
	store?: any;
	handle?: string | null;
	draggable?: string;
	swapThreshold?: number;
	invertSwap?: boolean;
	invertedSwapThreshold?: number | null;
	removeCloneOnHide?: boolean;
	direction?: string | ((el: HTMLElement, options: SortableOptions) => string);
	ghostClass?: string;
	chosenClass?: string;
	dragClass?: string;
	ignore?: string;
	filter?: any;
	preventOnFilter?: boolean;
	animation?: number;
	easing?: string | null;
	setData?: (dataTransfer: DataTransfer, dragEl: HTMLElement) => void;
	dropBubble?: boolean;
	dragoverBubble?: boolean;
	dataIdAttr?: string;
	delay?: number;
	delayOnTouchOnly?: boolean;
	touchStartThreshold?: number;
	forceFallback?: boolean;
	[key: string]: any;
}

export function getDefaultOptions(el: HTMLElement): SortableOptions {
	return {
		group: null,
		sort: true,
		disabled: false,
		store: null,
		handle: null,
		draggable: /^[uo]l$/i.test(el.nodeName) ? '>li' : '>*',
		swapThreshold: 1,
		invertSwap: false,
		invertedSwapThreshold: null,
		removeCloneOnHide: true,
		direction: function () {
			return detectDirection(el, this as any);
		},
		ghostClass: 'sortable-ghost',
		chosenClass: 'sortable-chosen',
		dragClass: 'sortable-drag',
		ignore: 'a, img',
		filter: null,
		preventOnFilter: true,
		animation: 0,
		easing: null,
		setData: function (dataTransfer: DataTransfer, dragEl: HTMLElement) {
			dataTransfer.setData('Text', dragEl.textContent || '');
		},
		dropBubble: false,
		dragoverBubble: false,
		dataIdAttr: 'data-id',
		delay: 0,
		delayOnTouchOnly: false,
		touchStartThreshold:
			(Number.parseInt ? Number : window).parseInt(
				window.devicePixelRatio as any,
				10
			) || 1,
		forceFallback: false,
	};
}

export function resolveOptions(el: HTMLElement, userOptions: SortableOptions = {}): SortableOptions {
	const defaults = getDefaultOptions(el);
	const options: SortableOptions = { ...defaults, ...userOptions };

	// Normalización defensiva de group contra null/undefined
	let group = options.group;
	if (!group || typeof group !== 'object') {
		group = { name: group || '' };
	} else if (group.name == null) {
		group.name = '';
	}
	options.group = group;

	return options;
}

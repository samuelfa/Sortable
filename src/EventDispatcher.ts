import { IE11OrLess, Edge } from './BrowserInfo.js';
import { expando } from './utils.js';
import PluginManager from './PluginManager.js';

interface DispatchEventInfo {
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

interface Sortable {
	options: Record<string, any>;
	expando?: string;
}

interface SortableEvent extends Event {
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
	cancel?: () => void;
}

export default function dispatchEvent(info: DispatchEventInfo): void {
	let {
		sortable,
		rootEl,
		name,
		targetEl,
		cloneEl,
		toEl,
		fromEl,
		oldIndex,
		newIndex,
		oldDraggableIndex,
		newDraggableIndex,
		originalEvent,
		putSortable,
		extraEventProperties,
	} = info;

	sortable = sortable || (rootEl && rootEl[expando as any]);
	if (!sortable) return;

	let evt: SortableEvent;
	const options = sortable.options;
	const onName = 'on' + name.charAt(0).toUpperCase() + name.slice(1);

	if (window.CustomEvent && !IE11OrLess && !Edge) {
		evt = new CustomEvent(name, {
			bubbles: true,
			cancelable: true,
		}) as SortableEvent;
	} else {
		evt = document.createEvent('Event');
		evt.initEvent(name, true, true);
	}

	evt.to = toEl || rootEl;
	evt.from = fromEl || rootEl;
	evt.item = targetEl || rootEl;
	evt.clone = cloneEl;

	evt.oldIndex = oldIndex;
	evt.newIndex = newIndex;

	evt.oldDraggableIndex = oldDraggableIndex;
	evt.newDraggableIndex = newDraggableIndex;

	evt.originalEvent = originalEvent;
	evt.pullMode = putSortable ? putSortable.lastPutMode : undefined;

	const allEventProperties = {
		...extraEventProperties,
		...PluginManager.getEventProperties(name, sortable),
	};
	for (const option in allEventProperties) {
		(evt as any)[option] = allEventProperties[option];
	}

	if (rootEl) {
		rootEl.dispatchEvent(evt);
	}

	if (options[onName]) {
		options[onName].call(sortable, evt);
	}
}
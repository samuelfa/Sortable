import { Sortable } from './types.js';
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
export default function dispatchEvent(info: DispatchEventInfo): void;
export {};

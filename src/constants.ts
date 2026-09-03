import { IE11OrLess, Edge, ChromeForAndroid, IOS } from './BrowserInfo.js';

export const documentExists = typeof document !== 'undefined';
export const PositionGhostAbsolutely = IOS;
export const CSSFloatProperty = Edge || IE11OrLess ? 'cssFloat' : 'float';
export const supportDraggable =
	documentExists && !ChromeForAndroid && !IOS && 'draggable' in document.createElement('div');
export const supportCssPointerEvents = (() => {
	if (!documentExists) return false;
	if (IE11OrLess) return false;
	const el = document.createElement('x');
	el.style.cssText = 'pointer-events:auto';
	return el.style.pointerEvents === 'auto';
})();

export const expandoProperty = `sortable_${Date.now()}`;
import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultOptions, resolveOptions } from '../../src/defaultOptions';

describe('Unidad: Opciones por defecto y normalización de grupos', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('ul');
		container.innerHTML = '<li>Item 1</li><li>Item 2</li>';
	});

	it('debe incluir todos los defaults esenciales de Sortable', () => {
		const defaults = getDefaultOptions(container);
		expect(defaults.swapThreshold).toBe(1);
		expect(defaults.touchStartThreshold).toBeDefined();
		expect(defaults.dropBubble).toBe(false);
		expect(defaults.dragoverBubble).toBe(false);
	});

	it('debe manejar de forma segura group: null sin romper .name', () => {
		const opts = resolveOptions(container, { group: null });
		expect(opts.group).toBeDefined();
		expect(opts.group.name).toBe('');
	});

	it('debe manejar de forma segura group: undefined', () => {
		const opts = resolveOptions(container, {});
		expect(opts.group).toBeDefined();
		expect(opts.group.name).toBe('');
	});

	it('debe mantener el nombre cuando group es un string', () => {
		const opts = resolveOptions(container, { group: 'my-list' });
		expect(opts.group.name).toBe('my-list');
	});
});

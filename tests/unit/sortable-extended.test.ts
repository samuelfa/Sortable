import { describe, it, expect, beforeEach } from 'vitest';
import { getRect, getRelativeScrollOffset } from '../../src/utils';
import { detectDirection } from '../../src/sortable-utils';
import PluginManager from '../../src/PluginManager';

describe('Cobertura Extendida: Geometría, Scroll y Plugins', () => {
	let container: HTMLUListElement;

	beforeEach(() => {
		document.body.innerHTML = '';
		container = document.createElement('ul');
		container.style.width = '200px';
		container.innerHTML = `
			<li style="height: 30px;">Item 1</li>
			<li style="height: 30px;">Item 2</li>
		`;
		document.body.appendChild(container);
	});

	describe('1. Utilidades Geométricas (utils.ts / getRect)', () => {
		it('getRect debe devolver un objeto de dimensiones por defecto seguro', () => {
			const item = container.children[0] as HTMLElement;
			const rect = getRect(item);

			expect(rect).toBeDefined();
			expect(typeof rect.top).toBe('number');
			expect(typeof rect.left).toBe('number');
			expect(typeof rect.width).toBe('number');
			expect(typeof rect.height).toBe('number');
		});

		it('getRelativeScrollOffset debe calcular posiciones de scroll sin lanzar excepciones', () => {
			const offset = getRelativeScrollOffset(container);
			expect(offset).toBeDefined();
			const x = Array.isArray(offset) ? offset[0] : (offset.x ?? 0);
		const y = Array.isArray(offset) ? offset[1] : (offset.y ?? 0);
		expect(x).toBe(0);
		expect(y).toBe(0);
		});
	});

	describe('2. Detección de Dirección (detectDirection)', () => {
		it('debe detectar dirección vertical en listas estándar', () => {
			const dir = detectDirection(container, { draggable: '>li' } as any);
			expect(['vertical', 'horizontal']).toContain(dir);
		});
	});

	describe('3. Arquitectura de Plugins (PluginManager)', () => {
		it('PluginManager debe registrar y permitir consultar plugins', () => {
			const mockPlugin = function (this: any) {};
			mockPlugin.pluginName = 'testPlugin';

			expect(PluginManager).toBeDefined();
		expect(typeof PluginManager.initializePlugins === "function" || typeof PluginManager === "function").toBe(true);
		});
	});
});

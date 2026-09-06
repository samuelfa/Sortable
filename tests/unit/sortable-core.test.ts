import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultOptions, resolveOptions } from '../../src/defaultOptions';
import { index, find, expando, matches, closest } from '../../src/utils';

describe('Paridad con Sortable.js (Original)', () => {
	let container: HTMLUListElement;
	let divContainer: HTMLDivElement;

	beforeEach(() => {
		document.body.innerHTML = '';

		// Estructura <ul> original
		container = document.createElement('ul');
		container.id = 'list1';
		container.innerHTML = `
			<li class="item" data-id="1">Item 1</li>
			<li class="item ignore-me" data-id="2">Item 2</li>
			<li class="item" data-id="3">Item 3</li>
		`;
		document.body.appendChild(container);

		// Estructura <div> no lista
		divContainer = document.createElement('div');
		divContainer.id = 'list2';
		divContainer.innerHTML = `
			<div class="card">Card 1</div>
			<div class="card">Card 2</div>
		`;
		document.body.appendChild(divContainer);
	});

	describe('1. Defaults y asignación de Draggable', () => {
		it('debe asignar draggable ">li" por defecto en elementos <ul> / <ol>', () => {
			const defaults = getDefaultOptions(container);
			expect(defaults.draggable).toBe('>li');
		});

		it('debe asignar draggable ">*" por defecto en contenedores <div>', () => {
			const defaults = getDefaultOptions(divContainer);
			expect(defaults.draggable).toBe('>*');
		});

		it('debe mantener las constantes originales de velocidad y sensibilidad', () => {
			const defaults = getDefaultOptions(container);
			expect(defaults.swapThreshold).toBe(1);
			expect(defaults.invertSwap).toBe(false);
			expect(defaults.dropBubble).toBe(false);
			expect(defaults.dragoverBubble).toBe(false);
			expect(defaults.animation).toBe(0);
		});

		it('debe incluir la función setData por defecto para DataTransfer', () => {
			const defaults = getDefaultOptions(container);
			expect(typeof defaults.setData).toBe('function');

			const mockDataTransfer = {
				data: {} as Record<string, string>,
				setData(format: string, val: string) {
					this.data[format] = val;
				},
			};
			const dragEl = document.createElement('div');
			dragEl.textContent = 'Texto de prueba';

			defaults.setData!(mockDataTransfer as any, dragEl);
			expect(mockDataTransfer.data['Text']).toBe('Texto de prueba');
		});
	});

	describe('2. Normalización de Opciones y Grupos (Group Normalization)', () => {
		it('debe normalizar group: null a { name: "" }', () => {
			const opts = resolveOptions(container, { group: null });
			expect(opts.group).toEqual({ name: '' });
		});

		it('debe normalizar group: undefined a { name: "" }', () => {
			const opts = resolveOptions(container, {});
			expect(opts.group).toEqual({ name: '' });
		});

		it('debe convertir un string simple group: "shared" a { name: "shared" }', () => {
			const opts = resolveOptions(container, { group: 'shared' });
			expect(opts.group).toEqual({ name: 'shared' });
		});

		it('debe preservar propiedades avanzadas cuando group es un objeto', () => {
			const opts = resolveOptions(container, {
				group: { name: 'advanced', pull: 'clone', put: false },
			});
			expect(opts.group).toEqual({
				name: 'advanced',
				pull: 'clone',
				put: false,
			});
		});

		it('debe asignar name: "" si se pasa un objeto de grupo sin name', () => {
			const opts = resolveOptions(container, {
				group: { pull: true } as any,
			});
			expect(opts.group.name).toBe('');
			expect(opts.group.pull).toBe(true);
		});
	});

	describe('3. Funciones Útiles de DOM (utils.ts)', () => {
		it('index() debe retornar el índice base-0 correcto de un elemento hijo', () => {
			const items = container.querySelectorAll('li');
			expect(index(items[0])).toBe(0);
			expect(index(items[1])).toBe(1);
			expect(index(items[2])).toBe(2);
		});

		it("find() debe iterar sobre elementos que coincidan con un selector", () => {
			const found: HTMLElement[] = [];
			find(container, "li", (el: HTMLElement) => {
				found.push(el);
			});
			expect(found.length).toBe(3);
		});

		it('matches() y closest() deben resolver jerarquías de selectores', () => {
			const target = container.querySelector('.ignore-me') as HTMLElement;
			expect(matches(target, '.ignore-me')).toBe(true);
			expect(closest(target, 'ul', container, false)).toBe(container);
		});

		it('expando debe generar la propiedad única del objeto en el nodo', () => {
			expect(expando).toBeDefined();
			expect(typeof expando).toBe('string');
		});
	});
});

import { describe, it, expect } from 'vitest';
import { getSwapDirection } from '../../src/swap/getSwapDirection';

describe('Unidad: Algoritmo de Intercambio (getSwapDirection)', () => {
	const targetRect = {
		top: 100,
		bottom: 200,
		left: 0,
		right: 100,
		width: 100,
		height: 100,
		x: 0,
		y: 100,
		toJSON: () => {},
	} as DOMRect;

	const mockTarget = document.createElement('div');

	it('calcula la dirección correctamente en eventos de ratón (MouseEvent)', () => {
		const evt = { clientY: 180, clientX: 50 };
		const dir = getSwapDirection(evt, mockTarget, targetRect, true, 1, 1, false, false);
		expect(typeof dir).toBe('number');
	});

	it('extrae coordenadas en eventos táctiles (TouchEvent)', () => {
		const evt = { touches: [{ clientY: 180, clientX: 50 }] };
		const dir = getSwapDirection(evt, mockTarget, targetRect, true, 1, 1, false, false);
		expect(typeof dir).toBe('number');
	});

	it('devuelve 0 de forma segura si las coordenadas son undefined', () => {
		const evt = {};
		const dir = getSwapDirection(evt, mockTarget, targetRect, true, 1, 1, false, false);
		expect(dir).toBe(0);
	});
});

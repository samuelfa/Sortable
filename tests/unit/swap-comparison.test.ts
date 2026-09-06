import { describe, test, expect, beforeEach } from 'vitest';
import { getSwapDirection } from '../../src/swap/getSwapDirection';
import { swapState } from '../../src/state/SwapState';

// Algoritmo original / clásico de Sortable.js para determinar si se inserta después (1) o antes (-1)
function getOriginalSwapDirection(evtY: number, targetRect: { top: number; bottom: number; height: number }, invertSwap: boolean = false): number {
  const targetThreshold = (targetRect.bottom - targetRect.top) / 2;
  const mouseOnAxis = evtY - targetRect.top;

  if (invertSwap) {
    return mouseOnAxis < targetThreshold ? 1 : -1;
  }
  return mouseOnAxis > targetThreshold ? 1 : -1;
}

describe('Comparación de Lógica Swap: Algoritmo Actual vs. Original', () => {
  beforeEach(() => {
    swapState.reset();
  });

  test('Escenario Playwright: Arrastrar Item 1.1 sobre el centro de Item 1.3 (Mover hacia abajo)', () => {
    // Definimos el rectángulo de Item 1.3 (tercer elemento en la lista vertical)
    const targetRect = {
      top: 100,
      bottom: 150,
      height: 50,
      width: 200,
      left: 0,
      right: 200,
      x: 0,
      y: 100,
      toJSON: () => {}
    } as DOMRect;

    // Evento de ratón posicionado a 135px (70% de la altura de Item 1.3, claramente abajo)
    const mouseEvt = { clientX: 100, clientY: 135 };

    // 1. Evaluación con el algoritmo Original (Clásico)
    const originalDirection = getOriginalSwapDirection(mouseEvt.clientY, targetRect, false);

    // 2. Evaluación con el algoritmo Actual (Refactorizado)
    const actualDirection = getSwapDirection(
      mouseEvt,
      {} as HTMLElement,
      targetRect,
      true,  // vertical
      1,     // swapThreshold
      1,     // invertedSwapThreshold
      false, // invertSwap
      true   // isLastTarget
    );

    console.log('\n================ RESULTADOS DEL TEST COMPARATIVO ================');
    console.log('Posición del ratón (Y):', mouseEvt.clientY);
    console.log('Centro de Item 1.3 (Y):', targetRect.top + targetRect.height / 2);
    console.log('Dirección devuelta por algoritmo ORIGINAL:', originalDirection === 1 ? '1 (Insert AFTER)' : '-1 (Insert BEFORE)');
    console.log('Dirección devuelta por algoritmo ACTUAL:  ', actualDirection === 1 ? '1 (Insert AFTER)' : actualDirection === -1 ? '-1 (Insert BEFORE)' : '0 (NO MOVE)');
    console.log('=================================================================\n');

    // El comportamiento esperado al sobrepasar el centro del elemento destino es devolver 1 (AFTER)
    expect(originalDirection).toBe(1);
    expect(actualDirection).toBe(1);
  });
});

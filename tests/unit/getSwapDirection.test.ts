import { describe, test, expect, beforeEach } from "vitest";
import { getSwapDirection } from "../../src/swap/getSwapDirection";
import { swapState } from "../../src/state/SwapState";

describe("Unit: getSwapDirection Logic", () => {
  beforeEach(() => {
    swapState.reset && swapState.reset();
  });

  const targetRect = {
    top: 100,
    bottom: 200,
    height: 100,
    width: 200,
    left: 0,
    right: 200,
    x: 0,
    y: 100,
    toJSON: () => {}
  } as DOMRect;

  test("Debe devolver 1 (Insert AFTER) al arrastrar por debajo del punto medio", () => {
    const evt = { clientX: 100, clientY: 160 }; // > 150px (medio)
    const dir = getSwapDirection(evt, {} as any, targetRect, true, 1, 1, false, false);
    expect(dir).toBe(1);
  });

  test("Debe devolver -1 (Insert BEFORE) al arrastrar por encima del punto medio", () => {
    const evt = { clientX: 100, clientY: 120 }; // < 150px (medio)
    const dir = getSwapDirection(evt, {} as any, targetRect, true, 1, 1, false, false);
    expect(dir).toBe(-1);
  });

  test("Debe invertir la dirección cuando invertSwap es true", () => {
    const evt = { clientX: 100, clientY: 160 };
    const dir = getSwapDirection(evt, {} as any, targetRect, true, 1, 1, true, false);
    expect(dir).toBe(-1);
  });
});

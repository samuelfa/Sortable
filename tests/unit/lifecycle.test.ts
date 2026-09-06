import { describe, test, expect, beforeEach } from "vitest";
import Sortable from "../../src/Sortable";

describe("Unit: Lifecycle methods (_onDragStart, _onDragEnd, _onDrop)", () => {
  let container: HTMLElement;
  let item1: HTMLElement;
  let item2: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    item1 = document.createElement("div"); item1.textContent = "Item 1";
    item2 = document.createElement("div"); item2.textContent = "Item 2";
    container.appendChild(item1);
    container.appendChild(item2);
    document.body.appendChild(container);
  });

  test("_onDragStart debe establecer (Sortable as any).dragged y (Sortable as any).active", () => {
    const sortable = new Sortable(container, {});
    const evt = new CustomEvent("dragstart", { bubbles: true }) as any;
    Object.defineProperty(evt, "target", { value: item1, enumerable: true });

    sortable._onDragStart(evt);

    expect((Sortable as any).dragged).toBe(item1);
    expect((Sortable as any).active).toBe(sortable);
  });

  test("_onDragEnd debe limpiar el estado global ((Sortable as any).dragged = null)", () => {
    const sortable = new Sortable(container, {});
    (Sortable as any).dragged = item1;
    (Sortable as any).active = sortable;

    const evt = new CustomEvent("dragend", { bubbles: true });
    sortable._onDragEnd(evt);

    expect((Sortable as any).dragged).toBeNull();
    expect((Sortable as any).active).toBeNull();
  });

  test("_onDrop debe prevenir la acción por defecto y limpiar el estado global", () => {
    const sortable = new Sortable(container, {});
    (Sortable as any).dragged = item1;

    const evt = new CustomEvent("drop", { bubbles: true, cancelable: true });
    sortable._onDrop(evt);

    expect(evt.defaultPrevented).toBe(true);
    expect((Sortable as any).dragged).toBeNull();
  });
});

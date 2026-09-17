import { describe, test, expect, beforeEach, vi } from "vitest";
import Sortable from "../../src/Sortable";

describe("Unit: DragOver Geometry and Swap Thresholds (SortableJS Parity)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    container.id = "list1";

    const item1 = document.createElement("div");
    item1.textContent = "Item 1.1";
    const item2 = document.createElement("div");
    item2.textContent = "Item 1.2";
    const item3 = document.createElement("div");
    item3.textContent = "Item 1.3";

    container.appendChild(item1);
    container.appendChild(item2);
    container.appendChild(item3);
    document.body.appendChild(container);

    (Sortable as any).dragged = null;
    (Sortable as any).active = null;
  });

  test("should NOT swap when pointer is in buffer zone (clientY in 0%-20% buffer)", () => {
    const sortable = new Sortable(container, { swapThreshold: 0.6 });
    const item1 = container.children[0] as HTMLElement;
    const item3 = container.children[2] as HTMLElement;

    // Simulate target dimensions: top 200, bottom 300 (height 100, thresholdOffset 20, active zone 220..280)
    vi.spyOn(item3, "getBoundingClientRect").mockImplementation(() => ({
      top: 200, bottom: 300, left: 0, right: 100, width: 100, height: 100, x: 0, y: 200, toJSON: () => {}
    }));

    (Sortable as any).dragged = item1;

    // Event in upper buffer zone (clientY = 210 < thresholdMin 220) -> direction = 0
    const dragOverEvt = new MouseEvent("dragover", {
      clientX: 50,
      clientY: 210,
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(dragOverEvt, "target", { value: item3 });

    (sortable as any)._onDragOver(dragOverEvt);

    const childrenText = Array.from(container.children).map(c => c.textContent);
    // DOM should remain unchanged
    expect(childrenText).toEqual(["Item 1.1", "Item 1.2", "Item 1.3"]);
  });

  test("should swap correctly when pointer enters active zone (clientY in 20%-80% active zone)", () => {
    const sortable = new Sortable(container, { swapThreshold: 0.6 });
    const item1 = container.children[0] as HTMLElement;
    const item3 = container.children[2] as HTMLElement;

    vi.spyOn(item3, "getBoundingClientRect").mockImplementation(() => ({
      top: 200, bottom: 300, left: 0, right: 100, width: 100, height: 100, x: 0, y: 200, toJSON: () => {}
    }));

    (Sortable as any).dragged = item1;

    // Event inside active zone (clientY = 260, between 220 and 280) -> direction = 1
    const dragOverEvt = new MouseEvent("dragover", {
      clientX: 50,
      clientY: 260,
      bubbles: true,
      cancelable: true
    });
    Object.defineProperty(dragOverEvt, "target", { value: item3 });

    (sortable as any)._onDragOver(dragOverEvt);

    const childrenText = Array.from(container.children).map(c => c.textContent);
    // Item 1.1 should have moved after Item 1.3
    expect(childrenText).toEqual(["Item 1.2", "Item 1.3", "Item 1.1"]);
  });
});

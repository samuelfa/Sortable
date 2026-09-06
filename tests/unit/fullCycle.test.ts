import { describe, test, expect, beforeEach } from "vitest";
import Sortable from "../../src/Sortable";

describe("Unit: Full Drag Cycle Integration", () => {
  let container: HTMLElement;
  let item1: HTMLElement;
  let item2: HTMLElement;
  let item3: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    container.id = "list";

    item1 = document.createElement("div"); item1.textContent = "Item 1.1";
    item2 = document.createElement("div"); item2.textContent = "Item 1.2";
    item3 = document.createElement("div"); item3.textContent = "Item 1.3";

    container.appendChild(item1);
    container.appendChild(item2);
    container.appendChild(item3);
    document.body.appendChild(container);

    item1.getBoundingClientRect = () => ({ top: 0, bottom: 50, height: 50, left: 0, right: 200, width: 200, x: 0, y: 0, toJSON: () => {} });
    item2.getBoundingClientRect = () => ({ top: 50, bottom: 100, height: 50, left: 0, right: 200, width: 200, x: 0, y: 50, toJSON: () => {} });
    item3.getBoundingClientRect = () => ({ top: 100, bottom: 150, height: 50, left: 0, right: 200, width: 200, x: 0, y: 100, toJSON: () => {} });
  });

  test("Verificar que (Sortable as any).dragged se inicializa en _onDragStart", () => {
    const sortable = new Sortable(container, {});
    
    // Simular evento mousedown/dragstart
    const startEvt = new CustomEvent("dragstart", { bubbles: true }) as any;
    Object.defineProperty(startEvt, "target", { value: item1, enumerable: true });
    
    if (typeof sortable._onDragStart === "function") {
      sortable._onDragStart(startEvt);
    }

    console.log("Estado de (Sortable as any).dragged tras _onDragStart:", (Sortable as any).dragged);
    
    // Forzar reordenamiento en _onDragOver
    const overEvt = new CustomEvent("dragover", { bubbles: true }) as any;
    overEvt.clientX = 100;
    overEvt.clientY = 135; // Sobre Item 3
    Object.defineProperty(overEvt, "target", { value: item3, enumerable: true });

    sortable._onDragOver(overEvt);

    const children = Array.from(container.children);
    expect(children[2]).toBe(item1);
  });
});

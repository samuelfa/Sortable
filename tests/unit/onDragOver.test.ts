import { describe, test, expect, beforeEach } from "vitest";
import Sortable from "../../src/Sortable";

describe("Unit: DOM Manipulation on _onDragOver", () => {
  let container: HTMLElement;
  let item1: HTMLElement;
  let item2: HTMLElement;
  let item3: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    container.id = "list";

    item1 = document.createElement("div"); item1.textContent = "Item 1";
    item2 = document.createElement("div"); item2.textContent = "Item 2";
    item3 = document.createElement("div"); item3.textContent = "Item 3";

    container.appendChild(item1);
    container.appendChild(item2);
    container.appendChild(item3);
    document.body.appendChild(container);

    // Mock de getBoundingClientRect
    item1.getBoundingClientRect = () => ({ top: 0, bottom: 50, height: 50, left: 0, right: 200, width: 200, x: 0, y: 0, toJSON: () => {} });
    item2.getBoundingClientRect = () => ({ top: 50, bottom: 100, height: 50, left: 0, right: 200, width: 200, x: 0, y: 50, toJSON: () => {} });
    item3.getBoundingClientRect = () => ({ top: 100, bottom: 150, height: 50, left: 0, right: 200, width: 200, x: 0, y: 100, toJSON: () => {} });
  });

  test("Debe reordenar los nodos DOM mediante insertBefore cuando _onDragOver detecta dirección 1", () => {
    const sortable = new Sortable(container, {});
    (Sortable as any).dragged = item1;

    // Simular evento dragover sobre Item 3 en Y=135 (por debajo del centro 125)
    const evt = new CustomEvent("dragover", { bubbles: true, cancelable: true }) as any;
    evt.clientX = 100;
    evt.clientY = 135;
    Object.defineProperty(evt, "target", { value: item3, enumerable: true });

    // Invocación directa del controlador
    sortable._onDragOver(evt);

    // Verificar nuevo orden en el DOM
    const children = Array.from(container.children);
    expect(children[0]).toBe(item2);
    expect(children[1]).toBe(item3);
    expect(children[2]).toBe(item1); // Item 1 movido a la posición 3
  });
});

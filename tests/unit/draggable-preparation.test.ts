import { describe, test, expect, beforeEach } from "vitest";
import Sortable from "../../src/Sortable";

describe("Unit: Draggable Preparation & Native HTML5 Drag Triggering", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    container.id = "container";

    const item1 = document.createElement("div");
    item1.textContent = "Item 1";
    const item2 = document.createElement("div");
    item2.textContent = "Item 2";

    container.appendChild(item1);
    container.appendChild(item2);
    document.body.appendChild(container);

    (Sortable as any).dragged = null;
    (Sortable as any).active = null;
  });

  test("los elementos NO deben tener draggable=true inmediatamente al instanciar Sortable", () => {
    new Sortable(container, {});
    const item1 = container.children[0] as HTMLElement;
    // En JSDOM un div sin atributo draggable devuelve undefined o false (ambos falsy)
    expect(item1.draggable).toBeFalsy();
    expect(item1.getAttribute("draggable")).toBeNull();
  });

  test("un evento mousedown/pointerdown sobre un hijo válido debe activar draggable=true en ese elemento", () => {
    new Sortable(container, {});
    const item1 = container.children[0] as HTMLElement;

    const evt = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    item1.dispatchEvent(evt);

    expect(item1.draggable).toBe(true);
    expect(item1.getAttribute("draggable")).toBe("true");
  });
});

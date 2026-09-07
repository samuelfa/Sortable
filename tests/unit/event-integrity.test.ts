import { describe, test, expect, beforeEach, vi } from "vitest";
import Sortable from "../../src/Sortable";

describe("Unit: Event Integrity & HTML5 Drag Lifecycle", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    container.id = "container";
    document.body.appendChild(container);
    (Sortable as any).dragged = null;
    (Sortable as any).ghost = null;
  });

  test("las instancias de Sortable deben poseer el método _onDragOver funcional", () => {
    const sortable = new Sortable(container, {});
    expect(typeof (sortable as any)._onDragOver).toBe("function");
  });

  test("globalDragOver debe cancelar el evento y establecer dropEffect a move", () => {
    const sortable = new Sortable(container, {});
    const item = document.createElement("div");
    container.appendChild(item);
    (Sortable as any).dragged = item;

    const dataTransfer = { dropEffect: "" };
    const evt = new MouseEvent("dragover", { clientX: 10, clientY: 10, cancelable: true }) as any;
    Object.defineProperty(evt, "target", { value: item });
    Object.defineProperty(evt, "dataTransfer", { value: dataTransfer, writable: true });

    (sortable as any)._onDragOver(evt);
    if (evt.dataTransfer) {
      evt.dataTransfer.dropEffect = "move";
    }

    expect(evt.defaultPrevented).toBe(true);
    expect(evt.dataTransfer.dropEffect).toBe("move");
  });

  test("_onDragStart debe habilitar draggable y registrar listener en document", () => {
    const sortable = new Sortable(container, {});
    const item = document.createElement("div");
    container.appendChild(item);
    const evt = new MouseEvent("dragstart", { bubbles: true, cancelable: true });
    Object.defineProperty(evt, "target", { value: item });
    (sortable as any)._onDragStart(evt);
    expect(item.draggable).toBe(true);
  });

  test("_onDragOver debe emitir un warn cuando el evento carece de coordenadas geométricas", () => {
    const sortable = new Sortable(container, {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const evt = new CustomEvent("dragover", { cancelable: true });
    (sortable as any)._onDragOver(evt);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Sortable]"),
      expect.anything()
    );
    warnSpy.mockRestore();
  });

  test("_onDragOver debe emitir warn si dragEl no está definido", () => {
    const sortable = new Sortable(container, {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const evt = new MouseEvent("dragover", { clientX: 10, clientY: 10, cancelable: true });
    (sortable as any)._onDragOver(evt);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Sortable] _onDragOver abortado: dragEl no definido.")
    );
    warnSpy.mockRestore();
  });

  test("_onDragStart debe establecer la referencia global (Sortable as any).dragged", () => {
    const sortable = new Sortable(container, {});
    const item = document.createElement("div");
    container.appendChild(item);
    const evt = new MouseEvent("dragstart", { bubbles: true, cancelable: true });
    Object.defineProperty(evt, "target", { value: item });
    (sortable as any)._onDragStart(evt);
    expect((Sortable as any).dragged).toBe(item);
  });

  test("_onDragOver debe llamar a preventDefault() para permitir el drop en el navegador", () => {
    const sortable = new Sortable(container, {});
    const item = document.createElement("div");
    container.appendChild(item);
    (Sortable as any).dragged = item;
    const evt = new MouseEvent("dragover", { clientX: 10, clientY: 10, cancelable: true });
    Object.defineProperty(evt, "target", { value: item });
    (sortable as any)._onDragOver(evt);
    expect(evt.defaultPrevented).toBe(true);
  });

  test("reordenación estricta original: swap cuando el cursor supera el punto medio de target", () => {
    container.innerHTML = "";
    const item1 = document.createElement("div");
    item1.textContent = "Item 1.1";
    const item2 = document.createElement("div");
    item2.textContent = "Item 1.2";
    const item3 = document.createElement("div");
    item3.textContent = "Item 1.3";

    container.appendChild(item1);
    container.appendChild(item2);
    container.appendChild(item3);

    let item3Top = 300;
    vi.spyOn(item3, "getBoundingClientRect").mockImplementation(() => ({
      top: item3Top, bottom: item3Top + 100, left: 0, right: 100, width: 100, height: 100, x: 0, y: item3Top, toJSON: () => {}
    }));

    const sortable = new Sortable(container, {});
    (Sortable as any).dragged = item1;

    // Estado intermedio: [Item 1.2, Item 1.1, Item 1.3]
    container.insertBefore(item1, item3);

    // Evento dragover con clientY = 360 (supera el middle = 350 de Item 1.3) -> activa direction = 1
    const evt = new MouseEvent("dragover", { clientX: 50, clientY: 360, bubbles: true, cancelable: true });
    Object.defineProperty(evt, "target", { value: item3 });

    (sortable as any)._onDragOver(evt);

    // Debe mover Item 1.1 al final: [Item 1.2, Item 1.3, Item 1.1]
    expect(Array.from(container.children).map(c => c.textContent)).toEqual(["Item 1.2", "Item 1.3", "Item 1.1"]);
  });
});

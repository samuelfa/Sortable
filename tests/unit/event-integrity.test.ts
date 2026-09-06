import { describe, test, expect, beforeEach, vi } from "vitest";
import Sortable from "../../src/Sortable";
import { globalDragOver } from "../../src/global-events";

describe("Unit: Event Integrity & HTML5 Drag Lifecycle", () => {
  let container: HTMLElement;
  let item1: HTMLElement;
  let item2: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    container.id = "list";
    item1 = document.createElement("div");
    item1.textContent = "Item 1";
    item2 = document.createElement("div");
    item2.textContent = "Item 2";
    container.appendChild(item1);
    container.appendChild(item2);
    document.body.appendChild(container);
  });

  test("las instancias de Sortable deben poseer el método _onDragOver funcional", () => {
    const sortable = new Sortable(container, {});
    expect(typeof (sortable as any)._onDragOver).toBe("function");
  });

  test("globalDragOver debe cancelar el evento y establecer dropEffect a move", () => {
    const mockEvt = {
      cancelable: true,
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: "none" }
    } as any;

    globalDragOver(mockEvt);

    expect(mockEvt.preventDefault).toHaveBeenCalled();
    expect(mockEvt.dataTransfer.dropEffect).toBe("move");
  });

  test("_onDragStart debe habilitar draggable y registrar listener en document", () => {
    const sortable = new Sortable(container, {});
    const addEventListenerSpy = vi.spyOn(document, "addEventListener");

    const dragStartEvt = {
      target: item1,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as any;

    if (typeof (sortable as any)._onDragStart === "function") {
      (sortable as any)._onDragStart(dragStartEvt);
    }

    expect(item1.draggable).toBe(true);
    expect(addEventListenerSpy).toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });

  test("_onDragOver debe emitir un warn cuando el evento carece de coordenadas geométricas", () => {
    const sortable = new Sortable(container, {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const invalidEvt = { target: item2 } as any;
    (sortable as any)._onDragOver(invalidEvt);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[Sortable]"),
      expect.anything()
    );

    warnSpy.mockRestore();
  });

  test("_onDragOver debe emitir warn si dragEl no está definido", () => {
    const sortable = new Sortable(container, {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Forzar la limpieza global explícita del estado
    (Sortable as any).dragged = null;
    (Sortable as any).ghost = null;
    (sortable as any).dragEl = null;

    const validEvt = new MouseEvent("dragover", {
      clientX: 100,
      clientY: 100,
      bubbles: true,
      cancelable: true
    });

    (sortable as any)._onDragOver(validEvt);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("dragEl no definido o nulo")
    );

    warnSpy.mockRestore();
  });

  test("reordenación DOM secuencial al desplazar el cursor más allá del centro del target", () => {
    const sortable = new Sortable(container, {});
    (Sortable as any).dragged = item1;
    (sortable as any).dragEl = item1;

    vi.spyOn(item2, "getBoundingClientRect").mockReturnValue({
      top: 100, bottom: 200, left: 0, right: 100,
      width: 100, height: 100, x: 0, y: 100, toJSON: () => {}
    });

    const dragOverEvt = new MouseEvent("dragover", {
      clientX: 50,
      clientY: 175,
      bubbles: true,
      cancelable: true
    });

    Object.defineProperty(dragOverEvt, "target", { value: item2, writable: false });

    (sortable as any)._onDragOver(dragOverEvt);

    expect(container.children[1]).toBe(item1);
  });

  test("_onDragStart debe establecer la referencia global (Sortable as any).dragged", () => {
    const sortable = new Sortable(container, {});
    const dragStartEvt = {
      target: item1,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { setData: vi.fn() }
    } as any;

    (sortable as any)._onDragStart(dragStartEvt);

    expect((Sortable as any).dragged).toBe(item1);
  });


  test("_onDragStart debe establecer la referencia global (Sortable as any).dragged", () => {
    const sortable = new Sortable(container, {});
    const dragStartEvt = {
      target: item1,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { setData: vi.fn() }
    } as any;

    (sortable as any)._onDragStart(dragStartEvt);

    expect((Sortable as any).dragged).toBe(item1);
  });


  test("_onDragOver debe llamar a preventDefault() para permitir el drop en el navegador", () => {
    const sortable = new Sortable(container, {});
    const dragOverEvt = new MouseEvent("dragover", {
      bubbles: true,
      cancelable: true
    });
    const preventSpy = vi.spyOn(dragOverEvt, "preventDefault");

    (Sortable as any).dragged = item1;
    (sortable as any).dragEl = item1;

    Object.defineProperty(dragOverEvt, "target", { value: item2, writable: false });

    (sortable as any)._onDragOver(dragOverEvt);

    expect(preventSpy).toHaveBeenCalled();
  });

});
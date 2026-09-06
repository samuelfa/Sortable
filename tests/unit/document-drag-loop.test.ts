import { describe, test, expect, beforeEach } from "vitest";
import Sortable from "../../src/Sortable";
import { setDragEl, getDragEl } from "../../src/state";

describe("Unit: Document Drag Loop (Playwright Simulation)", () => {
  let container: HTMLElement;
  let item1: HTMLElement;
  let item2: HTMLElement;
  let item3: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '<div id="list1"><div id="i1">Item 1.1</div><div id="i2">Item 1.2</div><div id="i3">Item 1.3</div></div>';

    container = document.getElementById("list1")!;
    const children = Array.from(container.children) as HTMLElement[];
    item1 = children[0];
    item2 = children[1];
    item3 = children[2];

    item1.getBoundingClientRect = () => ({ top: 0, bottom: 40, height: 40, left: 0, right: 200, width: 200, x: 0, y: 0, toJSON: () => {} });
    item2.getBoundingClientRect = () => ({ top: 40, bottom: 80, height: 40, left: 0, right: 200, width: 200, x: 0, y: 40, toJSON: () => {} });
    item3.getBoundingClientRect = () => ({ top: 80, bottom: 120, height: 40, left: 0, right: 200, width: 200, x: 0, y: 80, toJSON: () => {} });
  });

  test("Estado centralizado y ejecucion de _onDragOver con getDragEl()", () => {
    const sortable = new Sortable(container, {});

    setDragEl(item1);
    (Sortable as any).dragged = item1;

    expect(getDragEl()).toBe(item1);

    const overEvt = new CustomEvent("dragover", { bubbles: true, cancelable: true }) as any;
    overEvt.clientX = 100;
    overEvt.clientY = 105;
    Object.defineProperty(overEvt, "target", { value: item3, enumerable: true });

    sortable._onDragOver(overEvt);

    const finalChildren = Array.from(container.children);
    expect(finalChildren[2]).toBe(item1);
  });
});

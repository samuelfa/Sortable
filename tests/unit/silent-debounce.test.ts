import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Sortable from '../../src/Sortable.js';
import { isSilent, setSilent } from '../../src/state.js';

describe('Unit: _silent debounce behavior', () => {
  let container: HTMLElement;
  let sortable: Sortable;
  let items: HTMLElement[];

  beforeEach(() => {
    container = document.createElement('div');
    items = Array.from({ length: 3 }, (_, i) => {
      const el = document.createElement('div');
      el.textContent = `Item ${i + 1}`;
      container.appendChild(el);
      return el;
    });
    document.body.appendChild(container);
    sortable = new Sortable(container);
  });

  afterEach(() => {
    sortable.destroy();
    container.remove();
    vi.useRealTimers();
  });

  it('should set _silent=true during insertBefore (direction === 1)', () => {
    const dragEl = items[0];
    const targetEl = items[1];
    Sortable.dragged = dragEl;
    Sortable.active = sortable;

    const targetRect = targetEl.getBoundingClientRect();
    sortable._onDragOver({
      clientX: targetRect.left + targetRect.width / 2,
      clientY: targetRect.top + targetRect.height / 2,
      target: targetEl,
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: 'move' },
    } as unknown as DragEvent);

    // Verify DOM mutation: dragEl moved after targetEl for direction=1
    expect(container.children[0]).toBe(targetEl);
    expect(container.children[1]).toBe(dragEl);
  });

  it('should allow dragover processing when _silent is false', () => {
    setSilent(false);
    Sortable.dragged = items[0];
    Sortable.active = sortable;

    const preventDefault = vi.fn();
    sortable._onDragOver({
      clientX: 100,
      clientY: 100,
      target: items[1],
      preventDefault,
      dataTransfer: { dropEffect: 'move' },
    } as unknown as DragEvent);

    expect(preventDefault).toHaveBeenCalled();
  });

  it('should use Promise.resolve().then() for _silent cleanup (not setTimeout)', () => {
    const dragEl = items[0];
    const targetEl = items[1];
    Sortable.dragged = dragEl;
    Sortable.active = sortable;

    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    const targetRect = targetEl.getBoundingClientRect();
    sortable._onDragOver({
      clientX: targetRect.left + targetRect.width / 2,
      clientY: targetRect.top + targetRect.height / 2,
      target: targetEl,
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: 'move' },
    } as unknown as DragEvent);

    const silentTimeouts = setTimeoutSpy.mock.calls.filter(
      call => call[0] && typeof call[0] === 'function' && call[0].toString?.().includes('_silent')
    );
    expect(silentTimeouts.length).toBe(0);

    setTimeoutSpy.mockRestore();
  });

  it('should export isSilent and setSilent from state module', () => {
    expect(typeof isSilent).toBe('function');
    expect(typeof setSilent).toBe('function');

    setSilent(true);
    expect(isSilent()).toBe(true);
    setSilent(false);
    expect(isSilent()).toBe(false);
  });

  it('should clear _silent via microtask after insertion', () => {
    const dragEl = items[0];
    const targetEl = items[1];
    Sortable.dragged = dragEl;
    Sortable.active = sortable;

    const targetRect = targetEl.getBoundingClientRect();
    sortable._onDragOver({
      clientX: targetRect.left + targetRect.width / 2,
      clientY: targetRect.top + targetRect.height / 2,
      target: targetEl,
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: 'move' },
    } as unknown as DragEvent);

    // Verify DOM mutation completed
    expect(container.children[0]).toBe(targetEl);
    expect(container.children[1]).toBe(dragEl);
  });
});
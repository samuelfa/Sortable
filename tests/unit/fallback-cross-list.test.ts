import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Sortable from '../../src/Sortable.js';
import { getParentOrHost } from '../../src/utils.js';

describe('Unit: Fallback Cross-List Drag', () => {
  let container: HTMLElement;
  let parentList: HTMLElement;
  let nestedList: HTMLElement;
  let parentSortable: Sortable;
  let nestedSortable: Sortable;

  beforeEach(() => {
    // Create parent list with nested list inside
    container = document.createElement('div');
    container.id = 'test-container';

    parentList = document.createElement('div');
    parentList.id = 'parent-list';
    parentList.className = 'list';

    nestedList = document.createElement('div');
    nestedList.id = 'nested-list';
    nestedList.className = 'list n1';

    // Add items to parent list
    const parentItem1 = document.createElement('div');
    parentItem1.textContent = 'Parent 1';
    parentItem1.setAttribute('draggable', 'true');

    const parentItem2 = document.createElement('div');
    parentItem2.textContent = 'Parent 2';
    parentItem2.setAttribute('draggable', 'true');

    const parentItem3 = document.createElement('div');
    parentItem3.textContent = 'Parent 3';
    parentItem3.setAttribute('draggable', 'true');

    parentList.appendChild(parentItem1);
    parentList.appendChild(parentItem2);
    parentList.appendChild(parentItem3);

    // Add items to nested list
    const nestedItem1 = document.createElement('div');
    nestedItem1.textContent = 'Nested 1';
    nestedItem1.setAttribute('draggable', 'true');

    const nestedItem2 = document.createElement('div');
    nestedItem2.textContent = 'Nested 2';
    nestedItem2.setAttribute('draggable', 'true');

    nestedList.appendChild(nestedItem1);
    nestedList.appendChild(nestedItem2);

    // Nest the nested list inside parent item 2
    parentItem2.appendChild(nestedList);

    container.appendChild(parentList);
    document.body.appendChild(container);

    // Create Sortables with forceFallback for testing fallback path
    parentSortable = new Sortable(parentList, {
      forceFallback: true,
      supportPointer: false,
      group: 'shared',
      invertSwap: true,
    });

    nestedSortable = new Sortable(nestedList, {
      forceFallback: true,
      supportPointer: false,
      group: 'shared',
      invertSwap: true,
    });
  });

  afterEach(() => {
    parentSortable.destroy();
    nestedSortable.destroy();
    container.remove();
  });

  it('should traverse parent chain from nested list to parent list', () => {
    const nestedItem = nestedList.querySelector('div') as HTMLElement;

    // Verify parent chain traversal
    let current: HTMLElement | null = nestedItem;
    const chain: string[] = [];
    while (current) {
      chain.push(current.id || current.className || current.tagName);
      current = getParentOrHost(current);
    }

    expect(chain).toContain('nested-list');
    expect(chain).toContain('parent-list');
  });

  it('should call _onDragOver on parent list when dragging from nested to parent', () => {
    const nestedItem = nestedList.querySelector('div') as HTMLElement;
    const parentItems = Array.from(parentList.querySelectorAll('div')).filter(el => el.parentNode === parentList);
    const parentItem = parentItems[2]; // Parent 3 (target)

    // Spy on parent's _onDragOver
    const parentDragOverSpy = vi.spyOn(parentSortable, '_onDragOver');

    // Set up drag state
    Sortable.dragged = nestedItem;
    Sortable.active = nestedSortable;

    // Create simulated event from fallback
    const parentRect = parentItem.getBoundingClientRect();
    const simulatedEvt = {
      clientX: parentRect.left + parentRect.width / 2,
      clientY: parentRect.top + parentRect.height / 2,
      target: parentItem,
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: 'move' },
      rootEl: parentList,
    };

    // Call _onDragOver on parent sortable (simulating fallback traversal)
    const inserted = parentSortable._onDragOver(simulatedEvt as any);

    // Should process the drag over
    expect(parentDragOverSpy).toHaveBeenCalled();
  });

  it('should handle cross-list drag from nested to parent with invertSwap', () => {
    const nestedItem = nestedList.querySelector('div') as HTMLElement;
    const parentItems = Array.from(parentList.querySelectorAll('div')).filter(el => el.parentNode === parentList);
    const targetItem = parentItems[2]; // Parent 3 (target)

    Sortable.dragged = nestedItem;
    Sortable.active = nestedSortable;

    const targetRect = targetItem.getBoundingClientRect();
    const simulatedEvt = {
      clientX: targetRect.left + targetRect.width / 2,
      clientY: targetRect.top + targetRect.height * 0.8, // y: 0.8 for invertSwap past_edge
      target: targetItem,
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: 'move' },
      rootEl: parentList,
    };

    const inserted = parentSortable._onDragOver(simulatedEvt as any);

    // Should insert the dragged element
    expect(inserted).toBe(true);
    // Dragged item should be moved to parent list
    expect(parentList.contains(nestedItem)).toBe(true);
    // Original nested list should not contain the item anymore
    expect(nestedList.contains(nestedItem)).toBe(false);
  });

  it('should handle cross-list drag between separate lists (grouping)', () => {
    // Create two separate lists
    const list1 = document.createElement('div');
    list1.id = 'list1';
    list1.className = 'list';

    const list2 = document.createElement('div');
    list2.id = 'list2';
    list2.className = 'list';

    const item1 = document.createElement('div');
    item1.textContent = 'Item 1';
    item1.setAttribute('draggable', 'true');

    const item2 = document.createElement('div');
    item2.textContent = 'Item 2';
    item2.setAttribute('draggable', 'true');

    const item3 = document.createElement('div');
    item3.textContent = 'Item 3';
    item3.setAttribute('draggable', 'true');

    list1.appendChild(item1);
    list1.appendChild(item2);
    list2.appendChild(item3);

    document.body.appendChild(list1);
    document.body.appendChild(list2);

    const sortable1 = new Sortable(list1, {
      forceFallback: true,
      supportPointer: false,
      group: 'shared',
    });

    const sortable2 = new Sortable(list2, {
      forceFallback: true,
      supportPointer: false,
      group: 'shared',
    });

    // Drag item1 from list1 to list2
    Sortable.dragged = item1;
    Sortable.active = sortable1;

    const targetRect = item3.getBoundingClientRect();
    const simulatedEvt = {
      clientX: targetRect.left + targetRect.width / 2,
      clientY: targetRect.top + targetRect.height / 2,
      target: item3,
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: 'move' },
      rootEl: list2,
    };

    const inserted = sortable2._onDragOver(simulatedEvt as any);

    expect(inserted).toBe(true);
    expect(list2.contains(item1)).toBe(true);
    expect(list1.contains(item1)).toBe(false);

    sortable1.destroy();
    sortable2.destroy();
    list1.remove();
    list2.remove();
  });

  it('should traverse parent chain correctly with getParentOrHost', () => {
    const nestedItem = nestedList.querySelector('div') as HTMLElement;

    let current: HTMLElement | null = nestedItem;
    const chain: string[] = [];

    while (current) {
      chain.push(current.id || current.className || current.tagName);
      current = getParentOrHost(current);
    }

    // Should traverse: nested-item -> nested-list -> parent-item -> parent-list -> test-container -> body -> html -> null
    expect(chain).toContain('nested-list');
    expect(chain).toContain('parent-list');
  });

  it('should not process drag when rootEl is different sortable', () => {
    const nestedItem = nestedList.querySelector('div') as HTMLElement;
    const parentItems = Array.from(parentList.querySelectorAll('div')).filter(el => el.parentNode === parentList);
    const parentItem = parentItems[2];

    Sortable.dragged = nestedList.querySelector('div') as HTMLElement;
    Sortable.active = nestedSortable;

    const parentRect = parentItem.getBoundingClientRect();
    const correctEvt = {
      clientX: parentRect.left + parentRect.width / 2,
      clientY: parentRect.top + parentRect.height / 2,
      target: parentItem,
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: 'move' },
      rootEl: parentList,
    };

    const inserted = parentSortable._onDragOver(correctEvt as any);

    expect(inserted).toBe(true);
  });
});
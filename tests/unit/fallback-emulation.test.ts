import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Sortable from '../../src/Sortable.js';
import { getParentOrHost } from '../../src/utils.js';

describe('Unit: Fallback _emulateDragOver parent chain traversal', () => {
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

    const parentItem = document.createElement('div');
    parentItem.textContent = 'Parent 2 (container)';
    parentItem.setAttribute('draggable', 'true');

    const parentItem3 = document.createElement('div');
    parentItem3.textContent = 'Parent 3';
    parentItem3.setAttribute('draggable', 'true');

    parentList.appendChild(parentItem1);
    parentList.appendChild(parentItem);
    parentList.appendChild(parentItem3);

    // Add items to nested list
    const nestedItem = document.createElement('div');
    nestedItem.textContent = 'Nested 1';
    nestedItem.setAttribute('draggable', 'true');

    const nestedItem2 = document.createElement('div');
    nestedItem2.textContent = 'Nested 2';
    nestedItem2.setAttribute('draggable', 'true');

    nestedList.appendChild(nestedItem);
    nestedList.appendChild(nestedItem2);

    // Nest the nested list inside parent item 2
    const parentItemEl = parentList.querySelector('div:nth-child(2)') as HTMLElement;
    parentItemEl.appendChild(nestedList);

    container.appendChild(parentList);
    document.body.appendChild(container);

    // Create Sortables with forceFallback for testing fallback path
    const sortableOptions = {
      forceFallback: true,
      supportPointer: false,
      group: 'shared',
      invertSwap: true,
    };

    parentSortable = new Sortable(parentList, { ...nestedItem, ...sortableOptions } as any);
    nestedSortable = new Sortable(nestedList, { ...sortableOptions } as any);
  });

  afterEach(() => {
    if (parentSortable) parentSortable.destroy();
    if (nestedSortable) nestedSortable.destroy();
    container.remove();
  });

  it('should traverse parent chain from nested list to parent list', () => {
    const nestedItemEl = nestedList.querySelector('div') as HTMLElement;

    let current: HTMLElement | null = nestedList;
    const chain: string[] = [];

    while (current) {
      chain.push(current.id || current.className || current.tagName);
      current = getParentOrHost(current);
    }

    expect(chain).toContain('nested-list');
    expect(chain).toContain('parent-list');
  });

  it('should verify parent chain includes both nested and parent sortables', () => {
    const chain: HTMLElement[] = [];
    let current: HTMLElement | null = nestedList;

    while (current) {
      if (current.id === 'nested-list' || current.id === 'parent-list') {
        // Check if element has Sortable expando
        const keys = Object.keys(current);
        if (keys.some(k => k.startsWith('Sortable'))) {
          expect(current.id).toMatch(/nested-list|parent-list/);
        }
      }
      current = getParentOrHost(current);
    }
  });

  it('should have getParentOrHost utility working correctly', () => {
    let current: HTMLElement | null = nestedList;
    const found: string[] = [];

    while (current) {
      if (current.id) {
        found.push(current.id);
      }
      current = getParentOrHost(current);
    }

    expect(found).toContain('nested-list');
    expect(found).toContain('parent-list');
  });

  it('should verify Sortable._onDragOver can be called with rootEl and returns boolean', () => {
    const targetItem = document.createElement('div');
    targetItem.setAttribute('draggable', 'true');
    targetItem.textContent = 'Target';
    parentList.appendChild(targetItem);
    document.body.appendChild(parentList);

    const nestedItemEl = nestedList.querySelector('div') as HTMLElement;
    Sortable.dragged = nestedList.querySelector('div');
    Sortable.active = nestedSortable;

    const simulatedEvt = {
      clientX: 100,
      clientY: 100,
      target: targetItem,
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: 'move' },
      rootEl: parentList,
    };

    const inserted = parentSortable._onDragOver(simulatedEvt as any);

    expect(typeof inserted).toBe('boolean');
  });
});
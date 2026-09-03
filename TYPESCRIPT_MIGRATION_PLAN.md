# TypeScript Migration Plan for SortableJS

## Current Status
- **Branch**: `feat/typescript-migration` (based on master at 9353973)
- **PR**: #10 created on samuelfa/Sortable
- **Build**: Passing (all 3 bundles: core, esm, complete + minified)
- **Tests**: 108 failing (108 tests, 27 failed on chromium, 27 on firefox, 27 on webkit, 27 on mobile-touch)
- **TypeScript**: 200+ errors blocking compilation

---

## TypeScript Compilation Errors Summary

### Total Errors: 200+

### By Category:

#### 1. TypeScript Config & Imports (7 errors)
- `allowImportingTsExtensions` needs to be `true` in tsconfig.json
- Plugin index.ts files need `.ts` extensions removed from imports
- Script build files have `.ts` extensions in imports

#### 2. Missing Exports from `utils.ts` (Critical - affects 15+ files)
Missing exports causing cascade of errors:
- `on`, `off`, `closest`, `toggleClass`, `css`, `matrix`, `find`, `getWindowScrollingElement`, `getRect`, `isScrolledPast`, `getChild`, `lastChild`, `index`, `getRelativeScrollOffset`, `extend`, `throttle`, `cancelThrottle`, `scrollBy`, `clone`, `expando`, `getChildContainingRectFromElement`

#### 3. Type Definition Issues in `src/types.ts`
- **Duplicate `SortablePlugin` identifier** (lines 115 and 178)
- Missing `DOMRectInit` interface with `x`, `y`, `toJSON`
- Missing `Window` properties: `Polymer`, `jQuery`, `Zepto`, `__coverage__`, `__sortableTestOptions`
- Missing `HTMLElement` properties: `animated`, `animatingX`, `animatingY`, `toRect`, `sortableIndex`, `expando`, `scrollTop`, `scrollLeft`
- Missing `Event` properties: `to`, `from`, `item`, `clone`, `oldIndex`, `newIndex`, `oldDraggableIndex`, `newDraggableIndex`, `originalEvent`, `pullMode`, `dragged`, `draggedRect`, `related`, `relatedRect`, `willInsertAfter`

#### 4. `utils.ts` Type Issues (Critical - blocks 15+ files)
- Missing `export` on all functions
- `getRect` parameter types for `Window | HTMLElement`
- `getParentOrHost` return type
- `css` function signature and return types
- `matrix` function return type
- `getRect` parameter types for `Window | HTMLElement`
- `getParentAutoScrollElement` return type
- `getChildContainingRectFromElement` return type
- `getContentRect` return type with `toJSON`
- `getChild`, `lastChild`, `index` function signatures
- `getRelativeScrollOffset` parameter type
- `getParentAutoScrollElement` return type
- `getChildContainingRectFromElement` return type
- `getContentRect` return type with `toJSON`
- Missing `DOMRectInit` interface with `x`, `y`, `toJSON`

#### 4. `Animation.ts` Issues (27 errors)
- Duplicate `fromRect` declarations (lines 7, 16)
- `import type` vs `import` for Sortable
- Missing properties on HTMLElement: `fromRect`, `toRect`, `prevFromRect`, `prevToRect`, `thisAnimationDuration`, `animatingX`, `animatingY`, `animationResetTimer`, `animationTime`, `prevFromRect`, `prevToRect`, `thisAnimationDuration`, `animatingX`, `animatingY`
- DOMMatrix properties `f`, `e` accessed incorrectly (should use `a`, `b`, `c`, `d`, `e`, `f` or `m11`, `m12`, `m21`, `m22`)
- `Timeout` type mismatch

#### 5. `Sortable.ts` Issues (80+ errors)
- Missing imports from utils
- Missing `SortableConstructor` type reference
- Missing properties on `SortableConstructor` type
- Missing imports from utils
- Missing properties on `SortableConstructor` type
- Missing imports from global-events
- Missing `documentExists` variable
- Missing `sortables` array
- Missing `SortableConstructor` type reference

#### 6. `global-events.ts` (30+ errors)
- Missing imports from utils
- Event properties: `dataTransfer`, `clientX`, `clientY`, `touches`, `clientX`, `clientY`
- Missing `el` property on Sortable
- Type comparison issues

#### 7. `sortable-utils.ts` (30+ errors)
- Function argument count mismatches
- Missing `el` property on Sortable
- Event properties: `touches`, `dataTransfer`, `clientX`, `clientY`
- Missing `evt` variable
- Type comparison issues

#### 8. `EventDispatcher.ts` (2 errors)
- Missing imports from utils
- Missing `lastPutMode` on Sortable

#### 9. `PluginManager.ts` (1 error)
- Plugin construct signature

#### 10. `PluginManager.ts` (1 error)
- Plugin construct signature

#### 11. Scripts & Build Config
- `scripts/build.ts` - invalid `jsc` property for swc
- Script imports need `.ts` extensions removed

---

## Comprehensive Fix Plan

### Phase 1: Foundation (TypeScript Config & Imports) ✅ **DONE**
- [x] Update `tsconfig.json` with `allowImportingTsExtensions: true`
- [x] Fix script imports (remove `.ts` extensions)
- [x] Fix plugin index.ts imports (remove `.ts` extensions)
- [x] Fix script build imports
- [x] Remove `@rollup/plugin-typescript`, use `@rollup/plugin-swc` instead
- [x] Build passes

### Phase 2: Fix `utils.ts` Exports (Critical - blocks 15+ files) 🔄 **IN PROGRESS**
- [ ] Add `export` to all functions in `utils.ts`
- [ ] Fix `getRect` signature for `Window | HTMLElement` union
- [ ] Fix `getContentRect` return type (DOMRect with x, y, toJSON)
- [ ] Fix `getChildContainingRectFromElement` return type
- [ ] Fix `getChild`, `lastChild`, `index` function signatures
- [ ] Fix `getRelativeScrollOffset` parameter type
- [ ] Fix `getParentAutoScrollElement` return type
- [ ] Fix `extend` function
- [ ] Fix `getChildContainingRectFromElement` return type

### Phase 3: Fix Type Definitions (`src/types.ts`)
- [ ] Remove duplicate `SortablePlugin` declaration (lines 115 and 178)
- [ ] Add missing `DOMRectInit` interface with `x`, `y`, `toJSON`
- [ ] Add missing `Window` properties: `Polymer`, `jQuery`, `Zepto`, `__coverage__`, `__sortableTestOptions`
- [ ] Add missing `HTMLElement` properties: `animated`, `animatingX`, `animatingY`, `toRect`, `sortableIndex`, `expando`, `scrollTop`, `scrollLeft`
- [ ] Add missing `Event` properties: `to`, `from`, `item`, `clone`, `oldIndex`, `newIndex`, `oldDraggableIndex`, `newDraggableIndex`, `originalEvent`, `pullMode`, `dragged`, `draggedRect`, `related`, `relatedRect`, `willInsertAfter`
- [ ] Add missing `HTMLElement` properties: `animated`, `animatingX`, `animatingY`, `toRect`, `sortableIndex`, `expando`, `scrollTop`, `scrollLeft`
- [ ] Fix duplicate `SortablePlugin` declaration (lines 115 and 178)

### Phase 4: Fix `utils.ts` Type Issues
- [ ] Add `export` to all functions
- [ ] Fix `getRect` signature for `Window | HTMLElement` union
- [ ] Fix `getParentOrHost` return type
- [ ] Fix `css` function signature and return types
- [ ] Fix `matrix` function return type
- [ ] Fix `getRect` parameter types for `Window | HTMLElement`
- [ ] Fix `getParentAutoScrollElement` return type
- [ ] Fix `getChildContainingRectFromElement` return type
- [ ] Fix `getContentRect` return type with `toJSON`
- [ ] Fix `getChild`, `lastChild`, `index` function signatures
- [ ] Fix `getRelativeScrollOffset` parameter type
- [ ] Fix `getParentAutoScrollElement` return type
- [ ] Fix `getChildContainingRectFromElement` return type
- [ ] Fix `getContentRect` return type with `toJSON`
- [ ] Add `DOMRectInit` interface with `x`, `y`, `toJSON`

### Phase 5: Fix Other Source Files
- **Animation.ts**: Fix duplicate identifiers, fix DOMMatrix usage, fix HTMLElement property extensions
- **Sortable.ts**: Add missing imports, fix SortableConstructor references
- **EventDispatcher.ts**: Fix missing imports from utils
- **PluginManager.ts**: Fix Plugin construct signature
- **global-events.ts**: Fix Event interface extensions
- **sortable-utils.ts**: Fix function signatures and Event properties
- **global-events.ts**: Fix Event properties (dataTransfer, clientX/Y, etc.)
- **EventDispatcher.ts**: Fix missing imports

### Phase 6: Plugin Index Files & Scripts
- Fix plugin index.ts imports (remove .ts extensions)
- Fix scripts imports (remove .ts extensions)
- Fix build.ts jsc property issue

### Phase 7: Verification
- [ ] Run `npx tsc --noEmit` - should pass with 0 errors
- [ ] Run `npm run build` - should complete successfully
- [ ] Run `npm run test` - verify tests pass

---

## ESLint Status
✅ **PASSING** - No lint errors

---

## Test Failures (108 failures - 27 per browser × 4 browsers)

### Root Cause
Tests failing because:
1. **Sortable not loaded** - `Sortable is not a constructor` / `Sortable is not defined`
2. **404 errors** - Test server not serving files correctly
3. **Timeout errors** - `page.waitForFunction` timeout waiting for `window.Sortable`

### Root Cause
- Build outputs `Sortable.js` at root level
- Test HTML files reference `<script src="../Sortable.js"></script>`
- Playwright webServer serves from root (`.`) on port 8080
- Tests load `/tests/single-list.html` which references `<script src="../Sortable.js"></script>`

### Test Server Issues
- `reuseExistingServer: false` causes port conflicts in CI
- Server timeout too short (30s)
- Test timeout too short (5s)
- Server not serving files correctly in test environment

---

## Priority Order

| Priority | Task | Status |
|--------|------|--------|
| 1 | Fix TypeScript config & imports | ✅ DONE |
| 2 | Fix `utils.ts` exports | 🔄 IN PROGRESS |
| 3 | Fix `types.ts` definitions | ⏳ PENDING |
| 4 | Fix `utils.ts` type issues | 🔄 IN PROGRESS |
| 5 | Fix `Animation.ts` | ⏳ PENDING |
| 6 | Fix `Sortable.ts` | ⏳ PENDING |
| 6 | Fix `EventDispatcher.ts`, `PluginManager.ts` | ⏳ PENDING |
| 7 | Fix `global-events.ts`, `sortable-utils.ts`, `global-events.ts` | ⏳ PENDING |
| 8 | Fix plugin index files & scripts | ⏳ PENDING |
| 9 | Run `npx tsc --noEmit` - 0 errors | ⏳ PENDING |
| 10 | Run `npm run build` | ✅ DONE |
| 11 | Fix Playwright config & test server | ⏳ PENDING |
| 12 | Run `npm run test` | ⏳ PENDING |

---

## Next Steps

### Immediate (Next 2 hours)
1. **Complete `utils.ts` exports** - Add `export` to all functions
2. **Fix `types.ts`** - Remove duplicate `SortablePlugin`, add missing interfaces
3. **Fix `utils.ts` type signatures** - Parameter types, return types
4. **Fix `Animation.ts`** - Remove duplicates, fix DOMMatrix usage
5. **Fix `Sortable.ts`** - Add missing imports, fix static properties
6. **Fix remaining files** - EventDispatcher, PluginManager, global-events, sortable-utils
7. **Run `npx tsc --noEmit`** - Verify 0 errors
8. **Run `npm run build`** - Verify build passes
9. **Fix Playwright config** - Restore `reuseExistingServer: !process.env.CI`, increase timeouts
10. **Run tests** - Verify all 108 tests pass

---

## Notes

- **Build currently passes** - All 3 bundles generated and minified successfully
- **TypeScript errors**: 200+ errors blocking `tsc --noEmit`
- **Tests failing**: 108 failures (27 per browser × 4 browsers)
- **Build uses**: @rollup/plugin-swc (fast) + @rollup/plugin-babel
- **Test framework**: Playwright with 4 browsers (chromium, firefox, webkit, mobile-touch)
- **Test server**: `npx serve . -p 8080` serving from project root

---

## Next Immediate Action

**Start with `utils.ts` exports** - This is the critical path that blocks 15+ other files from compiling.

```bash
# Add export to all functions in utils.ts
# Fix function signatures for TypeScript
# Add missing DOMRectInit interface
# Then run: npx tsc --noEmit
```
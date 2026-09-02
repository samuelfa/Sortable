import Sortable from './entry-defaults.js';
import Swap from '../plugins/Swap.ts';
import MultiDrag from '../plugins/MultiDrag.ts';

// Mount plugins in a single call
Sortable.mount(new Swap(), new MultiDrag());

export default Sortable;

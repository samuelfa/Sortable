import Sortable from './entry-defaults.js';
import Swap from '../plugins/Swap/index.js';
import MultiDrag from '../plugins/MultiDrag/index.js';

// Mount plugins in a single call
Sortable.mount(new Swap(), new MultiDrag());

export default Sortable;

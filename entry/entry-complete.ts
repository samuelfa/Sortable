import Sortable from './entry-defaults.ts';
import Swap from '../plugins/Swap';
import MultiDrag from '../plugins/MultiDrag';

// Mount plugins in a single call
Sortable.mount(new Swap(), new MultiDrag());

export default Sortable;
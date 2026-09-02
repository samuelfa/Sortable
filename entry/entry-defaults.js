import Sortable from '../src/Sortable.ts';
import AutoScroll from '../plugins/AutoScroll/AutoScroll.ts';
import { RemoveOnSpill, RevertOnSpill } from '../plugins/OnSpill/OnSpill.ts';
// Extra
import Swap from '../plugins/Swap/Swap.ts';
import MultiDrag from '../plugins/MultiDrag/MultiDrag.ts';

Sortable.mount(new AutoScroll());
Sortable.mount(RemoveOnSpill, RevertOnSpill);

export default Sortable;

export {
	Sortable,

	// Extra
	Swap,
	MultiDrag,
};

declare function MultiDragPlugin(): ((sortable: any) => void) & {
    pluginName: string;
    utils: {
        /**
         * Selects the provided multi-drag item
         * @param  {HTMLElement} el    The element to be selected
         */
        select(el: any): void;
        /**
         * Deselects the provided multi-drag item
         * @param  {HTMLElement} el    The element to be deselected
         */
        deselect(el: any): void;
    };
    eventProperties(): {
        items: any[];
        clones: any[];
        oldIndicies: any[];
        newIndicies: any[];
    };
    optionListeners: {
        multiDragKey(key: any): any;
    };
};
export default MultiDragPlugin;

declare function SwapPlugin(): (() => void) & {
    pluginName: string;
    eventProperties(): {
        swapItem: any;
    };
};
export default SwapPlugin;

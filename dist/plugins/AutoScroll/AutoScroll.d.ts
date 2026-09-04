declare function AutoScrollPlugin(): (() => void) & {
    pluginName: string;
    initializeByDefault: boolean;
};
export default AutoScrollPlugin;

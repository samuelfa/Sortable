interface Plugin {
    new (...args: any[]): any;
    pluginName: string;
    initializeByDefault?: boolean;
    defaults?: Record<string, any>;
    eventProperties?(name: string): Record<string, any>;
    optionListeners?: Record<string, (value: any) => any>;
    [eventName: string]: any;
}
interface Sortable {
    options: Record<string, any>;
    [pluginName: string]: any;
}
declare const _default: {
    mount(plugin: Plugin): void;
    pluginEvent(eventName: string, sortable: Sortable, evt: any): void;
    initializePlugins(sortable: Sortable, el: HTMLElement, defaults: any, options: any): void;
    getEventProperties(name: string, sortable: Sortable): Record<string, any>;
    modifyOption(sortable: Sortable, name: string, value: any): any;
};
export default _default;

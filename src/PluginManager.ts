interface Plugin {
	new (...args: any[]): any;
	pluginName: string;
	initializeByDefault?: boolean;
	defaults?: Record<string, any>;
	eventProperties?(name: string): Record<string, any>;
	optionListeners?: Record<string, (value: any) => any>;
	[eventName: string]: any;
}

interface PluginManagerDefaults {
	initializeByDefault: boolean;
}

interface Sortable {
	options: Record<string, any>;
	[pluginName: string]: any;
}

const plugins: Plugin[] = [];

const defaults: PluginManagerDefaults = {
	initializeByDefault: true,
};

export default {
	mount(plugin: Plugin): void {
		for (const option in defaults) {
			if (Object.prototype.hasOwnProperty.call(defaults, option) && !(option in plugin)) {
				plugin[option] = defaults[option];
			}
		}

		plugins.forEach((p) => {
			if (p.pluginName === plugin.pluginName) {
				throw `Sortable: Cannot mount plugin ${plugin.pluginName} more than once`;
			}
		});

		plugins.push(plugin);
	},

	pluginEvent(eventName: string, sortable: Sortable, evt: any): void {
		this.eventCanceled = false;
		evt.cancel = () => {
			this.eventCanceled = true;
		};
		const eventNameGlobal = eventName + 'Global';
		plugins.forEach((plugin) => {
			if (!sortable[plugin.pluginName]) return;
			if (sortable[plugin.pluginName][eventNameGlobal]) {
				sortable[plugin.pluginName][eventNameGlobal]({ sortable, ...evt });
			}
			if (
				sortable.options[plugin.pluginName] &&
				sortable[plugin.pluginName][eventName]
			) {
				sortable[plugin.pluginName][eventName]({ sortable, ...evt });
			}
		});
	},

	initializePlugins(sortable: Sortable, el: HTMLElement, defaults: any, options: any): void {
		plugins.forEach((plugin) => {
			const pluginName = plugin.pluginName;
			if (!sortable.options[pluginName] && !plugin.initializeByDefault) return;

			const initialized = new plugin(sortable, el, sortable.options);
			initialized.sortable = sortable;
			initialized.options = sortable.options;
			sortable[pluginName] = initialized;

			Object.assign(defaults, initialized.defaults);
		});

		for (const option in sortable.options) {
			if (!Object.prototype.hasOwnProperty.call(sortable.options, option)) continue;
			const modified = this.modifyOption(sortable, option, sortable.options[option]);
			if (typeof modified !== 'undefined') {
				sortable.options[option] = modified;
			}
		}
	},

	getEventProperties(name: string, sortable: Sortable): Record<string, any> {
		let eventProperties: Record<string, any> = {};
		plugins.forEach((plugin) => {
			if (typeof plugin.eventProperties !== 'function') return;
			Object.assign(eventProperties, plugin.eventProperties.call(sortable[plugin.pluginName], name));
		});
		return eventProperties;
	},

	modifyOption(sortable: Sortable, name: string, value: any): any {
		let modifiedValue: any;
		plugins.forEach((plugin) => {
			if (!sortable[plugin.pluginName]) return;
			if (plugin.optionListeners && typeof plugin.optionListeners[name] === 'function') {
				modifiedValue = plugin.optionListeners[name].call(sortable[plugin.pluginName], value);
			}
		});
		return modifiedValue;
	},
};
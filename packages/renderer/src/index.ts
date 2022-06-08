import Alpine from "alpinejs";

import { PupperComponent as Component } from "./core/Component";

export default class Pupper {
    /**
     * The default component class
     */
    public static Component = Component;

    public static defineComponent = Component.create;

    /**
     * Sets a state in the global store.
     * @param name The state key.
     * @param value If set, will change the key value.
     * @returns 
     */
    public static store(name: string, value?: any) {
        return Alpine.store(name, value);
    };
    
    /**
     * The Pupper global state.
     */
    public static $global = Alpine.store("__GLOBAL__") as Record<string, any>;
};

// Sets the global magic
Alpine.magic("global", () => Pupper.$global);

module.exports = Pupper;
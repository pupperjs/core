import { Component as Component } from "./core/Component";

/**
 * Import all directives
 */
import "./core/vdom/directives/Conditional";
import "./core/vdom/directives/Loop";
import "./core/vdom/directives/Bind";
import "./core/vdom/directives/EventHandler";
import "./core/vdom/directives/Text";
import "./core/vdom/directives/HTML";
import "./core/vdom/directives/Component";

export default class Pupper {
    /**
     * The default component class
     */
    public static Component = Component;

    /**
     * An alias to Component.create
     */
    public static defineComponent: typeof Component["create"] = Component.create;

    /**
     * A handler for all saved store states.
     */
    public static $store: Record<string, any> = {};

    /**
     * Sets a state in the global store.
     * @param name The state key.
     * @param value If set, will change the key value.
     * @returns 
     */
    public static store(name: string, value?: any) {
        return value !== undefined ? this.$store[name] : this.$store[name] = value;
    };
    
    /**
     * The Pupper global state.
     */
    public static $global = this.store("__GLOBAL__");
};

module.exports = Pupper;
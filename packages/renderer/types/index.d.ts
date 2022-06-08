import { PupperComponent as Component } from "./core/Component";
export default class Pupper {
    /**
     * The default component class
     */
    static Component: typeof Component;
    static defineComponent: typeof Component.create;
    /**
     * Sets a state in the global store.
     * @param name The state key.
     * @param value If set, will change the key value.
     * @returns
     */
    static store(name: string, value?: any): void;
    /**
     * The Pupper global state.
     */
    static $global: Record<string, any>;
}

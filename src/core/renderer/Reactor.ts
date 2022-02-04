import type { Renderer } from "../Renderer";
import { ObservableChange } from "observable-slim";
import { Reactive } from "./Reactive";

import ForEachReactor from "./reactors/ForEach";
import HTMLReactor from "./reactors/HTML";
import HTMLAttributeReactor from "./reactors/HTMLAttribute";
import TextReactor from "./reactors/Text";
import IfReactor from "./reactors/If";

const debug = require("debug")("pupperjs:renderer:reactor");

export default class Reactor {
    // @ts-ignore
    private static readonly Reactors: Record<string, typeof Reactive.AbstractReactor> = {
        foreach: ForEachReactor,
        html: HTMLReactor,
        attribute: HTMLAttributeReactor,
        text: TextReactor,
        if: IfReactor
    };

    /**
     * The renderer related to this reactor
     */
    private renderer: Renderer;

    /**
     * A list of reactive properties with their respective elements
     */
    private reactive: Reactive.AbstractReactor[] = [];

    constructor(renderer: Renderer) {
        this.renderer = renderer;
    }

    /**
     * When a data property has changed
     * @param changes The observed changes
     */
    public onPropertyChange(changes: ObservableChange[]) {
        changes.forEach((change) => this.triggerChangeFor(change.currentPath, change.newValue));
    }

    /**
     * Checks if has reactivity for the given path
     * @param path The dot notation path to be checked
     * @returns 
     */
    public hasReactivityFor(path: string) {
        return this.reactive.some((reactive) => reactive.path === path);
    }

    /**
     * Retrieves all registered reactors
     * @returns 
     */
    public getReactors() {
        return this.reactive;
    }

    /**
     * Retrieves all registered reactors as an object that
     * the object index is the reactor path
     * @returns 
     */
    public getPathIndexedReactors() {
        const reactors: Record<string, Reactive.AbstractReactor[]> = {};

        this.reactive.forEach((reactor) => {
            reactors[reactor.path] = reactors[reactor.path] || [];
            reactors[reactor.path].push(reactor);
        });

        return reactors;
    }

    /**
     * Triggers reactivity changes for an object path
     * @param path The object dot notation path
     * @param newValue The new value that the object received
     */
    public triggerChangeFor(path: string, newValue?: any) {
        if (newValue === undefined) {
            return false;
        }

        const result = this.reactive.some((reactive) => {
            if (reactive.test(path)) {
                debug("%s handled by %s", path, reactive.constructor.name);

                reactive.handle(path, newValue);

                return true;
            }

            return false;
        });

        if (!result) {
            debug("%s failed to be handled", path);
        }
    }

    /**
     * Turns an element into a reactive element that will listen for object changes.
     * @param element The element that will be reactive
     * @param property The element property that will changed
     * @param command The reactivity command, optional
     * @param target The reactivity target
     * @param options Any options to be passed to the reactivity renderer
     */
    public addReactivity(element: HTMLElement | Element | Node, property: string, target?: Reactive.ReactiveTarget, options: Reactive.ReactiveNodeOptions = {}) {
        const reactor = Reactor.Reactors[target];

        const instance = new reactor(
            this.renderer,
            property,
            element,
            options
        );

        // Add it to the default property
        this.reactive.push(instance);

        // Check if has an initial value
        if (options.initialValue !== undefined) {
            this.triggerChangeFor(property, options.initialValue);
        }
    }

    /**
     * Binds an event to an element
     * @param element The element that will receive the event
     * @param event The event name
     * @param method The event method name
     * @returns 
     */
    public bindEvent(element: HTMLElement | Element | Node, event: string, method: string) {
        const callback = this.renderer.methods[method];

        if (callback === undefined) {
            debug("method %s was not found when binding %s for %O", method, event, element);
            return false;
        }

        element.addEventListener(event, callback);

        return true;
    }
}
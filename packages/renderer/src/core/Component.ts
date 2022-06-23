import { reactive } from "../model/Reactivity";
import { Renderer } from "./vdom/Renderer";
import { Slot } from "./vdom/renderer/Slot";

import type h from "virtual-dom/h";
import Debugger from "../util/Debugger";

/**
 * Represents a component's data.
 */
export interface IComponent<
    TData extends Record<string, any>,
    TMethods extends Record<string, CallableFunction>
> {
    /**
     * Component-related
     */

    /**
     * The function that renders the template HTML.
     */
    render?: (data: {
        h: typeof h
    }) => VirtualDOM.VTree;

    /**
     * Any data to be passed to the template.
     */
    data?: TData | (() => TData);

    /**
     * Any methods that can be called from the component.
     */
    methods?: TMethods;

    /**
     * Events
     */

    /**
     * Called when the component is mounted
     */
    created?: (this: Component) => any,

    /**
     * Called when the component is mounted.
     */
    mounted?: (this: Component) => any;
}

export class Component {
    $container: any;
    public static create<
        TMethods extends Record<string, CallableFunction>,
        TData extends Record<string, any>
    >(component: IComponent<TData, TMethods>) {
        return new Component(component) as (Component & TMethods);
    }

    /**
     * The component parent to this component.
     */
    public $parent: Component|null = null;

    /**
     * The state related to this component.
     */
    public $state = reactive({});

    /**
     * Any slots references.
     */
    public $slots: Record<string, Slot> = {};

    /**
     * Any templates references.
     */
    public $templates: Record<string, CallableFunction> = {};

    /**
     * Any component references.
     */
    public $refs: Record<string, HTMLElement> = {};

    /**
     * If it's the first time that the component is being rendered.
     */
    public firstRender = true;

    /**
     * The virtual DOM renderer instance.
     */
    public renderer = new Renderer(this);

    /**
     * The component container
     */
    public $rendered: Element;

    constructor(
        /**
         * The component properties.
         */
        public $component: IComponent<any, any>
    ) {
        // If has data
        if ($component?.data) {
            if (typeof $component.data === "function") {
                $component.data = $component.data();
            }

            for(let key in $component.data) {
                // If it's already registered
                if (key in this.$state) {
                    throw new Error("There's already a property named " + key + " registered in the component. Property names should be unique.");
                }

                this.$state[key] = $component.data[key];
            }
        }

        // If has methods
        if ($component?.methods) {
            for(let method in $component.methods) {
                this.$state[method] = $component.methods[method].bind(this);
            }
        }

        // For each generated data
        for(let key in this.$state) {
            // Prepare a descriptor for the base component
            const attributes: PropertyDescriptor = {
                get() {
                    return this.$state[key]
                }
            };

            // If it's not a function
            if (typeof this.$state[key] !== "function") {
                attributes.set = (value) => this.$state[key] = value;
            }

            // Define the property inside the component
            Object.defineProperty(this, key, attributes);
        }

        if (this.$component?.created) {
            this.$component.created.call(this);
        }
    }

    /**
     * The root component.
     */
    public get $root() {
        let parent = this.$parent;

        while(parent?.$parent !== null) {
            parent = parent?.$parent;
        }

        return parent;
    }

    /**
     * Enqueues a function to be executed in the next queue tick.
     * @param callback — The callback to be executed.
     * @returns 
     */
    public $nextTick(callback: CallableFunction) {
        return this.renderer.nextTick(callback);
    }

    /**
     * Registers a single template.
     * @param templateName The template name.
     * @param template The template render function.
     */
    public registerTemplate(templateName: string, template: CallableFunction) {
        this.$templates[templateName] = template;
    }

    /**
     * Replaces an element with a comment placeholder element.
     * @param element The element to be replaced.
     * @returns 
     */
    private replaceWithCommentPlaceholder(element: HTMLElement) {
        const comment = document.createComment("");

        if (!element.parentElement) {
            element.replaceWith(comment);
        } else {
            element.parentElement.insertBefore(comment, element);
            element.parentElement.removeChild(element);
        }

        return comment;
    }

    /**
     * Renders the template function into a div tag.
     */
    public async render() {
        if (this.firstRender) {
            this.firstRender = false;

            this.$rendered = await this.renderer.render();
            this.prepareDOM();
        }

        return this.$rendered;
    }

    /**
     * Prepares the component DOM references.
     * @todo this is buggy and making the components lose their references.
     * @todo move this to the vdom parsing instead.
     */
    public prepareDOM() {
        // Find all slots, templates and references
        const slots = Array.from(this.$rendered.querySelectorAll("slot"));
        const refs = Array.from(this.$rendered.querySelectorAll("[ref]"));

        // Iterate over all slots
        for(let slot of slots) {
            // Replace it with a comment tag
            const comment = this.replaceWithCommentPlaceholder(slot);

            // If it's a named slot
            if (slot.hasAttribute("name")) {
                // Save it
                this.$slots[slot.getAttribute("name")] = new Slot(comment.childNodes);
                this.$slots[slot.getAttribute("name")].container = comment;
            }
        }

        // Iterate over all references
        for(let ref of refs) {
            // Save it
            this.$refs[ref.getAttribute("ref")] = ref as HTMLElement;

            // Remove the attribute
            ref.removeAttribute("ref");
        }

        Debugger.debug("%O slots: %O", this, slots);
    }

    /**
     * Renders and mounts the template into a given element.
     * @param target The target element where the element will be mounted.
     * @returns 
     */
    public async mount(target: HTMLElement | Slot | string) {
        const rendered = await this.render();

        // If it's targeting a slot
        if (target instanceof Slot) {
            target.replaceWith(rendered);
            this.$container = rendered;
        } else
        // If it's targeting a string (selector)
        if (typeof target === "string") {
            this.$container = document.querySelector(target);
            this.$container?.append(rendered);
        } else
        // If it's targeint an element
        if (target instanceof Element) {
            this.$container = target;
            target.append(rendered);
        } else {
            throw new Error("Invalid mounting target " + target);
        }

        if ("mounted" in this.$component) {
            this.$component.mounted.call(this);
        }

        return rendered;
    }
}
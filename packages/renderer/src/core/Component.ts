import { reactive } from "../model/Reactivity";
import { Renderer } from "./vdom/Renderer";

/**
 * Represents a slot.
 */
interface Slot {
    /**
     * The comment holding the slot position.
     */
    container: HTMLElement | Comment;

    /**
     * All fallback nodes
     */
    fallbackNodes: Node[]
}

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
    render?: (...args: any[]) => VirtualDOM.VTree;

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
    public static create<
        TMethods extends Record<string, CallableFunction>,
        TData extends Record<string, any>
    >(component: IComponent<TData, TMethods>) {
        return new Component(component) as (Component & TMethods);
    }

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

    protected parser: DOMParser;

    /**
     * If it's the first time that the component is being rendered.
     */
    public firstRender = true;

    /**
     * The virtual DOM renderer instance.
     */
    protected renderer = new Renderer(this);

    constructor(
        /**
         * The component properties.
         */
        public $component: IComponent<any, any>
    ) {
        // If has methods
        if ($component?.methods) {
            for(let method in $component.methods) {
                this.$state[method] = $component.methods[method];
            }
        }

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
        let renderContainer: Element;

        if (this.firstRender) {
            this.firstRender = false;

            renderContainer = await this.renderer.renderFirst();

            // Find all slots, templates and references
            const slots = Array.from(renderContainer.querySelectorAll("slot"));
            const templates = Array.from(renderContainer.querySelectorAll("template"));
            const refs = Array.from(renderContainer.querySelectorAll("[ref]"));

            // Iterate over all slots
            for(let slot of slots) {
                // Replace it with a comment tag
                const comment = this.replaceWithCommentPlaceholder(slot);

                // If it's a named slot
                if (slot.hasAttribute("name")) {
                    // Save it
                    this.$slots[slot.getAttribute("name")] = {
                        container: comment,
                        fallbackNodes: [...comment.childNodes]
                    };
                }
            }

            // Iterate over all templates
            for(let childrenTemplate of templates) {
                // If it's a named template
                if (childrenTemplate.hasAttribute("name")) {
                    // Remove it from the DOM
                    childrenTemplate.parentElement.removeChild(childrenTemplate);

                    // Save it
                    this.$templates[childrenTemplate.getAttribute("name")] = () => {
                        return [...childrenTemplate.content.children].map((node) => node.innerHTML);
                    };
                }
            }

            // Iterate over all references
            for(let ref of refs) {
                // Save it
                this.$refs[ref.getAttribute("ref")] = ref as HTMLElement;

                // Remove the attribute
                ref.removeAttribute("ref");
            }
        }

        return renderContainer;
    }

    /**
     * Renders and mounts the template into a given element.
     * @param target The target element where the element will be mounted.
     * @returns 
     */
    public async mount(target: HTMLElement | Slot) {
        const rendered = await this.render();

        // If it's targeting a slot
        if (!(target instanceof HTMLElement)) {
            target.container.replaceWith(rendered);
        } else {
            target.append(rendered);
        }

        return rendered;
    }
}
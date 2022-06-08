import Alpine from "alpinejs";
import { DOMParser } from "./DomParser";

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
interface IComponent<
    TData extends Record<string, any>,
    TMethods extends Record<string, CallableFunction>
> {
    /**
     * Component-related
     */

    /**
     * The function that renders the template HTML.
     */
    render?: (data: Record<string, any>) => string;

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
    created?: (this: PupperComponent) => any,

    /**
     * Called when the component is mounted.
     */
    mounted?: (this: PupperComponent) => any;
}

export class PupperComponent {
    public static create<
        TMethods extends Record<string, CallableFunction>,
        TData extends Record<string, any>
    >(component: IComponent<TData, TMethods>) {
        return new PupperComponent(component) as (PupperComponent & TMethods);
    }

    /**
     * A unique identifier for this component.
     */
    protected $identifier: string;

    /**
     * All the data that will be passed to the renderer and Alpine.
     */
    private $data: Record<string, any> = {};

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

    constructor(
        /**
         * The component properties.
         */
        protected component: IComponent<any, any>
    ) {
        // If has methods
        if (component?.methods) {
            for(let method in component.methods) {
                this.$data[method] = component.methods[method];
            }
        }

        // If has data
        if (component?.data) {
            if (typeof component.data === "function") {
                component.data = component.data();
            }

            for(let key in component.data) {
                // If it's already registered
                if (key in this.$data) {
                    throw new Error("There's already a property named " + key + " registered in the component. Property names should be unique.");
                }

                this.$data[key] = component.data[key];
            }
        }

        // For each generated data
        for(let key in this.$data) {
            // Prepare a descriptor for the base component
            const attributes: PropertyDescriptor = {
                get() {
                    return this.$data[key]
                }
            };

            // If it's not a function
            if (typeof this.$data[key] !== "function") {
                attributes.set = (value) => this.$data[key] = value;
            }

            // Define the property inside the component
            Object.defineProperty(this, key, attributes);
        }

        if (this.component?.created) {
            this.component.created.call(this);
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
     * Renders a template and return the rendered child nodes.
     * @param template The template name to be rendered
     * @param data The template data
     * @returns 
     */
    public renderTemplate(template: string) {
        return this.renderStringToTemplate(
            this.$templates[template](this)
        ).content.children[0].childNodes;
    }

    /**
     * Renders a template string into a template tag with a div with [pup] attribute.
     * @param string The template string to be rendered.
     * @returns 
     */
    private renderStringToTemplate(string: string): HTMLTemplateElement {
        const renderContainer = document.createElement("template");

        // @todo this div needs to be removed
        renderContainer.innerHTML = `<div pup>${string}</div>`;

        return renderContainer;
    }

    /**
     * Renders the template function into a div tag.
     */
    public render(data?: Record<string, any>) {
        // Render the initial string
        const renderContainer = this.renderStringToTemplate(
            this.component.render(data)
        );

        // Find all slots, templates and references
        const slots = Array.from(renderContainer.content.querySelectorAll("slot"));
        const templates = Array.from(renderContainer.content.querySelectorAll("template"));
        const refs = Array.from(renderContainer.content.querySelectorAll("[ref]"));

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

        const container = renderContainer.content.children[0] as HTMLElement;

        return container;
    }

    /**
     * Renders and mounts the template into a given element.
     * @param target The target element where the element will be mounted.
     * @returns 
     */
    public async mount(target: HTMLElement | Slot) {
        this.$identifier = "p_" + String((Math.random() + 1).toString(36).substring(2));

        const rendered = this.render();
        rendered.setAttribute("x-data", this.$identifier);

        // Initialize the data
        Alpine.data(this.$identifier, () => {
            return {
                ...this.$data,
                init() {
                    if (this.component?.mounted) {
                        this.component.mounted.call(this);
                    }
                }
            };
        });

        // If it's targeting a slot
        if (!(target instanceof HTMLElement)) {
            const replaced = document.createElement("div");
            replaced.setAttribute("p-slot", "1");

            target.container.replaceWith(replaced);
            this.parser = new DOMParser(replaced);
            
        } else {
            // Append it to the virtual DOM
            this.parser = new DOMParser(target);
        }

        const mounted = await this.parser.appendChild(rendered);

        // Save a reference to the internal Alpine data proxy
        // @ts-ignore
        this.$data = mounted._x_dataStack[0];

        return mounted;
    }
}
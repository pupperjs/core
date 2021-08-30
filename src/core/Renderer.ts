import type pug from "pug";
import deepGetSet from "deep-get-set";
import observableSlim, { ObservableChange } from "observable-slim";

export namespace Renderer {
    export type ReactiveData = Record<string, any>;
    export type ReactiveTarget = "text" | "html" | "attribute";
    export type ReactiveCommand = "escape" | "literal";
}

export default class PupperRenderer {
    private static SYNTAX_REGEX = /(?: +)?\@pupperjs\:(?<command>.+)\((?<property>(?:[\w+]|\.| )+?)\)(?: +)?/;

    private template: pug.compileTemplate;
    public data: ProxyHandler<Renderer.ReactiveData> = {};
    private dom: HTMLDivElement;

    /**
     * A list of reactive properties with their respective elements
     */
    private reactive: Record<string, {
        element: (HTMLElement | Element | Node),
        target: Renderer.ReactiveTarget,
        command: Renderer.ReactiveCommand,
        key?: string
    }[]> = {};

    constructor(template: pug.compileTemplate, data?: Renderer.ReactiveData) {
        this.template = template;

        if (data) {
            this.setData(data);
        }
    }

    /**
     * When a data property has changed
     * @param changes The observed changes
     */
    onPropertyChange(changes: ObservableChange[]) {
        changes.forEach((change) => {
            // Check if has any handler registered for the given property
            if (this.reactive[change.currentPath] !== undefined) {
                // Trigger all of them
                this.reactive[change.currentPath].forEach((reactive) => {
                    console.log(reactive);

                    switch(reactive.target) {
                        // If it's targeting the text content
                        case "text":
                            reactive.element.textContent = change.newValue;
                        break;

                        // If it's targeting the HTML content
                        case "html":
                            (reactive.element as HTMLElement).innerHTML = change.newValue;
                        break;

                        // If it's targeting an attribute
                        case "attribute":
                            (reactive.element as HTMLElement).setAttribute(reactive.key, change.newValue);
                        break;
                    }
                });
            }
        });
    }

    private addReactive(element: HTMLElement | Element | Node, property: string, command: Renderer.ReactiveCommand, target: Renderer.ReactiveTarget, attribute?: string) {
        this.reactive[property] = this.reactive[property] || [];

        this.reactive[property].push({
            element,
            target,
            command,
            key: attribute
        });
    }

    /**
     * Retrieves all pupper runtime helpers
     * @returns 
     */
    private getHelpers() {
        const self = this;

        return {
            deepGetSet,

            /**
             * Pupper helpers
             */
            pupper: class PupperHelper {
                /**
                 * Retrieves an escaped value to be displayed
                 * @param key The path to the data to be escaped
                 * @returns 
                 */
                static escape(key: string): string {
                    const text = document.createTextNode(deepGetSet(self.getData(), key));
                    return text.textContent;
                }

                /**
                 * Retrieves a literal value to be displayed
                 * @param key The path to the data to be escaped
                 * @returns 
                 */
                static literal<T>(key: string): T {
                    return deepGetSet(self.getData(), key);
                }
            }
        };
    }

    /**
     * Retrieves the underlying pug template function
     * @returns 
     */
    getTemplateFn() {
        return this.template;
    }

    /**
     * Retrieves the template data
     * @returns 
     */
    getData() {
        return this.data;
    }

    /**
     * Replaces all the object data
     * @param data The new template data
     */
    setData(data: object) {
        const proxy = {
            get(target: Record<any, any>, key: string): any {
                if (key == "isProxy") {
                    return true;
                }

                const prop = target[key];

                // return if property not found
                if (typeof prop === "undefined") {
                    return;
                }

                if (prop === null) {
                    return null;
                }

                // Set value as proxy if object
                if (!prop.isProxy && typeof prop === "object") {
                    target[key] = new Proxy(prop, proxy);
                }

                return target[key];
            },
            set: this.onPropertyChange.bind(this)
        };

        this.data = observableSlim.create(data, true, this.onPropertyChange.bind(this));
    }

    /**
     * Retrieves the template "locals" variable context
     * @returns 
     */
    getTemplateContext() {
        return {
            ...this.getHelpers(),
            ...this.getData()
        };
    }

    /**
     * Renders the template into a string
     * @returns 
     */
    renderToString() {
        return this.template(this.getTemplateContext());
    }

    /**
     * Renders the template into a string
     * @returns 
     */
    render() {
        // Render the template
        const rendered = this.renderToString();

        // Convert into the final tag so we can parse it
        this.dom = document.createElement("div");
        this.dom.classList.add("pupper");
        this.dom.innerHTML = rendered;

        // Fix all children
        this.prepareNodes(this.dom.childNodes);

        return this.dom;
    }

    /**
     * Parses a single @pupperjs syntax
     * @param action The action / syntax to be parsed
     * @returns 
     */
    private parseAction(action: string) {
        // Parse it
        const parsed = action.match(PupperRenderer.SYNTAX_REGEX);
        
        if (parsed === null) {
            throw new Error("Failed to parse action \"" + action + "\"");
        }

        const command: Renderer.ReactiveCommand = (parsed.groups.command as Renderer.ReactiveCommand);
        const property = parsed.groups.property;

        let content = property;

        switch(command) {
            // If it's an escape call
            case "escape":
                content = this.getHelpers().pupper.escape(property);
            break;

            // If it's a literal call
            case "literal":
                content = this.getHelpers().pupper.literal(property);
            break;
        }

        return {
            content,
            command,
            property
        };
    }

    /**
     * Prepares nodes to be reactive
     * @param nodes The node list to be prepared
     */
    private prepareNodes(nodes: NodeListOf<ChildNode>) {
        // Iterate over all children nodes
        Array.prototype.forEach.call(nodes, (element: HTMLElement) => {
            // If has children, fix the children too
            if (element.hasChildNodes()) {
                this.prepareNodes(element.childNodes);
            }

            this.prepareNode(element);
        });
    }

    /**
     * Prepares a single HTML element
     * @param element The element to be prepared
     */
    private prepareNode(element: HTMLElement | Element) {
        // Check if it's a comment
        if (element instanceof Comment) {
            const comment = (element as Comment);
            
            // Check if it's not a pupper comment
            if (comment.textContent.indexOf("@pupperjs:") === -1) {
                return;
            }

            // Parse it
            const parsed = this.parseAction(comment.textContent);
            const text = document.createTextNode(parsed.content || "");

            // Replace with a text node
            element.replaceWith(text);

            // Set it as reactive
            this.addReactive(text, parsed.property, parsed.command, "text");
        } else {
            // Iterate over all the attributes
            element.getAttributeNames().forEach((attr) => {
                // Check if it doesn't start with our identifier
                if (element.getAttribute(attr).indexOf("@pupperjs:") === -1) {
                    return;
                }

                // Parse the attribute
                const value = element.getAttribute(attr);

                // Parse it
                const parsed = this.parseAction(value);

                if (!!parsed) {
                    element.removeAttribute(attr);
                }

                // Replace it
                element.setAttribute(attr, parsed.content);

                // Set it as reactive
                this.addReactive(element, parsed.property, parsed.command, "attribute", attr);
            });
        }
    }    

    /**
     * Renders the template to an element
     * @param element The element that will receive the children elements
     * @returns 
     */
    renderTo(element: string | HTMLElement | Element = document.body) {
        if (typeof element === "string") {
            element = document.querySelector(element);
        }

        return element.append(this.render());
    }
}
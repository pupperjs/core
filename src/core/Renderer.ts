import type pug from "pug";
import deepGetSet from "deep-get-set";
import observableSlim from "observable-slim";
import Reactor from "./renderer/Reactor";
import { Reactive } from "./renderer/Reactive";

const debug = require("debug")("pupperjs:renderer");

/**
 * Represents the final contents of a pupper.js file
 * It's the render function itself plus some useful things
 */
export type CompiledTemplate = pug.compileTemplate & {
    /**
     * A handler for all imports that this compiled template uses
     * where the key is the tag name, and the value is the compiled template
     */
    imports?: Record<string, CompiledTemplate>;
}

export interface NodeOptions {
    /**
     * Any prefix to be passed to the dot notation
     */
    pathPrefix?: string,

    /**
     * Any additional context indexes to search for values
     */
    context?: Record<string, any>
}

export enum NodePreparationResult {
    SKIP_CHILD,
    SUCCESS,
    FAILED
}

export class PupperHelper {
    constructor(
        protected renderer: Renderer
    ) {

    }

    /**
     * 
     * @param key The path to the data to be retrieved
     * @param context Any additional contexts
     * @returns 
     */
    public getValue(key: string, context?: Record<string, any>) {
        let value;

        // First, try from the context
        if (context !== undefined) {
            value = deepGetSet(context, key);
        }

        // Then try from the data itself
        if (value === undefined) {
            value = deepGetSet(this.renderer.getData(), key);
        }

        debug("retrieving value %s: %O", key, value);

        return value;
    }

    /**
     * Retrieves an escaped value to be displayed
     * @param key The path to the data to be escaped
     * @returns 
     */
    public escape(key: string, context?: Record<string, any>): string {
        const text = document.createTextNode(
            this.getValue(key, context)
        );

        return text.textContent;
    }

    /**
     * Retrieves a literal value to be displayed
     * @param key The path to the data to be retrieved
     * @returns 
     */
    public literal<T>(key: string, context?: Record<string, any>): T {
        return this.getValue(key, context);
    }
}

export class Renderer {
    private static SYNTAX_REGEX = /(?: +)?\@p\:(?<command>.+)\((?<property>.+?)\)(?: +)?/;

    /**
     * The pug compiled template function
     */
    private template: CompiledTemplate;

    /**
     * The reactive data
     */
    public data: ProxyHandler<Reactive.ReactiveData> = {};

    /**
     * The methods to be attributed with the elements
     */
    // @ts-ignore
    public methods: Reactive.ReactiveMethods = {};

    /**
     * The DOM element that will receive all children
     */
    private dom: HTMLElement;

    /**
     * The reactor for this renderer
     */
    public reactor: Reactor;

    /**
     * The cached helpers for this Renderer
     */
    public helpers: Record<string, any> & {
        deepGetSet: (object: object, key: any, value?: any) => any;

        /**
         * The methods related to this renderer
         */
        $methods: Reactive.ReactiveMethods;

        /**
         * The data related to this renderer
         */
        $data: ProxyHandler<Reactive.ReactiveData>;

        /**
         * Pupper helpers
         */
        pupper: PupperHelper;
    };

    /**
     * Creates a new renderer instance
     * @param template The pug compiled template function
     * @param data The data that will be used for reactivity
     */
    constructor(template: CompiledTemplate, settings?: {
        data?: Reactive.ReactiveData,
        methods?: Reactive.ReactiveMethods
    }) {
        this.template = template;

        // Create the reactor
        this.reactor = new Reactor(this);

        if (settings?.data) {
            this.setData(settings.data);
        }

        if (settings?.methods) {
            this.methods = settings.methods;
        }
    }

    /**
     * Retrieves all pupper runtime helpers
     * @returns 
     */
    private getHelpers() {
        if (this.helpers === undefined) {
            const self = this;

            this.helpers = {
                deepGetSet,

                /**
                 * The methods related to this renderer
                 */
                $methods: this.methods,

                /**
                 * The data related to this renderer
                 */
                $data: this.data,

                /**
                 * Pupper helpers
                 */
                pupper: new PupperHelper(this)
            };
        }

        return this.helpers;
    }

    /**
     * Retrieves the underlying pug template function
     * @returns 
     */
    public getTemplateFn() {
        return this.template;
    }

    /**
     * Retrieves the template data
     * @returns 
     */
    public getData() {
        return this.data;
    }

    /**
     * Replaces all the object data with new proxied data
     * @param data The new template data
     * @returns The proxied data object
     */
    public setData<T extends Record<any, any>>(data: T): ProxyHandler<T> {
        // Prepare the proxy
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
            set: this.reactor.onPropertyChange.bind(this.reactor)
        };

        this.data = observableSlim.create(data, true, this.reactor.onPropertyChange.bind(this.reactor));

        return this.data;
    }

    /**
     * Retrieves the context that will be passed to the template "locals" variable
     * @returns 
     */
    public getTemplateContext() {
        return {
            ...this.getHelpers(),
            ...this.getData()
        };
    }

    /**
     * Renders the template into a string
     * @returns 
     */
    public renderToString() {
        return this.template(this.getTemplateContext());
    }

    /**
     * Renders the template into a string
     * @returns 
     */
    public render() {
        // Convert into the final tag so we can parse it
        const target = document.createElement("div");
        target.classList.add("pupper");
        
        this.dom = this.renderTo(target);

        return target;
    }

    /**
     * Renders the template into a target element
     * @param target The target element
     * @returns 
     */
    public renderTo(target: string | HTMLElement = document.body) {
        // Render the template
        const rendered = this.renderToString();

        // Create a template tag and set the contents of the template to it
        const template = document.createElement("template");
        template.innerHTML = rendered;

        // Prepare the nodes
        this.prepareNodes(template.content.childNodes);

        // Append it to the DOM itself
        const targetEl: HTMLElement = target instanceof HTMLElement ? target : document.querySelector(target);
        targetEl.appendChild(template.content);

        this.dom = targetEl;

        return this.dom;
    }

    /**
     * Parses a single pupper syntax
     * @param command The command / syntax to be parsed
     * @param nodeOptions The node options that will be used for parsing
     * @returns 
     */
    private parseCommand(command: string, nodeOptions: NodeOptions = {}) {
        command = command.trim();

        // Parse it
        const parsed = command.match(Renderer.SYNTAX_REGEX);
        
        if (parsed === null) {
            throw new Error("Failed to parse command \"" + command + "\"");
        }

        const fn: Reactive.ReactiveCommand = (parsed.groups.command as Reactive.ReactiveCommand);
        const property = parsed.groups.property;

        let value = property;

        switch(fn) {
            // If it's an escape call
            case "escape":
                value = this.getEscapedValue(property, nodeOptions.context);
            break;

            // If it's a literal call
            case "literal":
                value = this.getLiteralValue(property, nodeOptions.context);
            break;
        }

        return {
            value,
            command: fn,
            property
        };
    }

    /**
     * Retrieves an HTML-escaped text value
     * @param property The property to be retrieved
     * @returns 
     */
    public getEscapedValue(property: string, context?: Record<string, any>) {
        return this.getHelpers().pupper.escape(property, context);
    }

    /**
     * Retrieves a literal value (as-is, without any treatment)
     * @param property The property to be retrieved
     * @returns 
     */
    public getLiteralValue<T>(property: string, context?: Record<string, any>): T {
        return this.getHelpers().pupper.literal<T>(property, context);
    }

    /**
     * Prepares nodes to be reactive
     * @param nodes The node list to be prepared
     * @param context The proxy context to the nodes; defaults to `this.data`
     * @returns
     */
    public prepareNodes(nodes: NodeListOf<ChildNode>, options?: NodeOptions) {
        for(let element of [...nodes]) {
            const result = this.prepareNode(element as HTMLElement, options);

            // Check if failed
            if (result === NodePreparationResult.FAILED) {
                // Stop parsing
                return false;
            }

            // Check if doesn't want to skip the child items
            if (result !== NodePreparationResult.SKIP_CHILD) {
                // If has children, fix the children too
                if (element.hasChildNodes()) {
                    this.prepareNodes(element.childNodes, options);
                }
            }
        }

        return true;
    }

    private scopedEval(expr: string, context: Record<string, any>) {
        const evaluator = Function.apply(
            null,
            [
                ...Object.keys(context),
                "expr",
                `return ${expr}`
            ]
        );

        return evaluator.apply(null, [...Object.values(context), expr]);
    }

    /**
     * Prepares a single HTML element
     * @param element The element to be prepared
     * @param context The proxy context to the node; defaults to `this.data`
     * @returns The preparation result
     */
    private prepareNode(element: HTMLElement | Element, options: NodeOptions = {}): NodePreparationResult {
        // Copy the default options
        options = {
            pathPrefix: "",
            ...options
        };

        // Check if it's a comment
        if (element instanceof Comment) {
            const comment = (element as Comment);

            // Check if it's not a pupper comment
            if (comment.textContent.indexOf("@p:") === -1) {
                return;
            }

            // Parse it
            const parsed = this.parseCommand(comment.textContent, options);
            const text = document.createTextNode(parsed.value || "");

            // Replace with a text node
            element.replaceWith(text);

            // Set it as reactive
            this.reactor.addReactivity(text, options.pathPrefix + parsed.property, "text", {
                command: parsed.command,
                initialValue: parsed.value,
                nodeOptions: options
            });
        } else
        // Check if it's a foreach
        if (element.tagName === "P:FOREACH") {
            // Retrieve the foreach attributes
            const array = element.getAttribute("array");
            const variable = element.getAttribute("var");
            const type = element.getAttribute("type");
            const html = element.innerHTML;

            const comment = document.createComment(" ");
            element.replaceWith(comment);

            /**
             * @todo move this to a sub class to manage this better.
             * For. God's. Sake.
             */

            // Add reactivity for it
            this.reactor.addReactivity(comment, options.pathPrefix + array, "foreach", {
                var: variable,
                type: type,
                innerHTML: html,
                initialValue: this.getLiteralValue(array),
                nodeOptions: options
            });

            // Skip children preparation
            return NodePreparationResult.SKIP_CHILD;
        } else
        // Check if it's an if
        if (element.tagName === "P:IF") {
            const condition = element.getAttribute("condition").match(/\@p\:conditional\((.+?)\)/)[1];
            const then = element.querySelector("p\\:then")?.innerHTML;
            const otherwise = element.querySelector("p\\:else")?.innerHTML;

            const comment = document.createComment(" ");
            element.replaceWith(comment);

            const regex = /\(?(?<var>[\w\."'()]+)(\s*[=!]\s*)?\)?/g;

            let variables: string[] = [];
            let variable;

            while(variable = regex.exec(condition)) {
                variables.push(variable[1]);
            }

            variables.forEach((variable) => {
                this.reactor.addReactivity(comment, options.pathPrefix + variable, "if", {
                    condition, then, otherwise
                });
            });
        } else
        // Check if it's an import
        if (element.tagName === "P:IMPORT") {
            const template = element.getAttribute("template");
            const data = element.getAttribute("data");
            const methods = element.getAttribute("methods");

            // Get the compiled template
            const compiledTemplate: CompiledTemplate = this.template.imports?.[template];

            // If the template doesn't exists
            if (compiledTemplate === undefined) {
                throw new Error("Tried to import an unknown template named " + template)
            }

            const contextualizedHelpers = { ...this.getHelpers(), ...options.context };

            const compiledData = data ? this.scopedEval(data, contextualizedHelpers) : this.data;
            const compiledMethods = methods ? this.scopedEval(methods, contextualizedHelpers) : this.methods;

            console.log(data, compiledData);

            // Create the renderer for this template
            const renderer = new Renderer(compiledTemplate, {
                data: compiledData,
                methods: compiledMethods
            });

            // Render the template and replace the element with it
            element.replaceWith(...renderer.render().childNodes);
        } else
        // Check if it's an HTML element
        if (element instanceof HTMLElement) {
            // Iterate over all the attributes
            element.getAttributeNames().forEach((attr) => {
                // Check if it's a bind attribute
                if (attr.startsWith("@p:bind:")) {
                    this.reactor.bindEvent(
                        element,
                        attr.replace("@p:bind:", ""),
                        element.getAttribute(attr)
                    );

                    element.removeAttribute(attr);

                    return;
                }

                // Check if it doesn't start with our identifier
                if (element.getAttribute(attr).indexOf("@p:") === -1) {
                    return;
                }

                // Parse the attribute
                const value = element.getAttribute(attr);

                // Parse it
                const parsed = this.parseCommand(value, options);

                if (!!parsed) {
                    element.removeAttribute(attr);
                }

                // Set it as reactive
                this.reactor.addReactivity(element, options.pathPrefix + parsed.property, "attribute", {
                    key: attr,
                    command: parsed.command,
                    initialValue: parsed.value,
                    nodeOptions: options
                });
            });
        }

        return NodePreparationResult.SUCCESS;
    }    
}
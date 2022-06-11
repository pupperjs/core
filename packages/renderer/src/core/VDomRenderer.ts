import { PupperComponent } from "./Component";
import {
    h,
    propsModule,
    attributesModule,
    styleModule,
    eventListenersModule,
    init,
    VNode
} from "snabbdom";

import { ISafeAsyncFunction, SafeAsyncFunction } from "./evaluator/SafeAsyncFunction";
import { IsNumeric, IsObject } from "../util/ObjectUtils";

const debug = require("debug")("pupper:vdom");

/**
 * Most of the evaluation functions were taken from alpine.js
 * Thanks, alpine.js!
 */
export class VDomRenderer {
    patch: ReturnType<typeof init>;

    protected evaluatorMemo: Record<string, ISafeAsyncFunction> = {};

    /**
     * The stack of states that formulates the context for rendering elements.
     */
    protected stateStack: Record<string, any>[] = [];

    constructor(
        protected component: PupperComponent
    ) {
        this.patch = init([
            propsModule,
            attributesModule,
            styleModule,
            eventListenersModule
        ]);

        this.stateStack.push(component.$state);
    }

    /**
     * Evaluates an expression string into a function.
     * @see https://github.com/alpinejs/alpine/blob/71ee8361207628b1faa14e97533373e9ebee468a/packages/alpinejs/src/evaluator.js#L61
     * @param expression The expression to be evaluated.
     * @returns 
     */
    protected evaluateString(expression: string) {
        // If this expression has already been evaluated
        if (this.evaluatorMemo[expression]) {
            return this.evaluatorMemo[expression];
        }
    
        // Some expressions that are useful in Alpine are not valid as the right side of an expression.
        // Here we'll detect if the expression isn't valid for an assignement and wrap it in a self-
        // calling function so that we don't throw an error AND a "return" statement can b e used.
        let rightSideSafeExpression = 0
            // Support expressions starting with "if" statements like: "if (...) doSomething()"
            || /^[\n\s]*if.*\(.*\)/.test(expression)
            // Support expressions starting with "let/const" like: "let foo = 'bar'"
            || /^(let|const)\s/.test(expression)
                ? `(() => { ${expression} })()`
                : expression

        let func: ISafeAsyncFunction;

        try {
            func = SafeAsyncFunction(rightSideSafeExpression);
        } catch (err) {
            console.warn("pupper.js warning: invalid expression", rightSideSafeExpression);
            throw err;
        }

        this.evaluatorMemo[expression] = func;

        return func;
    }

    protected generateState() {
        return this.stateStack.reduce((carrier, curr) => {
            for(let key in curr) {
                carrier[key] = curr[key];
            }

            return carrier;
        }, {});
    }

    /**
     * Evaluates an expression.
     * @param expression The expression to be evaluated.
     * @returns 
     */
    protected async evaluate<TExpressionResult = any>(expression: string | number | boolean | CallableFunction) {
        const state = this.generateState();

        if (typeof expression === "function") {
            return await expression(this.component.$state);
        }

        const func = this.evaluateString(String(expression));
        func.result = undefined;
        func.finished = false;

        try {
            return await func(func, state) as TExpressionResult;
        } catch(e) {
            console.warn("pupper.js warning: failed to evaluate " + expression);
            console.warn(e);
        }

        return undefined;
    }

    protected async maybeEvaluate(expression: string | number | boolean | CallableFunction) {
        try {
            return await this.evaluate(expression);
        } catch(e) {

        }

        return expression;
    }

    /**
     * Parses a "for" expression
     * @note This was taken from VueJS 2.* core. Thanks Vue!
     * @param expression The expression to be parsed.
     * @returns 
     */
    protected parseForExpression(expression: string | number | boolean | CallableFunction) {
        let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
        let stripParensRE = /^\s*\(|\)\s*$/g
        let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
        let inMatch = String(expression).match(forAliasRE)

        if (!inMatch) return

        let res: {
            items?: string;
            index?: string;
            item?: string;
            collection?: string;
        } = {};

        res.items = inMatch[2].trim()
        let item = inMatch[1].replace(stripParensRE, "").trim();
        let iteratorMatch = item.match(forIteratorRE)

        if (iteratorMatch) {
            res.item = item.replace(forIteratorRE, "").trim();
            res.index = iteratorMatch[1].trim()

            if (iteratorMatch[2]) {
                res.collection = iteratorMatch[2].trim();
            }
        } else {
            res.item = item;
        }

        return res;
    }

    /**
     * Evaluates a conditional expression.
     * @param node The node to be evaluated.
     * @param exp The if expression to be evaluated.
     * @returns 
     */
    protected async evaluateIf(node: VNode, exp: string | number | boolean | CallableFunction) {
        const evaluated = await this.evaluate<boolean>(exp);
        
        debug("evaluated if \"%s\" as %s", exp, evaluated);

        return evaluated ? await this.parseNode(node.children[0]) : null;
    }

    /**
     * Evaluates a loop expression.
     * @param node The node to be evaluated.
     * @param exp The loop expression to be evaluated.
     * @returns 
     */
    protected async evaluateLoop(node: VNode, exp: string | number | boolean | CallableFunction) {
        const parsed = this.parseForExpression(exp);
        let items: any[] = await this.evaluate(parsed.items);

        debug("evaluated for \"%s\" as %O", exp, parsed);

        // Support number literals, eg.: x-for="i in 100"
        if (IsNumeric(items)) {
            items = Array.from(Array(items).keys(), (i) => i + 1);
        } else
        // If it's an object
        if (IsObject(items)) {
            // Retrieve the entries from it
            items = Object.entries(items);
        } else
        // If nothing is found, default to an empty array.
        if (items === undefined) {
            items = [];
        }

        // The final node that will receive the children nodes.
        let finalNode: VNode = {
            children: [],
            sel: "div",
            data: {},
            elm: node.elm,
            key: node.key,
            text: null
        };

        // Iterate over all evaluated items
        for(let item in items) {
            // Push the current item to the state stack
            this.stateStack.push({
                [parsed.item]: items[item],
                [parsed.index]: item,
                [parsed.collection]: items
            });

            // Create the children from it
            const cloned = typeof node.children[0] === "string" ? node.children[0] : JSON.parse(JSON.stringify(node.children[0]));
            const parsedNode = await this.parseNode(cloned);

            finalNode.children.push(parsedNode);

            // Remove the current item from the state stack
            this.stateStack.pop();
        }

        return finalNode;
    }

    protected async parseNode(node: VNode | string): Promise<VNode | string | null> {
        // If it's null
        if (!node) {
            // Ignore it
            return null;
        }

        // Ignore if it's a string
        if (typeof node === "string") {
            return node;
        }

        debug("evaluating %s %O", node.sel || "text", node);

        // If it's a template tag
        if (node.sel === "template") {
            // If it's an "if"
            if ("x-if" in node.data.attrs) {
                // Evaluate and return the result of it
                return await this.evaluateIf(node, node.data.attrs["x-if"]);
            } else
            // If it's a "for"
            if ("x-for" in node.data.attrs) {
                return await this.evaluateLoop(node, node.data.attrs["x-for"]);
            } else {
                console.warn("pupper.js has found an unknown template node", node);
            }

            // Prevent from going further
            return node;
        }

        if (node.data !== undefined) {
            if ("attrs" in node.data) {
                // If has a "x-text" attribute
                if ("x-text" in node.data.attrs) {
                    node.children = node.children || [];

                    // Append the text to the children
                    node.children.push({
                        children: undefined,
                        sel: undefined,
                        data: undefined,
                        elm: undefined,
                        key: undefined,
                        text: await this.maybeEvaluate(node.data.attrs["x-text"])
                    });

                    delete node.data.attrs["x-text"];
                } else
                // If has a "x-html" attribute
                if ("x-html" in node.data.attrs) {
                    node.children = node.children || [];

                    // Append the HTML to the children
                    node.children.push({
                        children: undefined,
                        sel: undefined,
                        data: undefined,
                        elm: undefined,
                        key: undefined,
                        text: await this.evaluate(node.data.attrs["x-html"])
                    });

                    delete node.data.attrs["x-html"];
                }

                // Find events
                const events = Object.keys(node.data.attrs).filter((prop) => prop.startsWith("x-on:"));

                // Iterate over all events
                for(let prop of events) {
                    const event = prop.replace("x-on:", "");

                    // Bind the event to it
                    node.data.on = node.data.on || {};
                    const lastStack = [...this.stateStack];

                    const fn = node.data.attrs[prop];

                    node.data.on[event] = async ($event) => {
                        debug("handled %s event", event);

                        const savedStack = this.stateStack;

                        this.stateStack = lastStack;
                        this.stateStack.push({ $event });

                        await this.maybeEvaluate(fn);

                        this.stateStack = savedStack;
                    };

                    debug("binding event \"%s\" to \"%s\"", event, node.data.attrs[prop]);

                    // Remove the prop from the node
                    delete node.data.attrs[prop];
                }

                // Find property bindings
                const bindings = Object.keys(node.data.attrs).filter((prop) => prop.startsWith("x-bind:"));

                // Iterate over all bindings
                for(let prop of bindings) {
                    const bindingProp = prop.replace("x-bind:", "");

                    // Bind the property to it
                    node.data.attrs[bindingProp] = await this.maybeEvaluate(
                        node.data.attrs[prop]
                    );

                    debug("binding prop \"%s\" to \"%s\"", bindingProp, node.data.attrs[bindingProp]);

                    // Remove the prop from the node
                    delete node.data.attrs[prop];
                }
            }
        }

        // Parse children if needed
        if (node.children) {
            for(let i = 0; i < node.children.length; i++) {
                node.children[i] = await this.parseNode(node.children[i]);
            }

            // Filtren null ones
            node.children = node.children.filter((node) => !!node);
        }

        return node;
    }

    /**
     * Renders the virtual dom for the first time.
     * @returns 
     */
    public async renderFirst() {
        debug("first render");

        const vdom = this.component.$component.render({ h }) as VNode;

        await this.parseNode(vdom);

        const template = document.createElement("div");
        this.patch(template, vdom);

        return template;
    }
}
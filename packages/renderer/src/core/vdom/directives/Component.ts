import { directive, mapAttributes, replaceWith } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";

import Debugger from "../../../util/Debugger";

const debug = Debugger.extend("vdom:component");

mapAttributes(replaceWith(":", "x-bind:"));

/**
 * @directive x-component
 * @description Handles a component.
 */
directive("component", async (node, { value, expression, scope }) => {
    const evaluate = expression ? evaluateLater(expression) : () => {};

    await effect(async () => {
        try {
            const evaluated = await evaluate(scope);

            // Bind the evaluated value to it
            node.setAttribute(value, evaluated);
        
            // Remove the original attribute from the node
            node.removeAttribute("x-component:" + value);
            
            node.setDirty();
        } catch(e) {
            console.warn("[pupper.js] failed to bind property:");
            console.error(e);
        }
    });
});
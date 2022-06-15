import { directive, mapAttributes, replaceWith } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";

import Debugger from "../../../util/Debugger";

const debug = Debugger.extend("vdom:on");

mapAttributes(replaceWith(":", "x-bind:"));

/**
 * @directive x-bind
 * @description Adds an event handler to the node.
 */
directive("bind", async (node, { value, expression, scope }) => {
    const evaluate = expression ? evaluateLater(expression) : () => {};

    await effect(async () => {
        try {
            const evaluated = await evaluate(scope);

            // Bind the evaluated value to it
            node.setAttribute(value, evaluated);
        
            debug("binding prop \"%s\" to \"%s\"", value, evaluated);
        
            // Remove the original attribute from the node
            node.removeAttribute("x-bind:" + value);
            
            node.setDirty();
        } catch(e) {
            console.warn("[pupper.js] failed to bind property:");
            console.error(e);
        }
    });
});
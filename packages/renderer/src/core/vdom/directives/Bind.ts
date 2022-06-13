import { directive, mapAttributes, startingWith as replaceWith } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";

const debug = require("debug")("pupper:vdom:on");

mapAttributes(replaceWith("@", "x-on:"));
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
            console.warn("[pupperjs] failed to bind property:");
            console.error(e);
        }
    });
});
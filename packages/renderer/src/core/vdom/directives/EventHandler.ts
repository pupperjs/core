import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";

const debug = require("debug")("pupper:vdom:on");

/**
 * @directive x-on
 * @description Adds an event handler to the node.
 */
directive("on", async (node, { value, expression, scope }) => {
    try {
        const evaluate = expression ? evaluateLater(expression) : () => {};

        node.addEventListener(value, async ($event: any) => {
            debug("handled %s event", value);
            evaluate(scope);
        });

        // Remove the prop from the node
        node.removeAttribute("x-on:" + value);
    } catch(e) {
        console.warn("[pupperjs] failed to evaluate event handler:");
        console.error(e);
    }
});
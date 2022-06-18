import { directive, mapAttributes, replaceWith } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";

import Debugger from "../../../util/Debugger";

const debug = Debugger.extend("vdom:on");

mapAttributes(replaceWith("@", "x-on:"));

/**
 * @directive x-on
 * @description Adds an event handler to the node.
 */
directive("on", async (node, { value, expression, scope }) => {
    try {
        const evaluate = expression ? evaluateLater(expression) : () => {};

        debug("will handle event \"%s\" to %O", value, evaluate);

        node.addEventListener(value, async ($event: any) => {
            debug("handled %s event", value);
            
            const evScope = { ...scope, $event };

            evaluate(evScope);
        });

        // Remove the prop from the node
        node.removeAttribute("x-on:" + value);
    } catch(e) {
        console.warn("[pupper.js] failed to evaluate event handler:");
        console.error(e);
    }
});
import { RendererNode } from "../../../model/vdom/RendererNode";
import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { walk } from "../../../model/NodeWalker";
import { effect } from "../../../model/Reactivity";

import Debugger from "../../../util/Debugger";
import { ConditionalNode } from "../nodes/ConditionalNode";

const debug = Debugger.extend("vdom:directives:conditional");

/**
 * @directive x-if
 * @description Conditionally renders a tag's children nodes if the condition is met.
 */
directive("if", async (node: ConditionalNode, { expression, scope }) => {
    const evaluate = evaluateLater(expression);

    let lastValue: boolean = null;

    if (!node.hasConsequent()) {
        Debugger.error("node %O has no consequence.", node);
    }

    const removeEffect = await effect(async () => {
        debug("running");

        try {
            const value = await evaluate(scope);

            if (lastValue === value) {
                return;
            }

            lastValue = value;

            debug("%s evaluated to %O", expression, value);

            // Clear the current children
            node.clearChildren();

            let cloned: RendererNode[];

            // If the conditional matched
            if (value) {
                cloned = node.cloneConsequent();
            } else
            // If has an alternate
            if (node.hasAlternate()) {
                cloned = node.cloneAlternate();
            }

            if (cloned) {
                // Clone it into the DOM
                node.append(
                    ...await walk(cloned, scope)
                );
            }

            node.setIgnored();
            node.setDirty().setChildrenDirty(true, false);
        } catch(e) {
            Debugger.error("failed to evaluate conditional \"%s\"", expression);
            Debugger.error("last scope was %O", scope);

            throw e;
        }

        debug("ended");
    });

    node.addEventListener("DOMNodeRemoved", removeEffect);
});
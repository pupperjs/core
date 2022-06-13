import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { walk } from "../../../model/NodeWalker";
import { effect } from "../../../model/Reactivity";

const debug = require("debug")("pupper:vdom:directives:conditional");

/**
 * @directive x-if
 * @description Conditionally renders a tag's children nodes if the condition is met.
 */
directive("if", async (node, { expression, scope }) => {
    const evaluate = evaluateLater(expression);

    // Save and remove the children
    const children = node.children;
    const comment = node.replaceWithComment();

    await effect(async () => {
        if (comment.isBeingIgnored()) {
            return;
        }

        try {
            const value = await evaluate(scope);

            debug("%s evaluated to %O", expression, value);

            if (value) {
                comment.insertBefore(
                    ...await walk(children, scope)
                );
            }

            comment.parent.setDirty();
        } catch(e) {
            console.warn("[pupperjs] failed to evaluate conditional:");
            console.error(e);
        }
    });
});
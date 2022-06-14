import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { walk } from "../../../model/NodeWalker";
import { effect } from "../../../model/Reactivity";
import { PupperNode } from "../Node";

const debug = require("debug")("pupper:vdom:directives:conditional");

/**
 * @directive x-if
 * @description Conditionally renders a tag's children nodes if the condition is met.
 */
directive("if", async (node, { expression, scope }) => {
    const evaluate = evaluateLater(expression);

    // Save and remove the children
    const children = node.children;
    node = node.replaceWithComment();
    node.setIgnored();
    node.setRenderable(false);

   let clones: PupperNode[] = [];
   let lastValue: boolean = null;

    await effect(async () => {
        try {
            const value = await evaluate(scope);

            if (lastValue === value) {
                return;
            }

            lastValue = value;

            debug("%s evaluated to %O", expression, value);

            // If already rendered the clones
            if (clones.length) {
                clones.forEach((clone) => clone.delete());
                clones = [];
            }

            // If the conditional matched
            if (value) {
                // Clone them into the DOM
                clones = await walk(children.map((child) => child.clone().setParent(node.parent)), scope);
                node.insertBefore(...clones);
            }

            node.parent.setDirty();
        } catch(e) {
            console.warn("[pupperjs] failed to evaluate conditional:");
            console.error(e);
        }
    });
});
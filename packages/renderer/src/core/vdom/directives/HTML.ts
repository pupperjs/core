import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";
import { PupperNode } from "../Node";
import dom2vdom from "@pupperjs/dom2vdom";

import h from "virtual-dom/h";

/**
 * @directive x-html
 * @description Sets an element inner HTML.
 */
directive("html", async (node, { expression, scope }) => {
    const evaluate = evaluateLater(expression);

    await effect(async () => {
        try {
            const html = await evaluate(scope) as string;
            const evaluatedNode = dom2vdom(html, h) as VirtualDOM.VTree;

            node.appendChild(
                new PupperNode(evaluatedNode, node.parent, node.renderer)
            );

            node.removeAttribute("x-html");

            node.setDirty();
        } catch(e) {
            console.warn("[pupperjs] failed to set inner HTML:");
            console.error(e);
        }
    });
});
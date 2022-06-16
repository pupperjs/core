import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";
import { PupperNode } from "../Node";
import dom2vdom from "@pupperjs/dom2vdom";

import h from "virtual-dom/h";
import { VTree } from "virtual-dom";

/**
 * @directive x-html
 * @description Sets an element inner HTML.
 */
directive("html", async (node, { expression, scope }) => {
    const evaluate = evaluateLater(expression);

    let replacedNode: PupperNode = null;

    const escape = node.getAttribute("x-escape");
    node.removeAttribute("x-escape");

    await effect(async () => {
        try {
            let content: string | VTree = await evaluate(scope) as string;
            
            if (!escape) {
                const evaluatedNode = dom2vdom(content, h) as VirtualDOM.VTree;
                content = evaluatedNode;
            }

            if (replacedNode) {
                replacedNode.delete();
            }

            replacedNode = new PupperNode(content, node.parent, node.renderer);
            node.insertBefore(replacedNode);
            node.delete();

            node.parent.setDirty();
        } catch(e) {
            console.warn("[pupper.js] failed to set inner HTML:");
            console.error(e);
        }
    });
});
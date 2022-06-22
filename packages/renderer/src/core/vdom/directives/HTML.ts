import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";
import { RendererNode } from "../../../model/vdom/RendererNode";
import Debugger from "../../../util/Debugger";

import dom2vdom from "@pupperjs/dom2vdom";

import h from "virtual-dom/h";
import { VTree } from "virtual-dom";

/**
 * @directive x-html
 * @description Sets an element inner HTML.
 */
directive("html", async (node, { expression, scope }) => {
    const evaluate = evaluateLater(expression);

    let replacement: RendererNode = null;

    const escape = node.getAttribute("x-escape");
    node.removeAttribute("x-escape");

    await effect(async () => {
        try {
            let content: string | VTree = await evaluate(scope) as string;
            
            // If doesn't want escaping
            if (!escape) {
                // Parse it as HTML
                const evaluatedNode = dom2vdom(content, h) as VirtualDOM.VTree;
                content = evaluatedNode;
            }

            let insertPosition = replacement !== null ? replacement.getIndex() : node.getIndex();

            replacement = new RendererNode(content, node.parent, node.renderer);
            node.parent.children[insertPosition].replaceWith(replacement);
            node.parent.setDirty();
        } catch(e) {
            console.warn("pupper.js has failed to set inner HTML:");
            Debugger.warn("scope was %O", scope);
            console.error(e);
        }
    });
});
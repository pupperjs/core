import { directive } from "../../../model/Directive";
import { maybeEvaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";
import { PupperNode } from "../Node";

/**
 * @directive x-text
 * @description Sets an element inner text.
 * 
 * @todo When a buffered text is given, no text is displayed.
 *       Maybe the HTML to VDom is treating buffered text incorrectly.
 */
directive("text", async (node, { expression, scope }) => {
    const evaluate = maybeEvaluateLater(expression);

    let replacedNode: PupperNode = null;

    await effect(async () => {
        try {
            const text = await evaluate(scope) as string;

            if (!text) {
                console.warn(`pupper.js evaluated x-text expression "${expression}" as`, undefined);
                return;
            }

            if (replacedNode) {
                replacedNode = replacedNode.replaceWith(
                    new PupperNode(text, node, node.renderer)
                )[0];
            } else {
                replacedNode = new PupperNode(text, node, node.renderer);
                node.appendChild(replacedNode);
                node.removeAttribute("x-text");
            }

            node.setDirty();
        } catch(e) {
            console.warn("[pupperjs] failed to set inner text:");
            console.error(e);
        }
    });
});
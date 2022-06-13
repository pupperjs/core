import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";
import { Node } from "../Node";

/**
 * @directive x-html
 * @description Sets an element inner HTML.
 */
directive("html", async (node, { expression, scope }) => {
    const evaluate = evaluateLater(expression);

    await effect(async () => {
        try {
            const html = await evaluate(scope) as string;

            node.appendChild(
                new Node(html, node.parent, node.renderer)
            );

            node.removeAttribute("x-html");

            node.setDirty();
        } catch(e) {
            console.warn("[pupperjs] failed to set inner HTML:");
            console.error(e);
        }
    });
});
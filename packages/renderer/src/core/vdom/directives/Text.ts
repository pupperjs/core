import { directive } from "../../../model/Directive";
import { maybeEvaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";
import { Node } from "../Node";

/**
 * @directive x-text
 * @description Sets an element inner text.
 */
directive("text", async (node, { expression, scope }) => {
    const evaluate = maybeEvaluateLater(expression);

    await effect(async () => {
        try {
            const text = await evaluate(scope) as string;

            if (!text) {
                console.warn(`pupper.js evaluated x-text expression "${expression}" as`, undefined);
                return;
            }

            if (node.tag === "text") {
                node.replaceWith(new Node(text, node.parent, node.renderer));
            } else {
                node.appendChild(
                    new Node(text, node, node.renderer)
                );

                node.removeAttribute("x-text");
            }

            node.setDirty();
        } catch(e) {
            console.warn("[pupperjs] failed to set inner text:");
            console.error(e);
        }
    });
});
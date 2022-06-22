import { Component } from "../../../core/Component";
import { Renderer } from "../../../core/vdom/Renderer";
import Debugger from "../../../util/Debugger";
import h from "virtual-dom/h";
import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";
import { walk } from "../../../model/NodeWalker";

/**
 * @directive x-component
 * @description Handles a component.
 */
directive("component", async (node, { expression, scope }) => {
    const evaluate = evaluateLater(/*js*/`$component.$component.components?.["${expression}"]`);

    await effect(async () => {
        try {
            const component = await evaluate(scope) as Component;

            Debugger.warn("component %s resolved to %O", expression, component);

            // Remove the component attribute
            node.removeAttribute("x-component");

            // Pass all attributes as $props to the scope
            const newScope = scope;

            const attrs = node.getAttributesAndProps();
            for(let key in attrs) {
                scope[key] = attrs[key];
            }

            // Remove the original attribute from the node
            node.replaceWith(
                await walk(
                    Renderer.createNode(
                        component.$component.render({ h }),
                        node.parent,
                        node.renderer
                    ), newScope
                )
            );
        } catch(e) {
            console.warn("[pupper.js] failed to bind property:");
            console.error(e);
        }
    });
});
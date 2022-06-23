import { Component } from "../../../core/Component";
import Debugger from "../../../util/Debugger";
import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { effect } from "../../../model/Reactivity";

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

            // Remove the x-component attribute
            node.removeAttribute("x-component");

            // Parse all attributes into the component state
            const attrs = node.getAttributesAndProps();
            for(let key in attrs) {
                component.$state[key] = evaluateLater(attrs[key]);

                if (component.$state[key] instanceof Function) {
                    component.$state[key] = await component.$state[key](scope);
                }
            }

            // Set the parent component
            component.$parent = scope.$component as Component;

            console.error(component.renderer.generateScope());

            const rendered = await component.renderer.renderToNode();
            rendered.setDirty(false);
            rendered.setChildrenDirty(false);

            // Remove the original attribute from the node
            node.replaceWith(rendered);
        } catch(e) {
            console.warn("pupper.js has failed to create component:");
            console.error(e);
        }
    });
});
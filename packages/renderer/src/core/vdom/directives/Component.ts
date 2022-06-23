import Debugger from "../../../util/Debugger";
import { Component } from "../../../core/Component";
import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { ComponentNode } from "../nodes/ComponentNode";

/**
 * @directive x-component
 * @description Handles a component.
 */
directive("component", async (node: ComponentNode, { expression, scope }) => {
    const evaluate = evaluateLater(/*js*/`$component.$component.components?.["${expression}"]`);
    const component = await evaluate(scope) as Component;

    Debugger.warn("component %s resolved to %O", expression, component);

    node.setScope(scope);
    await node.setComponent(component);
});
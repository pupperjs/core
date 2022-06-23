import { evaluateLater } from "../../../model/Evaluator";
import { Component } from "../../../core/Component";
import { PupperNode } from "../../../model/vdom/PupperNode";
import { Renderer } from "../Renderer";

export class ComponentNode extends PupperNode {
    public component: Component;
    public scope: Record<string, any>;

    protected rendered: Awaited<ReturnType<Renderer["renderToNode"]>>;

    public setScope(scope: Record<string, any>) {
        this.scope = scope;
        return this;
    }

    public async setComponent(component: Component) {
        this.component = component;

        // Remove the x-component attribute
        this.removeAttribute("x-component");

        // Parse all attributes into the component state
        const attrs = this.getAttributesAndProps();
        for(let key in attrs) {
            this.component.$state[key] = evaluateLater(attrs[key]);

            if (this.component.$state[key] instanceof Function) {
                this.component.$state[key] = await this.component.$state[key](this.scope);
            }
        }

        // Set the parent component
        this.component.$parent = this.scope.$component as Component;

        this.rendered = await this.component.renderer.renderToNode();

        this.rendered.setDirty(false);
        this.rendered.setChildrenDirty(false);

        return this;
    }

    public toVNode() {
        // Remove the original attribute from the node
        return this.rendered.toVNode();
    }
}
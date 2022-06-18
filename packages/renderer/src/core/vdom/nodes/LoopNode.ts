import { PupperNode } from "../../../model/vdom/PupperNode";
import { RendererNode } from "../../../model/vdom/RendererNode";
import { Renderer } from "../Renderer";

export class LoopNode extends PupperNode {
    declare public body: RendererNode[] | undefined;

    constructor(
        node: VirtualDOM.VNode,
        parent: RendererNode | null = null,
        renderer: Renderer
    ) {
        super(node, parent, renderer);
    }

    public clone() {
        const clone = new LoopNode(this.node, this.parent, this.renderer);
        clone.body = this.body.map((child) => child.clone());

        return clone;
    }

    protected initNode() {
        super.initNode();

        this.body = this.children.map((child) => child.delete());
    }
}
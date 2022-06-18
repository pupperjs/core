import { Renderer } from "../../core/vdom/Renderer";
import { RendererNode } from "./RendererNode";

export class PupperNode extends RendererNode {
    constructor(
        node: VirtualDOM.VNode,
        parent: RendererNode | null = null,
        renderer: Renderer
    ) {
        super(node, parent, renderer);
    }

    public isRenderable(): boolean {
        return false;
    }

    public toVNode() {
        let node: (VirtualDOM.VTree | string)[] = [];

        this.children.forEach((child) => {
            const result = child.toVNode();

            if (Array.isArray(result)) {
                node.push(...result);
                return;
            }

            node.push(result);
        })
        
        return node;
    }
}
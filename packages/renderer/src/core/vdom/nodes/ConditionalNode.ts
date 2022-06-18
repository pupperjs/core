import { RendererNode } from "../../../model/vdom/RendererNode";
import { PupperNode } from "../../../model/vdom/PupperNode";
import { Renderer } from "../Renderer";

export class ConditionalNode extends PupperNode {
    /**
     * The consequence if the condition is met.
     */
    declare private consequent: RendererNode[] | undefined;

    /**
     * The alternative consequence if the condition is not met.
     */
    declare private alternate: RendererNode[] | undefined;

    constructor(
        node: VirtualDOM.VNode,
        parent: RendererNode | null = null,
        renderer: Renderer
    ) {
        super(node, parent, renderer);
    }

    protected initNode() {
        super.initNode();

        this.consequent = this.children.find((child) => child.getAttribute("x-if-cond") === "consequent")?.delete().children;
        this.alternate = this.children.find((child) => child.getAttribute("x-if-cond") === "alternate")?.delete().children;

        // If has no consequent
        if (!this.consequent) {
            throw new Error("Found a conditional node without consequence.");
        }
    }

    public clone() {
        const clone = new ConditionalNode(this.node, this.parent, this.renderer);

        clone.consequent = this.cloneConsequent();
        clone.alternate = this.cloneAlternate();

        return clone;
    }

    /**
     * Determines if has the conditional has a consequence (then).
     * @returns 
     */
    public hasConsequent() {
        return this.consequent !== undefined;
    }
    
    /**
     * Determines if has the conditional has an alternative (else).
     * @returns 
     */
    public hasAlternate() {
        return this.alternate !== undefined;
    }

    /**
     * Clone the consequent nodes.
     * @returns 
     */
    public cloneConsequent() {
        return this.consequent.map((child) => child.clone().setParent(this));
    }

    /**
     * Clone the alternate nodes.
     * @returns 
     */
    public cloneAlternate() {
        return this.alternate?.map((child) => child.clone().setParent(this));
    }
}
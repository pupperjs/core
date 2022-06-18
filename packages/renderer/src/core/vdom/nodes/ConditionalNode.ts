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

        clone.consequent = this.cloneConsequence();
        clone.alternate = this.cloneAlternative();

        return clone;
    }

    public hasConsequence() {
        return this.consequent !== undefined;
    }

    public getConsequence() {
        return this.consequent;
    }

    public hasAlternative() {
        return this.alternate !== undefined;
    }

    public getAlternative() {
        return this.alternate;
    }

    public cloneConsequence() {
        return this.consequent.map((child) => child.clone());
    }

    public cloneAlternative() {
        return this.alternate?.map((child) => child.clone());
    }
}
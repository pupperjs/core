import { NodeModel } from "../../../model/core/NodeModel";
import { BlockedCompilerNode } from "../../../model/core/nodes/BlockedCompilerNode";
import { CompilerNode, TNodes } from "../../../model/core/nodes/CompilerNode";
import { Pug } from "../../../typings/pug";
import Plugin, { TCompilerNode } from "../../Plugin";

export class ConditionalNode extends BlockedCompilerNode<Pug.Nodes.ConditionalNode> {
    protected consequent: TCompilerNode[] = [];
    protected alternate: TCompilerNode[] = [];

    constructor(
        node: Pug.Nodes.ConditionalNode,
        parent: NodeModel
    ) {
        super(node, parent);

        if (node.consequent) {
            for(let consequent of node.consequent.nodes) {
                this.consequent.push(
                    Plugin.createNode(consequent, this)
                );
            }
        }

        if (node.alternate) {
            for(let alternate of node.alternate.nodes) {
                this.alternate.push(
                    Plugin.createNode(alternate, this)
                );
            }
        }
    }

    /**
     * Retrieves the condition to be tested if true or false.
     * @returns 
     */
    public getCondition() {
        return this.pugNode.test;
    }

    /**
     * Sets the condition to be tested if true or false.
     * @returns 
     */
    public setCondition(condition: string) {
        this.pugNode.test = condition;
        return this;
    }
    
    /**
     * If has a conditional consequent.
     * @returns 
     */
    public hasThen() {
        return !!this.consequent && this.consequent.length;
    }

    /**
     * Retrieves the children of the execution consequence.
     * @returns 
     */
    public getThen() {
        return this.consequent;
    }

    /**
     * Sets the nodes for the conditional consequent.
     * @param nodes The new consequent nodes.
     * @returns 
     */
    public setThen(nodes: CompilerNode[]) {
        this.consequent = nodes;
        return this;
    }

    /**
     * If has a conditional alternate.
     * @returns 
     */
    public hasElse() {
        return !!this.alternate && this.alternate.length;
    }

    /**
     * Retrieves the children of the conditional alternate.
     * @returns 
     */
    public getElse() {
        return this.alternate;
    }

    /**
     * Sets the nodes for the conditional alternate.
     * @param nodes The new alternate nodes.
     * @returns 
     */
    public setElse(nodes: CompilerNode[]) {
        this.alternate = nodes;
        return this;
    }

    public getChildrenContainers() {
        return [this.consequent, this.alternate];
    }

    public toPugNode(): Pug.Nodes.ConditionalNode {
        return {
            ...this.pugNode,
            type: "Conditional",
            consequent: {
                type: "Block",
                nodes: this.consequent.map((node) => node.toPugNode())
            },
            alternate: {
                type: "Block",
                nodes: this.alternate.map((node) => node.toPugNode())
            },
            block: this.makeBlock()
        };
    }
}
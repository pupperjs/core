import { PugNodes, PugAST } from "../../../core/Plugin";
import { NodeModel } from "../NodeModel";
import { CompilerNode } from "./CompilerNode";

export class BlockedCompilerNode<TNode extends PugNodes = any> extends CompilerNode {
    constructor(
        /**
         * The pug node related to this node.
         */
        public pugNode: TNode,

        /**
         * The parent array that contains this node.
         */ 
        public parent?: NodeModel
    ) {
        super(pugNode, parent);
    }

    public makeBlock(children?: PugNodes[]): PugAST {
        return {
            type: "Block",
            nodes: children || []
        };
    }

    /**
     * Converts the node back into a pug node.
     * @returns 
     */
    public toPugNode() {
        const finalNode = { ...this.pugNode };

        finalNode.block = finalNode.block || this.makeBlock();

        if (this.hasChildren()) {            
            finalNode.block.nodes = this.children.map((node) => node.toPugNode());
        }

        return finalNode;
    }
}
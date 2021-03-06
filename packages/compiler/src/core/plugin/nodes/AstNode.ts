import { NodeModel } from "../../../model/core/NodeModel";
import { CompilerNode } from "../../../model/core/nodes/CompilerNode";
import Plugin, { PugAST } from "../../Plugin";

export class AstNode extends CompilerNode {
    constructor(
        protected node: PugAST,

        /**
         * The plugin related to this AST node.
         */
        public plugin: Plugin
    ) {
        super(node, null, plugin);

        node.nodes.forEach((node) => {
            this.children.push(
                Plugin.createNode(node, this) as any
            );
        });
    }

    public countAllNodes(start: NodeModel = this) {
        let count = 0;

        for(let child of start.getChildren()) {
            count++;

            if (child.hasChildren()) {
                count += this.countAllNodes(child);
            }
        }

        return count;
    }

    public toPugNode(): PugAST {
        return {
            type: "Block",
            nodes: this.getChildren().map((child) => child.toPugNode())
        };
    }
}
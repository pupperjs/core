import { NodeModel } from "../../../model/core/NodeModel";
import Plugin, { PugAST } from "../../Plugin";

export class AstNode extends NodeModel {
    constructor(
        protected node: PugAST
    ) {
        super();
        
        node.nodes.forEach((node) => {
            this.children.push(
                Plugin.createNode(node, this)
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
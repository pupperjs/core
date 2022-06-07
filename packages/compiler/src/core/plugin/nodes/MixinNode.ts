import { Pug } from "../../../typings/pug";
import { CompilerNode } from "../../../model/core/nodes/CompilerNode";

export class MixinNode extends CompilerNode<Pug.Nodes.MixinNode> {
    public toPugNode() {
        // This can't be undefined
        this.pugNode.attributeBlocks = this.pugNode.attributeBlocks || [];
        return super.toPugNode();
    }
}
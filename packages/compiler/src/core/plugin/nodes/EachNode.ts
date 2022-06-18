import { Pug } from "../../../typings/pug";
import { CompilerNode } from "../../../model/core/nodes/CompilerNode";

export class EachNode extends CompilerNode<Pug.Nodes.EachNode> {
    /**
     * Retrieves the variable name for the object that will be iterated.
     * @returns 
     */
    public getObjectName() {
        return this.pugNode.obj?.trim();
    }

    public hasKeyName() {
        return this.pugNode.key !== null;
    }

    /**
     * Retrieves the variable name for the iteration index.
     * @returns 
     */
    public getKeyName() {
        return this.hasKeyName() ? this.pugNode.val?.trim() : this.pugNode.key?.trim();
    }

    /**
     * Retrieves the variable name for the iteration value.
     * @returns 
     */
    public getValueName() {
        return this.hasKeyName() ? this.pugNode.key?.trim() : this.pugNode.val?.trim();
    }

    public toPugNode(): Pug.Nodes.TagNode {
        let parsedConditional = /*js*/`${this.getValueName()} in ${this.getObjectName()}`;
        let children = this.plugin.parseChildren(this.getChildren()).map((child) => child.toPugNode());

        if (this.hasKeyName()) {
            // In pug, key and value are inverted when a key is informed
            // We are de-inverting it here
            parsedConditional = /*js*/`(${this.getValueName()}, ${this.getKeyName()}) in ${this.getObjectName()}`;
        }

        return CompilerNode.parseNodeIntoPugNode({
            type: "Tag",
            name: "$",
            attributes: {
                "x-for": parsedConditional
            },
            children: children
        });
    }
}
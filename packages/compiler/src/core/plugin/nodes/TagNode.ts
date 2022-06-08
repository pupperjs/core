import { Pug } from "../../../typings/pug";
import { BlockedCompilerNode } from "../../../model/core/nodes/BlockedCompilerNode";

export class TagNode extends BlockedCompilerNode<Pug.Nodes.TagNode> {
    /**
     * Retrieves the tag name.
     * @returns 
     */
    public getName() {
        return this.getProp("name");
    }

    /**
     * Checks if the node has the given attribute.
     * @param name The attribute name.
     * @returns 
     */
    public hasAttribute(name: string) {
        return this.getAttribute(name) !== undefined;
    }

    /**
     * Retrieves a node attribute by name.
     * @param name The attribute name to be retrieved.
     * @returns 
     */
    public getAttribute(name: string) {
        return this.pugNode.attrs.find((attr) => attr.name === name)?.val as any;
    }

    /**
     * Sets a node attribute value.
     * @param name The atribute name.
     * @param value The attribute value.
     * @returns 
     */
    public setAttribute(name: string, value: string | boolean | number) {
        if (typeof value === "string") {
            value = `"${value}"`;
        }

        let attr;

        if (!this.hasAttribute(name)) {
            attr = {
                name,
                val: String(value),
                mustEscape: false
            };

            this.pugNode.attrs.push(attr);
        } else {
            attr = this.getAttribute(name);
            attr.val = String(value);
        }

        return attr;
    }

    public toPugNode() {
        // This can't be undefined
        this.pugNode.attributeBlocks = this.pugNode.attributeBlocks || [];
        return super.toPugNode();
    }
}
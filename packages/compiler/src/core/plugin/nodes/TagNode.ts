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
    public getRawAttribute(name: string) {
        return this.pugNode.attrs.find((attr) => attr.name === name)?.val as any;
    }

    /**
     * Retrieves a node attribute by name.
     * @param name The attribute name to be retrieved.
     * @returns 
     */
    public getAttribute(name: string) {
        return this.getAttributes().find((attr) => attr.name === name)?.val.replace(/['"]/g, "").trim();
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
                val: value,
                mustEscape: false
            };

            this.pugNode.attrs.push(attr);
        } else {
            attr = this.getRawAttribute(name);
            attr.val = value;
        }

        return attr;
    }

    /**
     * Removes an attribute by it's name.
     * @param name The name of the attribute to be removed.
     * @returns 
     */
    public removeAttribute(name: string) {
        const removed = this.getAttribute(name);

        this.pugNode.attrs.splice(
            this.pugNode.attrs.findIndex((attr) => attr.name === name),
            1
        );

        return removed;
    }

    /**
     * Retrieves the raw node attributes.
     * @returns 
     */
    public getRawAttributes() {
        return this.pugNode.attrs;
    }

    /**
     * Retrieves the parsed node attributes.
     * @returns 
     */
    public getAttributes() {
        return Object.values(
            this.pugNode.attrs.reduce((carrier, attr) => {
                // If this class hasn't been added to the attributes yet
                if (!(attr.name in carrier)) {
                    // Add it
                    carrier[attr.name] = {
                        name: attr.name,
                        val: ""
                    };
                }

                carrier[attr.name].val += String(attr.val).replace(/^((['"`])(?<escaped>.*?)\2$)|(?<nonescaped>.+?$)/, (match, ignored1, ignored2, p3, p4) => p4 || p3) + " ";

                return carrier;
            }, {} as Record<string, {
                name: string;
                val: string
            }>)
        ).map((attr) => {
            attr.val = attr.val.trim();
            return attr;
        });
    }

    /**
     * Retrieves all attributes as a key-value object.
     * @returns 
     */
    public getMappedAttributes() {
        return this.getAttributes().reduce((obj, curr) => {
            obj[curr.name] = curr.val;
            return obj;
        }, {} as Record<string, any>);
    }

    /**
     * Retrieves all raw CSS classes related to this node.
     * @returns 
     */
    public getRawClasses() {
        return String(this.pugNode.attrs.find((attr) => attr.name === "class")?.val).trim();
    }

    /**
     * Retrieves all CSS classes related to this node.
     * @returns 
     */
    public getClasses() {
        return this.getAttribute("class").replace(/['"]/g, "").split(" ");
    }

    /**
     * Retrieves the raw CSS ID related to this node.
     * @returns 
     */
    public getRawId() {
        return String(this.pugNode.attrs.find((attr) => attr.name === "id")?.val).trim();
    }

    /**
     * Retrieves the escaped CSS ID related to this node.
     * @returns 
     */
    public getId() {
        return this.getRawId().replace(/["']/g, "");
    }

    public toPugNode() {
        // This can't be undefined
        this.pugNode.attributeBlocks = this.pugNode.attributeBlocks || [];
        return super.toPugNode();
    }
}
import Plugin, { PugNodes, PugNodeAttribute, TPugNodeTypes, TCompilerNode } from "../../../core/Plugin";
import { NodeModel } from "../NodeModel";

export interface IParserNode {
    type: TPugNodeTypes;
    name?: string;
    line?: number;
    attributes?: Record<string, string | boolean | number>;
    children?: IParserNode[] | CompilerNode[];
    selfClosing?: boolean;
    isInline?: boolean;
}

export type TNodes = PugNodes | CompilerNode | IParserNode;

export class CompilerNode<TNode extends PugNodes = any> extends NodeModel<CompilerNode> {
    /**
     * Makes a pug attribute node.
     * @param key The attribute name.
     * @param value The attribute value.
     * @returns 
     */
    public static makePugNodeAttribute(key: string, value: string | boolean | number): PugNodeAttribute {
        if (typeof value === "string") {
            value = `"${value}"`;
        }

        return {
            name: key,
            val: String(value),
            mustEscape: false
        };
    }

    /**
     * Parses a node in our format into a pug node.
     * @param node The node to be parsed.
     * @returns 
     */
    public static parseNodeIntoPugNode(node: IParserNode) {
        if (!("type" in node)) {
            throw new Error("No node type was given.");
        }

        const finalNode: PugNodes = {
            ...node as any
        };

        if (node.type === "Tag") {
            if (!("isInline" in node)) {
                finalNode.isInline = false;
            }

            if (!("isInline" in node)) {
                finalNode.selfClosing = false;
            }
        }

        if (node.type === "Tag" || node.type === "Mixin") {
            if (!("attributeBlocks" in node)) {
                finalNode.attributeBlocks = [];
            }
        }

        if ("attributes" in finalNode) {
            finalNode.attrs = Object.keys(node.attributes)
                .map((key) => 
                    this.makePugNodeAttribute(key, node.attributes[key])
                );

            delete finalNode.attributes;
        }

        if ("children" in finalNode) {
            finalNode.block = {
                type: "Block",
                nodes: node.children.map((node) => node instanceof NodeModel ? node : this.parseNodeIntoPugNode(node)) as any
            };

            delete finalNode.children;
        }

        return finalNode;
    }

    /**
     * The children nodes to this node.
     */
    public children: CompilerNode<PugNodes>[] = [];

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
        super(parent);

        // If has children
        if (pugNode.block && pugNode.block.nodes && pugNode.block.nodes.length) {
            // Parse them into parser nodes
            pugNode.block.nodes.forEach((node) => {
                this.children.push(
                    Plugin.createNode(node, this) as any
                )
            });
        }
    }

    /**
     * Finds the first children node by a given type.
     * @param type The children node type.
     * @returns 
     */
    public findFirstChildByType(type: string) {
        return this.children.find((child) => child.isType(type));
    }

    /**
     * Finds the first children node with "Tag" type and the given tag name.
     * @param name The children node tag name.
     * @returns 
     */
    public findFirstChildByTagName(name: string) {
        return this.children.find((child) => child.isType("Tag") && child.isName(name));
    }

    /**
     * Retrieves a property from the pug node.
     * @param prop The property to be retrieved.
     * @returns 
     */
    public getProp<TKey extends keyof TNode, TValue = TNode[TKey]>(prop: TKey): TValue {
        return this.pugNode[prop];
    }

    /**
     * Checks if the pug node has a given property.
     * @param prop The property to be checked.
     * @returns 
     */
    public hasProp<TKey extends keyof TNode>(prop: TKey) {
        return prop in this.pugNode;
    }

    /**
     * Checks if the node has the given type.
     * @param type The type to be checked.
     * @returns 
     */
    public isType(type: string) {
        return this.pugNode.type === type;
    }

    /**
     * Checks if the node has the given tag name.
     * @param name The name to be checked.
     * @returns 
     */
    public isName(name: string) {
        return this.pugNode.name === name;
    }

    /**
     * Retrieves the line where this node is.
     * @returns 
     */
    public getLine() {
        return this.pugNode.line;
    }

    /**
     * Retrieves the column of the line where this node is.
     * @returns 
     */
    public getColumn() {
        return this.pugNode.column;
    }

    /**
     * Replaces all node data with the given ones.
     * @param node The new node to be replaced with
     * @returns 
     */
    public replaceWith(node: TNodes) {
        // Iterate over all possible children containers
        for(let children of this.parent.getChildrenContainers()) {
            // If this container includes the current node as a children
            if (children.includes(this)) {
                // Replace it
                const newNode = Plugin.createNode(
                    CompilerNode.parseNodeIntoPugNode(node as any),
                    this.parent
                );
        
                this.insertAfter(newNode, children);
                this.deleteFrom(children);

                return newNode;
            }
        }

        return null;
    }

    /**
     * Deletes the current node from an array.
     * @param array The array where this node will deleted.
     * @returns 
     */
    protected deleteFrom(array: any[]) {
        return array.splice(array.indexOf(this), 1);
    }

    /**
     * Inserts a node before the current node.
     * @param node The node to be inserted
     * @returns 
     */
    public prepend<TType extends CompilerNode | PugNodes | IParserNode>(node: TType) {
        let finalNode = node as CompilerNode;

        if (!(node instanceof CompilerNode)) {
            finalNode = Plugin.createNode(CompilerNode.parseNodeIntoPugNode(node), this.parent) as any;
        }

        this.parent.children.splice(this.getIndex() - 1, 0, finalNode);
        return this;
    }

    /**
     * Inserts a node after the current node.
     * @param node The node to be inserted
     * @returns 
     */
    public insertAfter(node: CompilerNode | TCompilerNode | PugNodes | IParserNode, children = this.parent.children) {
        let finalNode = node as CompilerNode;

        if (!(node instanceof CompilerNode)) {
            finalNode = Plugin.createNode(CompilerNode.parseNodeIntoPugNode(node), this.parent) as any;
        }

        children.splice(this.getIndex() + 1, 0, finalNode);
        return this;
    }

    /**
     * Converts the node back into a pug node.
     * @returns 
     */
    public toPugNode() {
        const finalNode = { ...this.pugNode };

        if (this.hasChildren() || this.pugNode.block) {        
            finalNode.block = finalNode.block || {
                type: "Block",
                nodes: []                
            };
        }

        if (this.hasChildren()) {            
            finalNode.block.nodes = this.children.map((node) => node.toPugNode());
        }

        return finalNode;
    }
}
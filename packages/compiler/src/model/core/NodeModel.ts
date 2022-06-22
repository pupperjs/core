import Plugin, { PugNodes,  PugAST } from "../../core/Plugin";

export interface IParserNode extends Record<string, any> {
    type: string;
    attributes?: Record<string, string | boolean | number>;
    children?: IParserNode[] | NodeModel[];
}

export abstract class NodeModel<TChildren = any> {
    /**
     * The children nodes to this node.
     */
    public children: TChildren[] = [];

    constructor(
        /**
         * The parent array that contains this node.
         */ 
        public parent?: NodeModel
    ) {
        
    }

    /**
     * Checks if the node has children nodes.
     * @returns 
     */
    public hasChildren() {
        return this.children && this.children.length > 0;
    }

    /**
     * Retrieves the node children nodes.
     * @returns 
     */
    public getChildren() {
        return this.children;
    }

    /**
     * Sets the node children nodes.
     * @param children The children nodes.
     */
    public setChildren(children: TChildren[]) {
        this.children = children;
    }

    /**
     * Retrieves the index inside the parent children for this node.
     * @returns 
     */
    public getIndex() {
        return this.parent.getChildren().indexOf(this);
    }

    /**
     * Checks if has a previous node.
     * @returns 
     */
    public hasPrev(): boolean {
        return this.getPrevNode() !== null;
    }

    /**
     * Retrieves the previous node to this node.
     * @returns 
     */
    public getPrevNode(): NodeModel | null {
        return this.parent.children[this.parent.children.indexOf(this) - 1] || null;
    }

    /**
     * Checks if has a next node.
     * @returns 
     */
    public hasNext(): boolean {
        return this.getNextNode() !== null;
    }

    /**
     * Retrieves the next node to this node.
     * @returns 
     */
    public getNextNode() {
        return this.parent?.children[this.parent.children.indexOf(this) + 1] || null;
    }

    /**
     * Retrieves all the containers that can have children nodes.
     * @returns 
     */
    public getChildrenContainers() {
        return [this.children];
    }

    /**
     * Converts the node back into a pug node.
     * @returns 
     */
    abstract toPugNode(): PugNodes | PugAST;
}
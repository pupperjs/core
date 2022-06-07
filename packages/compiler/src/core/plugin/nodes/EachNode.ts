import { Pug } from "../../../typings/pug";
import { CompilerNode } from "../../../model/core/nodes/CompilerNode";

export class EachNode extends CompilerNode<Pug.Nodes.EachNode> {
    /**
     * Retrieves the variable name for the object that will be iterated.
     * @returns 
     */
    public getObjectName() {
        return this.pugNode.obj;
    }

    /**
     * Retrieves the variable name for the iteration index.
     * @returns 
     */
    public getIndexName() {
        return this.pugNode.index;
    }

    /**
     * Retrieves the variable name for the iteration value.
     * @returns 
     */
    public getValueName() {
        return this.pugNode.val;
    }
}
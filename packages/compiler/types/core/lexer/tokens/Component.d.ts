import { PugNode } from "../../Plugin";
import Token from "../Token";
export interface IComponent {
    name: string | symbol;
    template: string;
    script?: string;
    setupScript?: string;
    style?: string;
    exported?: boolean;
}
export default class Component extends Token {
    /**
     * Parses a pug node into a component.
     * @param node The pug node to be parsed.
     * @returns
     */
    parseNode(node: PugNode, nextNode: PugNode): IComponent;
    /**
     * The imports that will later be putted into the template header
     */
    protected components: Record<string | symbol, IComponent>;
    parse(nodes: PugNode[]): PugNode[];
    afterCompile(code: string): string;
}

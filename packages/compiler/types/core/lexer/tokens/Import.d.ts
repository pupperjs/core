import { PugNode } from "../../Plugin";
import Token from "../Token";
export default class Import extends Token {
    private static readonly IMPORT_CONDITION;
    /**
     * The imports that will later be putted into the template header
     */
    protected imports: Record<string, string>;
    parse(nodes: PugNode[]): PugNode[];
    afterCompile(code: string): string;
}

import Plugin, { PugAST } from "../Plugin";
import { PugToken, PugNode } from "pug";
export default class Token {
    protected plugin: Plugin;
    static readonly REGEX: RegExp;
    constructor(plugin: Plugin);
    /**
     * Tests if the token matches with the given expression
     * @param exp The expression to be tested
     * @returns
     */
    static testExpression(exp: string): boolean;
    /**
     * Lexes the given token and return new ones
     * @param tokens The tokens to be parsed
     * @returns Parsed tokens
     */
    lex(tokens: PugToken[]): PugToken[];
    /**
     * Parses the given token and return new ones
     * @param nodes The nodes to be parsed
     * @returns Parsed nodes
     */
    parse(nodes: PugNode[]): PugNode[];
    /**
     * Called before the AST is compiled into Javascript
     * @param ast The pug AST to be compiled
     * @returns
     */
    beforeCompile(ast: PugAST): PugAST;
    /**
     * Called after the AST is compiled into Javascript
     * @param code The generated Javascript code
     * @returns
     */
    afterCompile(code: string): string;
}

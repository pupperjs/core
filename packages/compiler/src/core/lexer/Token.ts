import Plugin, { PugAST } from "../Plugin";

import { PugToken, PugNode } from "pug";

export default class Token {
    public static readonly REGEX: RegExp;

    constructor(
        protected plugin: Plugin
    ) {
        
    }

    /**
     * Tests if the token matches with the given expression
     * @param exp The expression to be tested
     * @returns 
     */
    public static testExpression(exp: string): boolean {
        return false;
    }

    /**
     * Lexes the given token and return new ones
     * @param tokens The tokens to be parsed
     * @returns Parsed tokens
     */
    public lex(tokens: PugToken[]) {
        return tokens;
    }

    /**
     * Parses the given token and return new ones
     * @param nodes The nodes to be parsed
     * @returns Parsed nodes
     */
    public parse(nodes: PugNode[]) {
        return nodes;
    }

    /**
     * Called before the AST is compiled into Javascript
     * @param ast The pug AST to be compiled
     * @returns 
     */
    public beforeCompile(ast: PugAST) {
        return ast;
    }

    /**
     * Called after the AST is compiled into Javascript
     * @param code The generated Javascript code
     * @returns 
     */
    public afterCompile(code: string) {
        return code;
    }
}
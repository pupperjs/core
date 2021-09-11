import { PugNode, PugToken } from "../Parser";

export default class Token {
    public static readonly REGEX: RegExp;

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
}
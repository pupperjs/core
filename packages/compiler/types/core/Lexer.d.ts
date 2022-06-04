import type PugLexer from "pug-lexer";
import type Token from "./lexer/Token";
export default class Lexer {
    static Tokens: typeof Token[];
    /**
     * Checks if a given expression is valid
     * @param lexer The pug lexer instance
     * @param exp The expression to be checked against
     * @returns
     */
    isExpression(lexer: PugLexer.Lexer, exp: string): boolean;
}

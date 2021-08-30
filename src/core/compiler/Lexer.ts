import type PugLexer from "pug-lexer";

export default class Lexer {
    /**
     * The regex to test if an expression is a valid reactive item
     */
    public static REACTIVE_REGEX = /\{(?<tag>\{|-) ?(?<exp>(?:[\w+]|\.)+) ?(\}|-)\}/;

    /**
     * Checks if a given expression is valid
     * @param lexer The pug lexer instance
     * @param exp The expression to be checked against
     * @returns 
     */
    public isExpression(lexer: PugLexer.Lexer, exp: string) {
        const result = Lexer.REACTIVE_REGEX.test(exp);
        return result;
    }
}
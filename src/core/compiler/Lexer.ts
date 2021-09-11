import type PugLexer from "pug-lexer";
import type Token from "./lexer/Token";
import ForEach from "./lexer/tokens/ForEach";
import Property from "./lexer/tokens/Property";

export default class Lexer {
    public static LexerRegexes: typeof Token[] = [
        Property,
        ForEach
    ];

    /**
     * Checks if a given expression is valid
     * @param lexer The pug lexer instance
     * @param exp The expression to be checked against
     * @returns 
     */
    public isExpression(lexer: PugLexer.Lexer, exp: string) {
        return Lexer.LexerRegexes.some((token) => token.testExpression(exp));
    }
}
import type PugLexer from "pug-lexer";
import type Token from "./lexer/Token";
import ForEach from "./lexer/tokens/ForEach";
import Property from "./lexer/tokens/Property";
import IfToken from "./lexer/tokens/If";
import Import from "./lexer/tokens/Import";
import PupperToAlpine from "./lexer/tokens/PupperToAlpine";
import Component from "./lexer/tokens/Component";

export default class Lexer {
    public static Tokens: typeof Token[] = [
        IfToken,
        ForEach,
        Component,
        Property,
        PupperToAlpine,
        Import
    ];

    /**
     * Checks if a given expression is valid
     * @param lexer The pug lexer instance
     * @param exp The expression to be checked against
     * @returns 
     */
    public isExpression(lexer: PugLexer.Lexer, exp: string) {
        return Lexer.Tokens.some((token) => token.testExpression(exp));
    }
}
import { PugToken } from "../../Plugin";
import Token from "../Token";
export default class Property extends Token {
    /**
     * The regex to test if an expression is a valid reactive item
     */
    static REGEX: RegExp;
    /**
     * Tests if the token matches with the given expression
     * @param exp The expression to be tested
     * @returns
     */
    static testExpression(exp: string): boolean;
    lex(tokens: PugToken[]): PugToken[];
}

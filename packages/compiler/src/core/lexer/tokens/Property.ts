import { PugToken } from "../../Plugin";
import Token from "../Token";

export default class Property extends Token {
    /**
     * The regex to test if an expression is a valid reactive item
     */
    public static REGEX = /\{(?<tag>\{|-) ?(?<exp>(?:[\w+]|\.)+) ?(\}|-)\}/;

    /**
     * Tests if the token matches with the given expression
     * @param exp The expression to be tested
     * @returns 
     */
    public static testExpression(exp: string) {
        return this.REGEX.test(exp);
    }

    public lex(tokens: PugToken[]) {
        return tokens.map((token) => {
            // We want only attribute and code tokens
            if (token.type !== "attribute" && token.type !== "code") {
                return token;
            }

            // Check if it's a reactive item
            if (token.mustEscape && Property.REGEX.test(token.val)) {
                // Extract the token value
                const result = token.val.match(Property.REGEX).groups;
                const value = result.exp.replace(/\"/g, "\\\"");

                const fn = result.tag === "{" ? "escape" : "literal";

                // If it's an attribute
                if (token.type === "attribute") {
                    // Replace with our shorthand escape
                    token.name = ":" + token.name;
                    token.val = `"${value}"`;
                    token.mustEscape = false;
                } else {
                    const textOrHtml = fn === "escape" ? "text" : "html";

                    token.val = /*html*/`"<span x-${textOrHtml}=\\"${value}\\"></span>"`;
                    token.mustEscape = false;
                }
            }

            return token;
        });
    }
};
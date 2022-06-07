import { PugToken } from "../../Plugin";
import { Hook } from "../Hook";

export class PropertyHook extends Hook {
    /**
     * The regex to test if an expression is a valid reactive item
     */
    public static REGEX = /\{(?<tag>\{|-) ?(?<exp>(?:[\w+]|\.)+) ?(\}|-)\}/;

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
            if (token.mustEscape && PropertyHook.REGEX.test(token.val)) {
                // Extract the token value
                const result = token.val.match(PropertyHook.REGEX).groups;
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
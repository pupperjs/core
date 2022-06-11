import { CompilerNode } from "../../../model/core/nodes/CompilerNode";
import { PugToken } from "../../Plugin";
import { Hook } from "../Hook";

export class PropertyHook extends Hook {
    /**
     * The regex to test if an expression is a valid reactive item
     */
    public REGEX = /\{(?<tag>\{|-) ?(?<exp>(?:[\w+]|\.)+) ?(\}|-)\}/;

    public testExpression(exp: string) {
        return this.REGEX.test(exp);
    }

    public lex(tokens: PugToken[]) {
        let insideAttribute = false;

        return tokens.map((token) => {
            if (token.type === "start-attributes") {
                insideAttribute = true;
            } else
            if (token.type === "end-attributes") {
                insideAttribute = false;
            }
            
            // We want only attribute and code tokens
            if (token.type !== "attribute" && token.type !== "code") {
                return token;
            }

            // Check if it's a reactive item
            if (token.mustEscape && this.REGEX.test(token.val)) {
                // Extract the token value
                const result = token.val.match(this.REGEX).groups;
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

                    token.type = "code";
                    token.val = /*html*/`"<span x-${textOrHtml}=\\"${value}\\"></span>"`;
                    token.mustEscape = false;
                }

                if (insideAttribute) {
                    token.type = "attribute";
                }
            }

            return token;
        });
    }
};
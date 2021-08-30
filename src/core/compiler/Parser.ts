import Lexer from "./Lexer";

export default class Parser {
    /**
     * Called before starts parsing
     * @param lexer The pug lexer instance
     * @param exp The expression to be checked against
     * @returns 
     */
    public preParse(tokens: {
        type: string,
        loc: Record<string, any>,
        val?: string,
        name?: string,
        mustEscape?: boolean
    }[]) {
        tokens = tokens.map((token, index) => {
            // We want only attribute and code tokens
            if (token.type !== "attribute" && token.type !== "code") {
                return token;
            }

            // Check if it's a reactive item
            if (token.mustEscape && Lexer.REACTIVE_REGEX.test(token.val)) {
                // Extract the token value
                const result = token.val.match(Lexer.REACTIVE_REGEX).groups;
                const value = result.exp.replace(/\"/g, "\\\"");

                const fn = result.tag === "{" ? "escape" : "literal";

                if (token.type === "attribute") {
                    // Replace with our escape
                    token.val = `"@pupperjs:${fn}(${value})"`;
                    token.mustEscape = false;
                } else {
                    // Replace it with a comment tag
                    token.val = `"<!-- @pupperjs:${fn}(${value}) -->"`;
                    token.mustEscape = false;
                }
            }

            return token;
        });

        return tokens;
    }
}
import { PugToken } from "../../Parser";
import Token from "../Token";

export default class Bind extends Token {
    public lex(tokens: PugToken[]) {
        return tokens.map((token, index) => {
            // We want only attribute tokens
            if (token.type !== "attribute") {
                return token;
            }

            // Check if it's binding an event
            if (token.mustEscape && token.name.startsWith("@")) {
                token.name = "@p:bind:" + token.name.substring(1);
            }

            return token;
        });
    }
};
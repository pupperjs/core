import { PugToken } from "../../Plugin";
import Token from "../Token";

export default class PupperToAlpine extends Token {
    public static Directives: Record<string, string> = {
        "p-show": "x-show",
        "p-on": "x-on",
        "p-text": "x-text",
        "p-html": "x-html",
        "p-model": "x-model",
        "p-modelable": "x-modelable",
        "p-for": "x-for",
        "p-each": "x-each",
        "p-transition": "x-transition",
        "p-effect": "x-effect",
        "p-ignore": "x-ignore",
        "p-ref": "x-ref",
        "ref": "x-ref",
        "p-cloak": "x-cloak",
        "p-if": "x-if",
        "p-id": "x-id",
        "p-teleport": "x-teleport"
    };

    public lex(tokens: PugToken[]) {
        return tokens.map((token, index) => {
            // We want only attribute tokens
            if (token.type !== "attribute") {
                return token;
            }

            // If it's a replaceable directive
            if (token.name in PupperToAlpine.Directives) {
                token.name = PupperToAlpine.Directives[token.name];
            }

            return token;
        });
    }
};
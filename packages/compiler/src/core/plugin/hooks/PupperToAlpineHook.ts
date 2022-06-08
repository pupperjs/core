import { PugToken } from "../../Plugin";
import { Hook } from "../Hook";

export class PupperToAlpineHook extends Hook {
    public static Attributes: Record<string, string> = {
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

        "p-render:to" : "x-teleport",
        "p-render:before": "x-teleport",
        "p-render:after": "x-teleport"
    };

    public lex(tokens: PugToken[]) {
        return tokens.map((token) => {
            // We want only attribute tokens
            if (token.type !== "attribute") {
                return token;
            }

            // If it's a replaceable attribute
            if (token.name in PupperToAlpineHook.Attributes) {
                // Replace it
                token.name = PupperToAlpineHook.Attributes[token.name];
            }

            // If it's a p-render
            if (token.name.startsWith("p-render:")) {
                console.log(token);
            }

            return token;
        });
    }
};
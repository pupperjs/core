import { Hook } from "../Hook";

export class StyleAndScriptHook extends Hook {
    public beforeStart(code: string) {
        const matches = code.matchAll(/^\s*(?<tag>script|style).*[^.]$/gm);

        // Add dots to ending "script" and "style" tags
        for(let match of matches) {
            code = code.replace(match[0], match[0].trimEnd() + ".");
        }

        return code;
    }
};
import { Hook } from "../Hook";
import { ComponentHook } from "./ComponentHook";

export class StyleAndScriptHook extends Hook {
    public $before = [ComponentHook];

    public beforeStart(code: string) {
        const regex = /^\s*(script|style).+?$/;

        // Add dots to ending "script" and "style" tags
        code = code.split(/[\r\n]/)
        .filter((line) => line.trim().length)
        .map((line) => {
            if (line.match(regex) !== null && !line.trim().endsWith(".")) {
                return line.trimEnd() + ".";
            }

            return line;
        })
        .join("\n");

        return code;
    }
};
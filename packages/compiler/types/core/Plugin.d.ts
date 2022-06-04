import Lexer from "./Lexer";
import { PugPlugin, PugToken, PugAST, PugNode, Options } from "pug";
import PupperCompiler from "..";
export { PugToken, PugAST, PugNode };
/**
 * Documentation for this class is available in the PugPlugin interface
 */
export default class Plugin implements PugPlugin {
    compiler: PupperCompiler;
    options: Options & {
        contents?: string;
    };
    /**
     * The instances of the tokens that will be used to parse the template file
     */
    private tokens;
    /**
     * A handler for the plugin hooks
     */
    private hooks;
    /**
     * Any data to be shared between hooks and phases
     */
    sharedData: Record<any, any>;
    lex: Lexer;
    constructor(compiler: PupperCompiler, options: Options & {
        contents?: string;
    });
    getOptions(): Options & {
        contents?: string;
    };
    addHook(hook: string, callback: Function): number;
    applyFilters(hook: string, initialValue: any): any;
    preParse(tokens: PugToken[]): any;
    postParse(block: PugAST): any;
    postCodeGen(code: string): string;
}

import Lexer from "./Lexer";
import Token from "./lexer/Token";

import { PugPlugin, PugToken, PugAST, PugNode, Options } from "pug";

export { PugToken, PugAST, PugNode };

/**
 * Documentation for this class is available in the PugPlugin interface
 */
export default class Plugin implements PugPlugin {
    /**
     * The instances of the tokens that will be used to parse the template file
     */
    private tokens: Token[] = [];

    /**
     * A handler for the plugin hooks
     */
    private hooks: Record<string, Function[]> = {};

    /**
     * Any data to be shared between hooks and phases
     */
    public sharedData: Record<any, any> = {};

    public lex = new Lexer();

    constructor(
        protected options: Options
    ) {
        for(let token of Lexer.Tokens) {
            this.tokens.push(new token(this));
        }
    }

    public getOptions() {
        return this.options;
    }

    public addHook(hook: string, callback: Function) {
        if (this.hooks[hook] === undefined) {
            this.hooks[hook] = [];
        }

        return this.hooks[hook].push(callback);
    }

    public applyFilters(hook: string, initialValue: any) {
        // If has no hooks, return the initial value
        if (this.hooks[hook] === undefined) {
            return initialValue;
        }

        let value = initialValue;

        for(let callback of this.hooks[hook]) {
            value = callback(value);
        }

        return value;
    }

    public preParse(tokens: PugToken[]) {
        for(let token of this.tokens) {
            token.lex(tokens);
        }    

        return this.applyFilters("preParse", tokens);
    }

    public postParse(block: PugAST) {
        for(let token of this.tokens) {
            block.nodes = token.parse(block.nodes);
        }

        return this.applyFilters("postParse", block);
    }

    public postCodeGen(code: string): string {
        for(let token of this.tokens) {
            code = token.afterCompile(code);
        }

        return this.applyFilters("postCodeGen", code);
    }
}
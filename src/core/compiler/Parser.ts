import Lexer from "./Lexer";

import { LexTokenType } from "pug-lexer";

export interface PugToken {
    type: LexTokenType,
    loc?: Record<string, any>,
    val?: string,
    name?: string,
    mustEscape?: boolean
}

export interface PugBlock {
    type: "Block",
    nodes: PugNode[]
}

export interface PugNode extends Record<string, any> {
    type: string,
    start?: number,
    end?: number,
    block?: PugBlock,
    attrs?: {
        name: string,
        val: string,
        mustEscape: boolean
    }[]
}

export default class Parser {
    /**
     * Called before starts parsing
     * @param lexer The pug lexer instance
     * @param exp The expression to be checked against
     * @returns 
     */
    public preParse(tokens: PugToken[]) {
        Lexer.LexerRegexes.forEach((token) => {
            const t = new token();
            tokens = t.lex(tokens);
        });       

        return tokens;
    }

    public postParse(block: PugBlock) {
        Lexer.LexerRegexes.forEach((token) => {
            const t = new token();
            block.nodes = t.parse(block.nodes);
        }); 

        return block;
    }
}
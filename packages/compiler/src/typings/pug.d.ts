import type pug from "pug";
import type PugLexer from "pug-lexer";

export declare namespace Pug {
    export interface LexerPlugin extends Record<string, CallableFunction> {
        /**
         * Checks if a given expression is valid
         * @param lexer The pug lexer instance
         * @param exp The expression to be checked against
         * @returns 
         */
        isExpression: (lexer: PugLexer.Lexer, exp: string) => boolean
    }

    /**
     * Represents a pug token
     */
    export interface PugToken {
        type: PugLexer.LexTokenType,
        loc?: Record<string, any>,
        val?: string,
        name?: string,
        mustEscape?: boolean
    }

    /**
     * Represents a pug AST.
     */
    export interface PugAST {
        type: "Block";
        nodes: PugNodes[];
    }

    /**
     * Represents a pug block.
     */
    export interface PugBlock {
        type: "Block";
        nodes: PugNodes[];
        line?: number;
        filename?: string;
    }

    /**
     * Represents a single pug node attribute.
     */
    export interface PugNodeAttribute {
        name: string;
        val: string | boolean | number;
        mustEscape: boolean;
    }

    /**
     * Represents a generic pug node.
     */
    export interface PugNode extends Record<string, any> {
        type?: string;
        attributeBlocks?: [];
        line: number;
        column: number;
        block?: PugAST;
    }

    /**
     * Represents a pug plugin
     */
    export interface PugPlugin {
        /**
         * The lexer plugin
         */
        lex?: LexerPlugin,

        /**
         * Called before the lexer starts parsing
         * @param template The string template that will be lexed
         * @param options Lexer options
         * @returns
         */
        preLex?(template: string, options = {
            /**
             * The current filename, can be null
             */
            filename?: string
        }): string;

        /**
         * Called after the lexer has parsed the template string into tokens
         * @param tokens The tokens that the lexer has parsed
         * @param options The pug compiler options
         * @returns
         */
        postLex?(tokens: PugToken[], options: pug.Options): PugToken[];

        /**
         * Called before the parser starts parsing the tokens into AST
         * @param tokens An array of tokens to be parsed
         * @param options The pug compiler options
         * @returns
         */
        preParse?(tokens: PugToken[], options: pug.Options): PugToken[];

        /**
         * Called after all tokens have been parsed into AST
         * @param ast The parsed AST
         * @param options The pug compiler options
         * @returns
         */
        postParse?(ast: PugAST, options: pug.Options): PugAST;

        /**
         * Called before loading the AST
         * @param ast The parsed AST
         * @param options The pug compiler options
         * @returns
         */
        preLoad?(ast: PugAST, options: pug.Options): PugAST;

        /**
         * Called after the AST have been parsed / loaded
         * @param ast The parsed AST
         * @param options 
         */
        postLoad?(ast: PugAST, options: pug.Options): PugAST;

        /**
         * Called before the compiler filters were called
         * @param ast The parsed AST
         * @param options The pug compiler options
         */
        preFilters?(ast: PugAST, options: pug.Options): PugAST;

        /**
         * Called after the compiler filters were called
         * @param ast The parsed AST
         * @param options The pug compiler options
         */
        postFilters?(ast: PugAST, options: pug.Options): PugAST;

        /**
         * Called before the linker is called
         * @param ast The parsed AST
         * @param options The pug compiler options
         */
        preLink?(ast: PugAST, options: pug.Options): PugAST;

        /**
         * Called after the linker is called
         * @param ast The parsed AST
         * @param options The pug compiler options
         */
        postLink?(ast: PugAST, options: pug.Options): PugAST;

        /**
         * Called before the pug code is transpiled into Javascript
         * @param ast The parsed AST
         * @param options The pug compiler options
         */
        preCodeGen?(ast: PugAST, options: pug.Options): PugAST;

        /**
         * Called after the pug code is transpiled into Javascript
         * @param code The generated Javascript code
         * @param options The pug compiler options
         */
        postCodeGen?(code: string, options: pug.Options): string;
    }

    interface Options {
        /**
         * Pug plugins
         */
        plugins?: PugPlugin[]
    }

    export declare namespace Nodes {
        export declare interface TagNode extends PugNode {
            type: "Tag";
            name: string;
            selfClosing: boolean;
            attrs: PugNodeAttribute[];
            isInline: boolean;
        }

        export declare interface ConditionalNode extends PugNode {
            type: "Conditional";
            test: string;
            consequent: PugBlock;
            alternate: PugBlock;
        }

        export declare interface EachNode extends PugNode {
            type: "Each";
            val: string;
            obj: string;
            key: string;
        }

        export declare interface MixinNode extends PugNode {
            type: "Mixin";
        }

        export declare interface TextNode extends PugNode {
            type: "Text";
            val: string;
        }

        export declare interface CodeNode extends PugNode {
            type: "Code";
            val: string;
            isInline: boolean;
            mustEscape: boolean;
            buffer: boolean;
        }

        export declare interface CommentNode extends PugNode {
            type: "Comment";
            val: string;
            buffer: boolean;
        }
    }
}

/**
 * We use this to document the pug non-documented plugin API
 */
declare module "pug" {
    export interface LexerPlugin extends Pug.LexerPlugin {

    }

    export interface Options extends Pug.Options {

    }

    export interface PugPlugin extends Pug.PugPlugin {

    }

    export interface PugNode extends Pug.PugNode {

    }

    export interface  PugNodeAttribute extends Pug.PugNodeAttribute {

    }

    export interface PugAST extends Pug.PugAST {

    }

    export interface PugToken extends Pug.PugToken {

    }

    export type PugNodes = (
        Pug.Nodes.TagNode |
        Pug.Nodes.ConditionalNode |
        Pug.Nodes.EachNode |
        Pug.Nodes.MixinNode |
        Pug.Nodes.TextNode | 
        Pug.Nodes.CommentNode |
        Pug.Nodes.CodeNode
    );
}
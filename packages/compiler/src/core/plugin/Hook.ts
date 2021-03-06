import Plugin, { PugAST, IPluginNode, PugToken, PugNodes } from "../Plugin";
import PugError from "pug-error";
import { CompilerNode } from "../../model/core/nodes/CompilerNode";

export interface Hook {
    /**
     * Tests if an expression is valid to be lexed.
     * @param exp The expression to be tested.
     * @returns 
     */
    testExpression?(exp?: string): boolean;

    /**
     * Executed before the code is lexed.
     * @param template The input code that is about to be lexed.
     * @returns
     */
    beforeStart?(template: string): string;

    /**
     * Lexes the given token and return new ones
     * @param tokens The tokens to be parsed
     * @returns Parsed tokens
     */

    lex?(tokens: PugToken[]): PugToken[];

    /**
     * Parses the given token and return new ones
     * @param nodes The nodes to be parsed
     * @returns Parsed nodes
     */
    parse?(nodes: IPluginNode[]): IPluginNode[];

    /**
     * Called before the AST is compiled into Javascript.
     * @param ast The pug AST to be compiled
     * @returns 
     */
    beforeCompile?(ast: PugAST): PugAST;

    /**
     * Called after the AST is compiled into Javascript.
     * @param code The generated Javascript code
     * @returns 
     */
    afterCompile?(code: string): string;
}

export abstract class Hook {
    /**
     * All hooks that this hook needs to be executed before.
     */
    public $before?: (typeof Hook)[];

    /**
     * All hooks that this hook needs to wait for their execution.
     */
    public $after?: (typeof Hook)[];

    constructor(
        protected plugin: Plugin
    ) {
        
    }

    public get compiler() {
        return this.plugin.compiler;
    }

    /**
     * Prepares this hook filters.
     */
    public prepareFilters() {
        if ("testExpression" in this) {
            this.plugin.addFilter("testExpression", this.testExpression.bind(this), this);
        }

        if ("beforeStart" in this) {
            this.plugin.addFilter("preLex", this.beforeStart.bind(this), this);
        }

        if ("lex" in this) {
            this.plugin.addFilter("lex", this.lex.bind(this), this);
        }

        if ("parse" in this) {
            this.plugin.addFilter("parse", this.parse.bind(this), this);
        }

        if ("beforeCompile" in this) {
            this.plugin.addFilter("preCodeGen", this.beforeCompile.bind(this), this);
        }

        if ("afterCompile" in this) {
            this.plugin.addFilter("postCodeGen", this.afterCompile.bind(this), this);
        }
    }

    protected makeNode(node: PugNodes, parent: CompilerNode) {
        return Plugin.createNode(node, parent);
    }
}
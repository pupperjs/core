
import type PugLexer from "pug-lexer";
import type { PugPlugin, PugToken, PugAST, PugNode, PugNodes, PugNodeAttribute, LexerPlugin, Options } from "pug";
import type PupperCompiler from "..";

import { Hook } from "./plugin/Hook";

import { IfHook } from "./plugin/hooks/IfHook";
import { ForEachHook } from "./plugin/hooks/ForEachHook";
import { ComponentHook } from "./plugin/hooks/ComponentHook";
import { PropertyHook } from "./plugin/hooks/PropertyHook";
import { PupperToAlpineHook } from "./plugin/hooks/PupperToAlpineHook";
import { ImportHook } from "./plugin/hooks/ImportHook";
import { CompilerNode } from "../model/core/nodes/CompilerNode";
import { StyleAndScriptHook } from "./plugin/hooks/StyleAndScriptHook";

import { AstNode } from "./plugin/nodes/AstNode";
import { EachNode } from "./plugin/nodes/EachNode";
import { TagNode } from "./plugin/nodes/TagNode";
import { NodeModel } from "../model/core/NodeModel";
import { MixinNode } from "./plugin/nodes/MixinNode";
import { ConditionalNode } from "./plugin/nodes/ConditionalNode";
import { InspectNode } from "../util/NodeUtil";

type THookArray = { new(plugin: Plugin): Hook }[];

export type TPugNodesWithTypes = {
    [key in PugNodes["type"]]: Extract<PugNodes, { type: key }>
}

export type TPugNodeTypes = Pick<PugNodes, "type">["type"];

/**
 * Anything that extends a compiler node.
 */
export type TCompilerNode<T extends CompilerNode = any> = T;

/**
 * The relationship between a pug node type and a plugin node.
 */
interface INodeModelPugNodeTypeRelationship extends Record<TPugNodeTypes, TCompilerNode> {
    Tag: TagNode;
    Conditional: ConditionalNode;
    Each: EachNode;
    Mixin: MixinNode;
    //Block: AstNode;
}

/**
 * Retrieves a node model by the pug node type.
 */
type TNodeModelByPugNodeType<TNode extends TPugNodeTypes> = Pick<INodeModelPugNodeTypeRelationship, TNode>;

/**
 * Retrieves the node model by the pug node.
 */
type TNodeModelByPugNode<TNode extends PugNodes, TNodeType extends TPugNodeTypes = TNode["type"]> = TNodeModelByPugNodeType<TNodeType>;

export { PugToken, PugAST, PugNode, PugNodeAttribute, PugNodes, CompilerNode as IPluginNode };

/**
 * Documentation for this class is available in the PugPlugin interface
 */
export default class Plugin implements PugPlugin {
    public static Hooks: THookArray = [
        IfHook,
        ForEachHook,
        ComponentHook,
        PropertyHook,
        PupperToAlpineHook,
        ImportHook,
        StyleAndScriptHook
    ];

    /**
     * Creates a compiler node from a pug node.
     * @param node The pug node.
     * @param parent The parent node to this node.
     * @returns 
     */
    public static createNode<TNode extends PugNodes>(node: TNode, parent: NodeModel): TNodeModelByPugNode<TNode> | CompilerNode {
        // If somehow this happens, prevent from going further
        if (node instanceof CompilerNode) {
            return node;
        }

        switch(node.type) {
            default:
                return new CompilerNode(node, parent);

            case "Each":
                return new EachNode(node, parent);

            case "Tag":
                return new TagNode(node, parent);

            case "Mixin":
                return new MixinNode(node, parent);

            case "Conditional":
                return new ConditionalNode(node, parent);
        }
    }

    /**
     * A handler for the plugin filters.
     */
    private filters: Record<string, Function[]> = {};

    /**
     * Any data to be shared between hooks and phases.
     */
    public sharedData: Record<any, any> = {};

    public lex: LexerPlugin;

    constructor(
        public compiler: PupperCompiler,
        public options: Options & {
            contents?: string
        }
    ) {
        this.prepareHooks();

        // Create the lexer
        this.lex = {
            isExpression: (lexer: PugLexer.Lexer, exp: string) => 
                this.applyFilters<string, boolean>("testExpression", exp)
        };
    }

    /**
     * Prepares a list of ordered hooks.
     */
    protected prepareHooks() {
        const hookOrder: string[] = [];

        Plugin.Hooks
            // Create the hooks instances
            .map((Hook) => new Hook(this))
            .sort((b, a) => {
                if (a.$before) {
                    const $before = a.$before?.map((hook) => hook.prototype.constructor.name);

                    // If A needs to run before B
                    if ($before.includes(b.constructor.name)) {
                        return -1;
                    } else {
                        return 1;
                    }
                }

                if (a.$after) {
                    const $after = a.$after.map((hook) => hook.prototype.constructor.name);

                    // If A needs to run after B
                    if ($after.includes(b.constructor.name)) {
                        return 1;
                    } else {
                        return -1;
                    }
                }

                return 0;
            })
            .forEach((hook) => {
                // Prepare their filters
                hook.prepareFilters();

                hookOrder.push(hook.constructor.name);
            });
    }

    /**
     * Retrieves the compiler options
     * @returns 
     */
    public getCompilerOptions() {
        return this.options;
    }

    /**
     * Adds a filter to a given event.
     * @param filter The filter to be added.
     * @param callback The filter callback.
     * @returns 
     */
    public addFilter(filter: string, callback: Function) {
        if (this.filters[filter] === undefined) {
            this.filters[filter] = [];
        }

        return this.filters[filter].push(callback);
    }

    public applyFilters<TValue, TResultingValue = TValue>(filter: string, value: TValue): TResultingValue {
        // If has no filters, return the initial value
        if (this.filters[filter] === undefined) {
            return value as any as TResultingValue;
        }

        try {
            for(let callback of this.filters[filter]) {
                value = callback(value);
            }
        } catch(e) {
            console.error(e);
            throw e;
        }

        return value as any as TResultingValue;
    }

    /**
     * Parses the children of a node.
     * @param node The node or node array to be parsed.
     * @returns 
     */
    public parseChildren(node: NodeModel|NodeModel[]) {
        if (Array.isArray(node)) {
            this.applyFilters("parse", node);

            node.forEach((node) => {
                this.parseChildren(node);
            });
        } else {
            node.setChildren(
                this.applyFilters("parse", node.getChildren())
            );

            node.getChildren().forEach((child) => {
                if (child.hasChildren()) {
                    this.parseChildren(child);
                }
            });
        }

        return node;
    }

    /**
     * Parses an AST.
     * @param ast The AST to be parsed.
     * @returns 
     */
    public parseNodes(ast: PugAST) {
        try {
            const astNode = new AstNode(ast);

            // Parse the AST children
            this.parseChildren(astNode);

            return astNode.toPugNode();
        } catch(e) {
            console.error(e);
            throw e;
        }
    }

    /**
     * Pug filters implementations
     */

    public preLex(template: string) {
        this.options.contents = this.applyFilters("preLex", template);
        return this.options.contents;
    }

    public preParse(tokens: PugToken[]) {
        return this.applyFilters("lex", tokens);
    }

    public postParse(block: PugAST) {
        return this.parseNodes(block);
    }

    public preCodeGen(ast: PugAST): PugAST {
        return this.applyFilters("preCodeGen", ast);
    }

    public postCodeGen(code: string): string {
        return this.applyFilters("postCodeGen", code);
    }
}
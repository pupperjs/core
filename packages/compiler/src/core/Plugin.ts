import type { PugPlugin, PugToken, PugAST, PugNode, PugNodes, PugNodeAttribute, LexerPlugin } from "pug";

import { Hook } from "./plugin/Hook";

import { ConditionalHook } from "./plugin/hooks/ConditionalHook";
import { PupperToAlpineHook } from "./plugin/hooks/PupperToAlpineHook";
import { ImportHook } from "./plugin/hooks/ImportHook";
import { CompilerNode } from "../model/core/nodes/CompilerNode";
import { StyleAndScriptHook } from "./plugin/hooks/StyleAndScriptHook";
import { ListenerHook } from "./plugin/hooks/ListenerHook";

import { AstNode } from "./plugin/nodes/AstNode";
import { EachNode } from "./plugin/nodes/EachNode";
import { TagNode } from "./plugin/nodes/TagNode";
import { NodeModel } from "../model/core/NodeModel";
import { MixinNode } from "./plugin/nodes/MixinNode";
import { ConditionalNode } from "./plugin/nodes/ConditionalNode";
import { Pug } from "../typings/pug";
import { TemplateTagNode } from "./plugin/nodes/tags/TemplateTagNode";
import { PrepareComponents } from "./plugin/phases/PrepareComponentsHook";
import { CompilationType, PupperCompiler } from "./Compiler";

import lex from "pug-lexer";

type THookConstructor = { new(plugin: Plugin): Hook };
type THookArray = THookConstructor[];

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
export type TNodeModelByPugNodeType<TNode extends TPugNodeTypes> = INodeModelPugNodeTypeRelationship[TNode];

/**
 * Retrieves the node model by the pug node.
 */
export type TNodeModelByPugNode<TNode extends PugNodes, TNodeType extends TPugNodeTypes = TNode["type"]> = TNodeModelByPugNodeType<TNodeType>;

export { PugToken, PugAST, PugNode, PugNodeAttribute, PugNodes, CompilerNode as IPluginNode };

/**
 * Documentation for this class is available in the PugPlugin interface
 */
export default class Plugin implements PugPlugin {
    public static Hooks: THookArray = [
        ConditionalHook,
        PupperToAlpineHook,
        ImportHook,
        StyleAndScriptHook,
        ListenerHook
    ];

    /**
     * All phases to be executed.
     * Phases are executed before hooks.
     */
    public static Phases: THookArray = [
        PrepareComponents
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
                return this.makeTagNode(node, parent);

            case "Mixin":
                return new MixinNode(node, parent);

            case "Conditional":
                return new ConditionalNode(node, parent);
        }
    }

    /**
     * Creates a compiler tag node.
     * @param node The pug node related to this new node.
     * @param parent The parent node related to this node.
     * @returns 
     */
    public static makeTagNode(node: Pug.Nodes.TagNode, parent: NodeModel): TagNode {
        switch(node.name) {
            default:
                return new TagNode(node, parent);

            case "template":
                return new TemplateTagNode(node, parent);
        }
    }

    /**
     * A handler for the plugin filters.
     */
    private filters: Record<string, { callback: Function, hook: Hook }[]> = {};

    /**
     * Any data to be shared between hooks and phases.
     */
    public sharedData: Record<string, any> = {};

    public lex: LexerPlugin;

    constructor(
        public compiler: PupperCompiler
    ) {
        // Create the lexer
        this.lex = {
            isExpression: (lexer: lex.Lexer, exp: string) => 
                this.applyFilters<string, boolean>("testExpression", exp)
        };
    }

    public get options() {
        return this.compiler.options;
    }

    /**
     * Prepares a list of ordered hooks.
     */
    public prepareHooks() {
        const hookOrder: string[] = [];

        if (this.compiler.compilationType !== CompilationType.TEMPLATE) {
            Plugin.Phases
                .map((Phase) => new Phase(this))
                .forEach((phase) => {
                    phase.prepareFilters();
                    hookOrder.push(phase.constructor.name);
                });
        }

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
     * Detects the identation for the current parsed file.
     * @returns 
     */
    public detectIdentation() {
        return this.compiler.contents.match(/^[\t ]+/m)[0];
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
    public addFilter(filter: string, callback: Function, hook: Hook) {
        if (this.filters[filter] === undefined) {
            this.filters[filter] = [];
        }

        return this.filters[filter].push({
            callback,
            hook
        });
    }

    /**
     * Applies all hooks filters for a given value.
     * @param filter The filter name to be applied. 
     * @param value The filter initial value.
     * @returns 
     */
    public applyFilters<TValue, TResultingValue = TValue>(filter: string, value: TValue, options?: {
        skip: THookArray
    }): TResultingValue {
        // If has no filters, return the initial value
        if (this.filters[filter] === undefined) {
            return value as any as TResultingValue;
        }

        try {
            for(let callback of this.filters[filter]) {
                // @ts-ignore
                if (options?.skip?.some((sk) => callback.hook instanceof sk)) {
                    continue;
                }

                value = callback.callback(value);
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
    public parseChildren<TInput extends NodeModel | NodeModel[], TResult>(node: TInput, skipComponentCheck: boolean = false) {
        let options = skipComponentCheck ? {
            skip: [PrepareComponents]
        } : undefined;

        if (Array.isArray(node)) {
            this.applyFilters("parse", node, options);

            node.forEach((node) => {
                this.parseChildren(node);
            });

            return node;
        }

        node.setChildren(
            this.applyFilters("parse", node.getChildren(), options)
        );

        node.getChildren().forEach((child) => {
            if (child.hasChildren()) {
                this.parseChildren(child);
            }
        });

        return node;
    }

    /**
     * Parses an AST.
     * @param ast The AST to be parsed.
     * @returns 
     */
    public parseNodes(ast: PugAST) {
        try {
            const astNode = new AstNode(ast, this);

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
        this.compiler.contents = this.applyFilters("preLex", template);
        return this.compiler.contents;
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

    public get makeError() {
        return this.compiler.makeError.bind(this.compiler);
    }

    public get makeParseError() {
        return this.compiler.makeParseError.bind(this.compiler);
    }
}
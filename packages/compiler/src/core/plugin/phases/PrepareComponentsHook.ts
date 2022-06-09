import { IPluginNode } from "../../Plugin";
import { Hook } from "../Hook";
import { TagNode } from "../nodes/TagNode";
import { ScriptParser } from "../hooks/component/ScriptParser";
import { AstNode } from "../nodes/AstNode";
import { Console } from "console";
import { PupperCompiler } from "../../Compiler";
import { CompilerNode } from "../../../model/core/nodes/CompilerNode";

const DefaultExportSymbol = Symbol("ExportedComponent");

export interface IComponent {
    name: string | symbol;

    template: string;
    methods?: string;
    script?: string;
    style?: string;
    data?: string;

    setupScript?: string;
    exported?: boolean;
}

export class PrepareComponents extends Hook {
    /**
     * The imports that will later be putted into the template header
     */
    protected components: Record<string | symbol, IComponent> = {};

    protected exportedData: Record<string, string> = {};

    public beforeStart(code: string) {
        const matches = code.matchAll(/^\s*(methods|data).*[^.]$/gm);

        // Add dots to ending "methods" and "data" tags
        for(let match of matches) {
            code = code.replace(match[0], match[0].trimEnd() + ".");
        }

        return code;
    }

    public parse(nodes: IPluginNode[]) {
        for(let node of nodes) {
            // Ignore components that aren't in the root
            if (!(node?.parent instanceof AstNode)) {
                continue;
            }

            // Parse them as a component
            // Parse the component
            const component = this.parseComponentNode(node.parent);

            // Save the component
            this.components[component.name] = component;

            break;
        }

        return nodes;
    }

    public afterCompile(code: string) {
        const exportedComponent = this.components[DefaultExportSymbol];

        // Check if has any exported components
        if (exportedComponent) {
            // Parse the script
            const parsedScript = new ScriptParser(
                exportedComponent,
                this.plugin.getCompilerOptions().fileName,
                this.components,
                this.plugin
            ).parse();

            code = `${parsedScript}\n`;

            if (exportedComponent.style) {
                code += `\n${exportedComponent.style}\n`;
            }
        }

        return code;
    }

    public parseComponentNode(node: AstNode | TagNode) {
        const isRootComponent = node instanceof AstNode;
        const name = !isRootComponent ? node.getAttribute("name")?.replace(/"/g, "") : DefaultExportSymbol;

        const template = node.findFirstChildByTagName("template");
        const methods = node.findFirstChildByTagName("methods");
        const script = node.findFirstChildByTagName("script");
        const style = node.findFirstChildByTagName("style");
        const data = node.findFirstChildByTagName("data");

        // If no script and no template tag was found
        if (!script && !template) {
            throw this.compiler.makeParseError("Components must have at least a script tag or a template tag.", {
                line: node.getLine() || 1,
                column: node.getColumn()
            });
        }

        /**
         * Create the component
         */
        const component: IComponent = {
            name,
            template: null,
            methods: null,
            script: null,
            style: null,
            data: null,
            exported: isRootComponent
        };

        // If the component is not exported and has no name
        if (!component.exported && (!name || !name.length)) {
            throw this.compiler.makeParseError("Scoped components must have a name.", {
                line: node.getLine() || 1,
                column: node.getColumn()
            });
        }

        // If the component has no name
        if (!name || !name.length) {
            // Assume it's the default export
            component.name = DefaultExportSymbol;
        }

        // If has a template
        if (template) {
            //this.plugin.parseChildren(template, true);

            let lines = this.plugin.compiler.contents.split("\n");

            const nextNodeAfterTemplate = template.getNextNode();

            lines = lines.slice(
                template.getLine(),
                nextNodeAfterTemplate ? nextNodeAfterTemplate.getLine() - 1 : (node.hasNext() ? node.getNextNode().getLine() - 1 : lines.length)
            );

            // Detect identation
            const identation = /^([\t\n]*) */.exec(lines[0]);

            const contents = lines
                // Replace the first identation
                .map((line) => line.replace(identation[0], ""))
                .join("\n");

            const templateAsString = new PupperCompiler(this.compiler.options).compileTemplate(contents);
            component.template = templateAsString;
        }

        // If has a script
        if (script) {
            component.script = this.consumeChildrenAsString(script);
        }

        // If has a style
        if (style) {
            console.log(style);
        }

        // If has data
        if (data) {
            component.data = this.consumeChildrenAsString(data);
        }

        // If has methods
        if (methods) {
            component.methods = this.consumeChildrenAsString(methods);
        }

        return component;
    }

    protected consumeChildrenAsString(node: CompilerNode) {
        this.plugin.parseChildren(node);
        return node.getChildren().map((child) => child.getProp("val")).join("");
    }
};
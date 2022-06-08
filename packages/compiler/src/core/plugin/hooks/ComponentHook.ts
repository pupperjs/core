import { IPluginNode } from "../../Plugin";
import { Hook } from "../Hook";
import { TagNode } from "../nodes/TagNode";
import { ScriptParser } from "./component/ScriptParser";
import { ConditionalHook } from "./ConditionalHook";
import { StyleAndScriptHook } from "./StyleAndScriptHook";

const DefaultExportSymbol = Symbol("ExportedComponent");

export interface IComponent {
    name: string | symbol;
    template: string;
    script?: string;
    setupScript?: string;
    style?: string;
    exported?: boolean;
}

export class ComponentHook extends Hook {
    public $after = [ConditionalHook, StyleAndScriptHook];

    /**
     * The imports that will later be putted into the template header
     */
    protected components: Record<string | symbol, IComponent> = {};
 
    public parseComponentNode(node: TagNode) {
        const name = node.getAttribute("name")?.replace(/"/g, "");

        const template = node.findFirstChildByTagName("template") as TagNode;
        const script = node.findFirstChildByTagName("script") as TagNode;
        const style = node.findFirstChildByTagName("style") as TagNode;

        // If no script tag was found
        if (!script) {
            throw this.makeError("COMPONENT_HAS_NO_SCRIPT_TAG", "Components must have a a script tag.", {
                line: node.getLine(),
                column: node.getColumn()
            });
        }

        /**
         * Create the component
         */
        const component: IComponent = {
            name,
            template: null,
            script: null,
            style: null,
            exported: node.hasAttribute("export")
        };

        // If the component is not exported and has no name
        if (!component.exported && (!name || !name.length)) {
            throw new Error("Scoped components must have a name.");
        }

        // If the component has no name
        if (!name || !name.length) {
            // Assume it's the default export
            component.name = DefaultExportSymbol;
        }

        // If has a template
        if (template) {
            this.plugin.parseChildren(template);
            let lines = this.plugin.options.contents.split("\n");

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

            const templateAsString = this.plugin.compiler.compileTemplate(contents);
            component.template = templateAsString;
        }

        // If has a script
        if (script) {
            this.plugin.parseChildren(script);

            const scriptContent = script.getChildren().map((node) => node.getProp("val")).join("");
            component.script = scriptContent;
        }

        // If has a style
        if (style) {
            console.log(style);
        }

        return component;
    }

    public parse(nodes: IPluginNode[]) {
        for(let node of nodes) {
            // Check if it's a tag "component" node
            if (node.isType("Tag") && node.isName("component")) {
                // Parse the component
                const component = this.parseComponentNode(node as TagNode);

                // Save the component
                this.components[component.name] = component;

                // Remove the node from the template
                node.delete();

                continue;
            }
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
                this.plugin.getCompilerOptions().filename,
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
};
import { PugNode } from "../../Plugin";
import Token from "../Token";
import { ScriptParser } from "./component/ScriptParser";

const DefaultExportSymbol = Symbol("ExportedComponent");

export interface IComponent {
    name: string | symbol;
    template: string;
    script?: string;
    setupScript?: string;
    style?: string;
    exported?: boolean;
}

export default class Component extends Token {
    /**
     * Parses a pug node into a component.
     * @param node The pug node to be parsed.
     * @returns 
     */
    public parseNode(node: PugNode, nextNode: PugNode) {
        const name = node.attrs.find((node) => node.name === "name")?.val.replace(/"/g, "");

        const template = node.block?.nodes.find((node) => node.type === "Tag" && node.name === "template");
        const script = node.block?.nodes.find((node) => node.type === "Tag" && node.name === "script");
        const style = node.block?.nodes.find((node) => node.type === "Tag" && node.name === "style");

        // If no script tag was found
        if (!script) {
            throw new Error("Components must have at least a script tag.");
        }

        /**
         * Create the component
         */
        const component: IComponent = {
            name,
            template: null,
            script: null,
            style: null,
            exported: node.attrs.find((attr) => attr.name === "export") !== undefined
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
            let lines = this.plugin.options.contents.split("\n");

            const nextNodeAfterTemplate = node.block.nodes[node.block.nodes.indexOf(template) + 1];

            lines = lines.slice(
                template.line,
                nextNodeAfterTemplate ? nextNodeAfterTemplate.line - 1 : nextNode.line - 1
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
            const scriptContent = script.block.nodes.map((node) => node.val).join("");
            component.script = scriptContent;
        }

        // If has a style
        if (style) {
            console.log(style);
        }

        return component;
    }

    /**
     * The imports that will later be putted into the template header
     */
    protected components: Record<string | symbol, IComponent> = {};

    public parse(nodes: PugNode[]) {
        for(let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            // Check if it's a tag node
            if (node.type === "Tag") {
                // If it's a component tag
                if (node.name === "component") {
                    // Parse the component
                    const component = this.parseNode(node, nodes[i + 1]);

                    // Save the component
                    this.components[component.name] = component;

                    // Remove the node from the body
                    nodes.splice(nodes.indexOf(node), 1);

                    continue;
                }
            }

            // Parses the block
            if (node.block) {
                node.block.nodes = this.parse(node.block.nodes);
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
                this.plugin.getOptions().filename,
                this.components,
                this.plugin
            ).parse();

            code += `\n\n${parsedScript}\n`;

            if (exportedComponent.style) {
                code += `\n${exportedComponent.style}\n`;
            }
        }

        return code;
    }
};
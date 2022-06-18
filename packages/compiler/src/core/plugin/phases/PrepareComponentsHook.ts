import { IPluginNode } from "../../Plugin";
import { Hook } from "../Hook";
import { TagNode } from "../nodes/TagNode";
import { ScriptParser } from "../hooks/component/ScriptParser";
import { AstNode } from "../nodes/AstNode";
import { PupperCompiler } from "../../Compiler";
import { ConsumeChildrenAsString } from "../../../util/NodeUtil";
import { ReadBetweenTokens, ReadLinesUntilOutdent, ReadTagWithAttributes } from "../../../util/LexingUtils";

export const DefaultExportSymbol = Symbol("ExportedComponent");

interface IImplementation {
    name: string;
    parameters: {
        name: string;
        initializer?: string;
    }[]
    body: string;
}

export interface IComponent {
    name: string | symbol;

    implementation: {
        methods?: IImplementation[];
        when?: IImplementation[];
        listeners?: (IImplementation & {
            covers: string[]   
        })[];
    },

    template: string;
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
        this.plugin.sharedData.components = {};
        this.components = this.plugin.sharedData.components;

        const lines = code.split(/\n/g);
        const identation = this.plugin.detectIdentation();
        const isIdentationWithTag = new RegExp("^" + identation + "[a-zA-Z\.#]");
        const singleParamRegExp = /([^?=,]+)(=([^,]*))?/g;

        for(let codeIndex = 0; codeIndex < lines.length; codeIndex++) {
            let codeLine = lines[codeIndex];

            // If it's a data tag and doesn't end with a dot
            if (codeLine.startsWith("data") && !codeLine.trimEnd().endsWith(".")) {
                // Add a dot at the end of it
                lines[codeIndex] = codeLine.trimEnd() + ".";
                continue;
            }

            // Skip lines that doesn't start with "implementation"
            if (!codeLine.startsWith("implementation")) {
                continue;
            }

            // Read the implementation contents
            let implContent = ReadLinesUntilOutdent(lines.slice(codeIndex + 1), identation);
            const implContentLines = implContent.split("\n");

            for(let implIndex = 0; implIndex < implContentLines.length; implIndex++) {
                let implLine = implContentLines[implIndex];

                // If the line starts with a identation and a tag
                if (!implLine.match(isIdentationWithTag)) {
                    continue;
                }

                // Read the tag
                const tagData = ReadTagWithAttributes(implContentLines.slice(implIndex));
                let identifier = tagData.tag;

                // If the tag contents (tag + attributes) doesn't end with a dot
                if (!tagData.content.endsWith(".")) {
                    this.compiler.debugger.log("\n-------------------------");
                    this.compiler.debugger.log(tagData.content);
                    this.compiler.debugger.log("-------------------------\n");

                    this.compiler.debugger.log("before");
                    this.compiler.debugger.log(implContent + "\n");

                    // Add a dot to it
                    implContent = implContent.replace(tagData.content, tagData.content + ".");

                    this.compiler.debugger.log("after");
                    this.compiler.debugger.log(implContent);
                }

                // If it's a "when"
                if (identifier.startsWith("when")) {
                    this.compiler.debugger.log(">> replacing \"when\" with \"event-when\" for", identifier);

                    // Replace it with the internal "p-when"
                    implContent = implContent.replace(identifier, identifier.replace("when", "event-when"));
                } else
                // If it's not an event or a listener
                if (!identifier.startsWith("event") && !identifier.startsWith("listener")) {
                    this.compiler.debugger.log(">> adding method identifier for", identifier);

                    // Assume it's a method then
                    implContent = implContent.replace(identifier, identifier.replace(identifier, "method" + identifier));
                }

                // Try matching params against the identifier
                const matchedParams = ReadBetweenTokens(tagData.attributes, "(", ")");

                // If matched
                if (matchedParams) {
                    // Extract all single params
                    const singleParams = matchedParams.matchAll(singleParamRegExp);

                    let attributes = tagData.attributes;

                    // Iterate over all params
                    for(let param of singleParams) {
                        // If it doesn't have a initializer
                        if (param[2] !== undefined) {
                            continue;
                        }

                        // Strictly add an "undefined" initializer to it
                        attributes = attributes.replace(param[0].trim(), param[0].trim() + " = undefined");
                    }

                    // Replace the attributes with the new ones
                    implContent = implContent.replace(tagData.attributes, attributes);

                    // Skip the params lines
                    implLine += matchedParams.split("\n").length;
                }
            }

            // Replace the implementation contents
            lines.splice(
                codeIndex + 1,
                implContentLines.length,
                ...implContent.split("\n")
            );

            this.compiler.debugger.log(lines.join("\n"));

            break;
        }

        return lines.join("\n");
    }

    public parse(nodes: IPluginNode[]) {
        for(let node of nodes) {
            // Ignore components that aren't in the root
            if (!(node?.parent instanceof AstNode)) {
                continue;
            }

            // Parse as a component
            this.parseComponentNode(node.parent);

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

        const implementation = node.findFirstChildByTagName("implementation");
        const template = node.findFirstChildByTagName("template");
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
            implementation: {
                methods: [],
                when: [],
                listeners: []
            },
            template: null,
            script: null,
            style: null,
            data: null,
            exported: isRootComponent
        };

        // Save the component
        this.components[component.name] = component;

        // If the component is not exported and has no name
        if (!component.exported && !name) {
            throw this.compiler.makeParseError("Scoped components must have a name.", {
                line: node.getLine() || 1,
                column: node.getColumn()
            });
        }

        // If the component has no name
        if (!name) {
            // Assume it's the default export
            component.name = DefaultExportSymbol;
        }

        // If has a script
        if (script) {
            component.script = ConsumeChildrenAsString(script);
        }

        // If has a style
        if (style) {
            console.log(style);
        }

        // If has data
        if (data) {
            component.data = ConsumeChildrenAsString(data);
        }

        // If has methods
        if (implementation) {
            component.implementation = this.consumeAsImplementation(implementation);
        }

        // If has a template
        // ATTENTION: templates needs to be parsed after everything as already parsed.
        if (template) {
            let lines = this.plugin.compiler.contents.split("\n");

            const nextNodeAfterTemplate = template.getNextNode();

            lines = lines.slice(
                template.getLine(),
                nextNodeAfterTemplate ? nextNodeAfterTemplate.getLine() - 1 : (node.hasNext() ? node.getNextNode().getLine() - 1 : lines.length)
            );

            // Detect identation
            const identation = this.plugin.detectIdentation();

            const contents = lines
                // Replace the first identation
                .map((line) => line.replace(identation, ""))
                .join("\n");

            const compiler = new PupperCompiler(this.plugin.options);
            compiler.setSharedData(this.plugin.sharedData);

            const templateAsString = compiler.compileTemplate(contents);
            component.template = templateAsString;
        }

        return component;
    }

    /**
     * Consumes all children nodes from a tag node into a component implementation.
     * @param node The node to be consumed.
     * @returns 
     */
    protected consumeAsImplementation(node: TagNode) {
        const implementations: IComponent["implementation"] = {
            methods: [],
            when: [],
            listeners: []
        };

        // Iterate over all children
        node.getChildren().forEach((child) => {
            // Ignore comments
            if (child.isComment()) {
                return;
            }

            // If it's not a tag or a comment
            if (!(child instanceof TagNode)) {
                throw this.plugin.compiler.makeParseError("The implementation tag should only contain methods and events, found a " + child.getType() + ".", {
                    line: child.getLine(),
                    column: child.getColumn()
                });
            }

            // If it isn't an event or method
            if (!["method", "event", "event-when", "listener"].includes(child.getName())) {
                throw this.plugin.compiler.makeParseError("The implementation tag should only contain methods, found an invalid tag " + child.getName() + ".", {
                    line: child.getLine(),
                    column: child.getColumn()
                });
            }

            switch(child.getName()) {
                // If it's a "method"
                case "method":
                    // Add it to the methods
                    implementations.methods.push({
                        name: child.getId(),
                        parameters: child.getRawAttributes().filter((attr) => attr.name !== "class" && attr.name !== "id").map((attr) => ({
                            name: attr.name,
                            initializer: attr.val === "undefined" ? undefined : String(attr.val)
                        })),
                        body: ConsumeChildrenAsString(child)
                    });
                break;

                // If it's a "when"
                case "event-when":
                    // Add it to the when implementations
                    implementations.when.push({
                        name: child.getId(),
                        parameters: child.getAttributes().map((attr) => ({
                            name: attr.name,
                            initializer: attr.val
                        })),
                        body: ConsumeChildrenAsString(child)
                    });
                break;

                // If it's a "listener"
                case "listener":
                    // Add it to the listeners implementations
                    implementations.listeners.push({
                        // Listeners has the prefix "$$p_" to prevent conflicts.
                        name: "$$p_" + child.getId(),
                        parameters: child.getAttributes().filter((attr) => attr.name !== "class" && attr.name !== "id").map((attr) => ({
                            name: attr.name,
                            initializer: attr.val
                        })),
                        body: ConsumeChildrenAsString(child),
                        covers: child.getClasses()
                    });
                break;
            }
        });

        return implementations;
    }
};
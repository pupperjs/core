import { IPluginNode } from "../../Plugin";
import { Hook } from "../Hook";
import { TagNode } from "../nodes/TagNode";
import { ScriptParser } from "../hooks/component/ScriptParser";
import { AstNode } from "../nodes/AstNode";
import { PupperCompiler } from "../../Compiler";
import { CompilerNode } from "../../../model/core/nodes/CompilerNode";

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

        const lines = code.replace(/\r\n/g, "\n").split(/\n/g);
        const identation = this.plugin.detectIdentation();
        const startWithRegExp = new RegExp("^" + identation + "(?!" + identation + ")");
        const paramsRegExp = /^.+?\((?<params>.*?)\)$/gm;
        const singleParamRegExp = /([^?=,]+)(=([^,]*))?/g;

        for(let index = 0; index < lines.length; index++) {
            let line = lines[index];

            if (line.startsWith("data") && !line.trimEnd().endsWith(".")) {
                lines[index] = line.trimEnd() + ".";
                continue;
            }

            if (!line.startsWith("implementation")) {
                continue;
            }

            index++;

            // Retrieve all lines until a non-identation was found
            do {
                line = lines[index];

                if (line === undefined) {
                    break;
                }

                // Ignore empty lines
                if (line.length === 0) {
                    index++;
                    continue;
                }

                // If the line starts with one identation level
                // but doesn't end with a dot and isn't a comment
                if (line.match(startWithRegExp) && !line.trim().endsWith(".") && !line.trimStart().startsWith("//")) {
                    // Append a dot at the end of it
                    lines[index] = line.trimEnd() + ".";

                    let identifier = line.trimStart();

                    // If it's a "when"
                    if (identifier.startsWith("when")) {
                        // Replace it with the internal "p-when"
                        identifier = identifier.replace("when", "event-when");
                    } else
                    // If it's not an event or a listener
                    if (!identifier.startsWith("event") && !identifier.startsWith("listener")) {
                        // Assume it's a method then
                        identifier = identifier.replace(identifier, "method" + identifier);
                    }

                    // Try matching params against the identifier
                    const matchedParams = paramsRegExp.exec(identifier);

                    // If matched
                    if (matchedParams) {                        
                        // Extract all single params
                        const singleParams = matchedParams.groups.params.matchAll(singleParamRegExp);

                        // Iterate over all params
                        for(let param of singleParams) {
                            // If it doesn't have a initializer
                            if (param[2] === undefined) {
                                // Strictly add an initializer to it
                                identifier = identifier.replace(param[0], param[0] + " = undefined");
                            }
                        }
                    }

                    // Replace the identifier with the new one
                    lines[index] = lines[index].replace(line.trimStart(), identifier);
                }

                index++;
            } while(line.length === 0 || line.startsWith(identation));
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
            const component = this.parseComponentNode(node.parent);

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
            if (child.isType("Comment")) {
                return;
            }

            // If it's not a tag
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
                        body: this.consumeChildrenAsString(child)
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
                        body: this.consumeChildrenAsString(child)
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
                        body: this.consumeChildrenAsString(child),
                        covers: child.getClasses()
                    });
                break;
            }
        });

        return implementations;
    }

    /**
     * Consumes all children nodes values from a node into a string.
     * @param node The node to be consumed.
     * @returns 
     */
    protected consumeChildrenAsString(node: CompilerNode) {
        this.plugin.parseChildren(node);
        return node.getChildren().map((child) => child.getProp("val")).join("").trimEnd();
    }
};
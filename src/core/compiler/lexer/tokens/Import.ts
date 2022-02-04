import { PugNode } from "../../Plugin";
import Token from "../Token";

export default class Import extends Token {
    private static readonly IMPORT_CONDITION = /import? (?<identifier>.+?) from \"?\'?(?<filename>.+)\"?\'?$/;

    /**
     * The imports that will later be putted into the template header
     */
    protected imports: Record<string, string> = {};

    public parse(nodes: PugNode[]) {
        for(let node of nodes) {
            // Check if it's a tag node
            if (node.type === "Tag") {
                // If it's an import tag
                if (node.name === "import") {
                    const condition: RegExpMatchArray = ("import " + node.attrs.map((attr) => attr.name).join(" ")).match(Import.IMPORT_CONDITION);

                    // Check if it's an invalid foreach condition
                    if (!condition) {
                        throw new TypeError("Invalid import condition. It needs to have an alias and a filename.");
                    }

                    const { identifier, filename } = condition.groups;

                    this.imports[identifier] = filename;

                    // Remove the node from it
                    //nodes.splice(nodes.indexOf(node), 1);

                    continue;
                } else
                // If it's trying to import a previously imported template
                if (this.imports[node.name] !== undefined) {
                    // If has a body
                    if (node.block?.nodes.length > 0) {
                        throw new Error("Template tags can't have a body.");
                    }

                    const templateName = node.name;

                    // Replace it with an import markup tag
                    node.name = "p:import";
                    node.selfClosing = true;
                    node.isInline = false;

                    // Prevent pug from escaping the attributes
                    node.attrs = node.attrs.map((attr) => {
                        attr.mustEscape = false;
                        
                        switch(attr.name) {
                            case "data":
                            case "methods":
                                attr.val = attr.val.trim();

                                // If it's a JSON object
                                if (attr.val.startsWith("{") && attr.val.endsWith("}")) {
                                    // Remove whitespace
                                    attr.val = `"${attr.val.replace(/^\s+|\s+$|\s+(?=\s)/g, " ")}"`;
                                }
                            break;

                            default:
                                throw new Error("Invalid template attribute " + attr.name);
                        }

                        return attr;
                    });

                    // Add the template name to the variables
                    node.attrs.unshift({
                        name: "template",
                        val: `"${templateName}"`,
                        mustEscape: false
                    });
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
        const importNames = Object.keys(this.imports);

        // Check if has any import
        if (importNames.length) {
            // Prepare the import handler
            let imports = `${this.plugin.getOptions().name}.imports = {`;

            // Add all imports to it
            imports += importNames.map((name) => {
                return `"${name}": require("${this.imports[name]}")`;
            }).join(",");
            
            imports += `};`

            code += `\n\n${imports}\n`;
        }

        return code;
    }
};
import { PugNode } from "../../Plugin";
import Token from "../Token";

export default class Import extends Token {
    private static readonly IMPORT_CONDITION = /import? (?<identifier>.+?) from \"?\'?(?<filename>.+)\"?\'?$/;

    /**
     * The imports that will later be putted into the template header
     */
    protected imports: Record<string, string> = {};

    public parse(nodes: PugNode[]) {
        for(let index = 0; index < nodes.length; index++) {
            const node = nodes[index];

            // Check if it's a foreach
            if (node.type === "Tag" && node.name === "import") {
                const condition: RegExpMatchArray = ("import " + node.attrs.map((attr) => attr.name).join(" ")).match(Import.IMPORT_CONDITION);

                // Check if it's an invalid foreach condition
                if (!condition) {
                    throw new TypeError("Invalid import condition. It needs to have an alias and a filename.");
                }

                const { identifier, filename } = condition.groups;

                this.imports[identifier] = filename;

                // Remove the node from it
                nodes.splice(index, 1);
            } else {
                // Parses the block
                if (node.block) {
                    node.block.nodes = this.parse(node.block.nodes);
                }
            }
        }

        return nodes;
    }

    public afterCompile(code: string) {
        const importNames = Object.keys(this.imports);

        // Check if has any import
        if (importNames.length) {
            // Prepare the import handler
            let imports = `pupper.__imports = {`;

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
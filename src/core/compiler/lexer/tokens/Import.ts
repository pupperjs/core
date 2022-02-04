import { PugNode } from "../../Parser";
import Token from "../Token";

export default class Import extends Token {
    private static readonly IMPORT_CONDITION = /import? (?<identifier>.+?) from \"?\'?(?<filename>.+)\"?\'?$/;

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

                // Set the tag name
                node.type = "Code";

                // Setup the attributes for the foreach
                node.block = {
                    type: "Block",
                    nodes: [
                        {
                            type: "Text",
                            val: `const ${identifier} = require("${filename}");`
                        }
                    ]
                };
            }

            // Parses the block
            if (node.block) {
                node.block.nodes = this.parse(node.block.nodes);
            }
        }

        return nodes;
    }
};
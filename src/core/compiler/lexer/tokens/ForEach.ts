import { PugNode } from "../../Parser";
import Token from "../Token";

export default class ForEach extends Token {
    private static readonly FOREACH_CONDITION = /for(each)? (?<variable>.+?) (?<type>in|of) (?<arr>.+)$/;

    public parse(nodes: PugNode[]) {
        for(let index = 0; index < nodes.length; index++) {
            const node = nodes[index];

            // Check if it's a foreach
            if (node.type === "Tag" && node.name === "foreach" && node.block?.nodes[0].type === "Text") {
                // Parse the parts
                const condition: RegExpMatchArray = ("foreach " + node.block?.nodes[0].val).match(ForEach.FOREACH_CONDITION);

                // Check if it's an invalid foreach condition
                if (!condition) {
                    throw new TypeError("Invalid foreach condition. It needs to have a variable (array) and a condition.");
                }

                const { variable, type, arr } = condition.groups;

                // Set the tag name
                node.name = "p:foreach";

                // Remove the text from it
                node.block.nodes.splice(0, 1);

                // Setup the attributes for the foreach
                node.attrs = [
                    {
                        name: "var",
                        val: `"${variable}"`,
                        mustEscape: false
                    },
                    {
                        name: "type",
                        val: `"${type}"`,
                        mustEscape: false
                    },
                    {
                        name: "array",
                        val: `"${arr}"`,
                        mustEscape: false
                    }
                ];
            }

            // Parses the block
            if (node.block) {
                node.block.nodes = this.parse(node.block.nodes);
            }
        }

        return nodes;
    }
};
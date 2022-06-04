import { PugNode } from "../../Plugin";
import Token from "../Token";

export default class ForEach extends Token {
    public parse(nodes: PugNode[]) {
        for(let index = 0; index < nodes.length; index++) {
            const node = nodes[index];

            // Check if it's an each
            if (node.type === "Each") {
                // Turn it into a <template x-each>
                node.type = "Tag";
                node.name = "template";
                node.selfClosing = false;
                node.attributeBlocks = [];
                node.isInline = false;
                node.attrs = [
                    {
                        name: "x-for",
                        val: `"${node.val.trim()} of ${node.obj.trim()}"`,
                        mustEscape: false
                    }
                ];

                if (node.block.nodes.length > 1) {
                    node.block.nodes = [
                        {
                            type: "Tag",
                            name: "div",
                            selfClosing: false,
                            attributeBlocks: [],
                            isInline: false,
                            attrs: [],
                            block: node.block
                        }
                    ]
                }

                delete node.obj;
                delete node.key;
                delete node.val;
            }

            // Parses the block
            if (node.block) {
                node.block.nodes = this.parse(node.block.nodes);
            }
        }

        return nodes;
    }
};
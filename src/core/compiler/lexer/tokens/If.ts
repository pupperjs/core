import { PugNode } from "../../Plugin";
import Token from "../Token";

export default class ForEach extends Token {
    public parse(nodes: PugNode[]) {
        for(let index = 0; index < nodes.length; index++) {
            const node = nodes[index];

            // Check if it's a conditional
            if (node.type === "Conditional") {
                // Clone it
                const conditional = { ...node };

                // Replace with a tag
                node.type = "Tag";
                node.name = "p:if";
                node.selfClosing = false;
                node.attributeBlocks = [];
                node.isInline = false;
                node.attrs = [{
                    name: "condition",
                    val: `"@p:conditional(${conditional.test})"`,
                    mustEscape: false
                }];

                // <p:then>
                node.block = {
                    type: "Block",
                    nodes: [
                        {
                            type: "Tag",
                            name: "p:then",
                            selfClosing: false,
                            attrs: [],
                            attributeBlocks: [],
                            isInline: false,
                            block: {
                                type: "Block",
                                nodes: this.parse(conditional.consequent.nodes)
                            }
                        }
                    ]
                };

                // <p:else>
                if (!!conditional.alternate) {
                    node.block.nodes.push({
                        type: "Tag",
                        name: "p:else",
                        start: 0,
                        end: 0,
                        attributeBlocks: [],
                        isInline: false,
                        selfClosing: false,
                        block: {
                            type: "Block",
                            nodes: this.parse(conditional.alternate.nodes)
                        }
                    });
                }

                delete node.test;
                delete node.consequent;
                delete node.alternate;

                continue;
            }

            // Parses the block
            if (node.block) {
                node.block.nodes = this.parse(node.block.nodes);
            }
        }

        return nodes;
    }
};
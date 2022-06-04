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

                // Replace with an if <template x-if>
                node.type = "Tag";
                node.name = "template";
                node.selfClosing = false;
                node.attributeBlocks = [];
                node.isInline = false;
                node.attrs = [{
                    name: "x-if",
                    val: `"${conditional.test}"`,
                    mustEscape: false
                }];
                node.block = {
                    type: "Block",
                    nodes: this.parse(conditional.consequent.nodes)
                };

                // <template v-if!>
                if (!!conditional.alternate) {
                    nodes.splice(index + 1, 0, 
                        {
                            type: "Tag",
                            name: "template",
                            start: 0,
                            end: 0,
                            attributeBlocks: [],
                            isInline: false,
                            selfClosing: false,
                            attrs: [{
                                name: "x-if",
                                val: `"!(${conditional.test})"`,
                                mustEscape: false
                            }],
                            block: {
                                type: "Block",
                                nodes: this.parse(conditional.alternate.nodes)
                            }
                        }   
                    );
                }

                delete node.test;
                delete node.consequent;
                delete node.alternate;
            }

            // Parses the block
            if (node.block) {
                node.block.nodes = this.parse(node.block.nodes);
            }
        }

        return nodes;
    }
};
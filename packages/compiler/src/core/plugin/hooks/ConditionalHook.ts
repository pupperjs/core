import { CompilerNode } from "../../../model/core/nodes/CompilerNode";
import Plugin from "../../Plugin";
import { Hook } from "../Hook";
import { ConditionalNode } from "../nodes/ConditionalNode";
import { TagNode } from "../nodes/TagNode";

export class ConditionalHook extends Hook {
    public parse(nodes: ConditionalNode[]) {
        for(let node of nodes) {
            // Check if it's a conditional
            if (node.isType("Conditional")) {
                const consequent = node.getThen();
                const alternate = node.getElse();

                // Replace with a <$ x-if />
                const conditional = node.replaceWith({
                    type: "Tag",
                    name: "$p",
                    attributes: {
                        "x-if": node.getProp("test")
                    }
                }) as TagNode;

                // Add the <$ x-if-cond="consequent" /> to it
                conditional.children.push(
                    CompilerNode.fromCustomNode(
                        {
                            type: "Tag",
                            name: "$p",
                            attributes: {
                                "x-if-cond": "consequent"
                            },
                            children: this.plugin.parseChildren(consequent) as any
                        },
                        conditional
                    )
                );

                // Add the <$ x-if-cond="consequent" /> to it if needed
                if (node.hasElse()) {
                    conditional.children.push(
                        CompilerNode.fromCustomNode(
                            {
                                type: "Tag",
                                name: "$",
                                attributes: {
                                    "x-if-cond": "alternate"
                                },
                                children: this.plugin.parseChildren(alternate) as any
                            },
                            conditional
                        )
                    );
                }
            }
        }

        return nodes;
    }
};
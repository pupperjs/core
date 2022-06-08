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

                // Replace with an if <div x-if>
                const conditional = node.replaceWith({
                    type: "Tag",
                    name: "template",
                    attributes: {
                        "x-if": node.getProp("test")
                    },
                    children: this.plugin.parseChildren(consequent) as any
                }) as TagNode;

                // <div x-if!>
                if (node.hasElse()) {
                    const elseTag = conditional.insertAfter({
                        type: "Tag",
                        name: "template",
                        attributes: {
                            "x-if": `!(${node.getProp("test")})`
                        },
                        children: this.plugin.parseChildren(alternate) as any
                    });
                }
            }
        }

        return nodes;
    }
};
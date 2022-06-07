import { Hook } from "../Hook";
import { ConditionalNode } from "../nodes/ConditionalNode";
import { TagNode } from "../nodes/TagNode";

export class IfHook extends Hook {
    public parse(nodes: ConditionalNode[]) {
        for(let node of nodes) {
            // Check if it's a conditional
            if (node.isType("Conditional")) {
                const consequent = node.getThen();
                const alternate = node.getElse();

                // Replace with an if <div x-if>
                // @todo this is actually buggy and not working.
                // For some reason, the children are not being parsed correctly and
                // are leaving as pug Javascript inside (like each iteration)
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
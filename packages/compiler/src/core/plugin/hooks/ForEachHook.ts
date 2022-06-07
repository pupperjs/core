import { IPluginNode } from "../../Plugin";
import { Hook } from "../Hook";

export class ForEachHook extends Hook {
    public parse(nodes: IPluginNode[]) {
        for(let node of nodes) {
            // Check if it's an each
            if (node.isType("Each")) {
                // Turn it into a <div x-each>
                node.replaceWith({
                    type: "Tag",
                    name: "template",
                    attributes: {
                        "x-for": /*js*/`${node.getProp("val").trim()} of ${node.getProp("obj").trim()}`
                    },
                    children: node.getChildren()
                });
            }
        }

        return nodes;
    }
};
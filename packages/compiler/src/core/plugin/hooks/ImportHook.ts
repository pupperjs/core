import { Hook } from "../Hook";
import { TagNode } from "../nodes/TagNode";

export class ImportHook extends Hook {
    public parse(nodes: TagNode[]) {
        for(let node of nodes) {
            // Check if it's a tag node
            if (!node.isType("Tag")) {
                continue;
            }

            // If it's trying to import a previously imported template
            if (this.plugin.sharedData.imports?.[node.getProp("name")] !== undefined) {
                // Replace with the template
                node.replaceWith({
                    type: "Tag",
                    name: "$",
                    selfClosing: true,
                    isInline: false,
                    attributes: {
                        "x-component": node.getProp("name"),
                        ...node.getMappedAttributes()
                    }
                });
            }
        }

        return nodes;
    }
};
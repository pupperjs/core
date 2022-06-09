import { CompilerNode } from "../../../model/core/nodes/CompilerNode";
import { Hook } from "../Hook";
import { TagNode } from "../nodes/TagNode";
import { DefaultExportSymbol, IComponent } from "../phases/PrepareComponentsHook";

export class ListenerHook extends Hook {
    public parse(nodes: CompilerNode[]) {
        nodes.forEach((node) => {
            if (!(node instanceof TagNode)) {
                return;
            }
        
            // If has a listener
            if (node.hasAttribute("p-listener")) {
                // Remove the attribute from it
                const listenerName = node.removeAttribute("p-listener") as string;

                // Retrieve all events that this listener covers
                const eventNames = (
                    this.plugin.sharedData.components[DefaultExportSymbol] as IComponent
                ).implementation.listeners
                    .find((e) => e.name === "$$p_" + listenerName).covers;

                // Set them                        
                for(let event of eventNames) {
                    node.setAttribute("x-bind:" + event, "$$p_" + listenerName);
                }
            }
        });

        return nodes;
    }
}
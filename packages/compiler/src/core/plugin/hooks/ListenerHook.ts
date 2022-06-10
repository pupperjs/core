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
                const component = this.plugin.sharedData.components[DefaultExportSymbol] as IComponent;
                
                // If the component has no listeners, ignore it
                if (component.implementation?.listeners?.length === 0) {
                    return;
                }

                // Retrieve all events that this listener covers
                const eventNames = component.implementation.listeners
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
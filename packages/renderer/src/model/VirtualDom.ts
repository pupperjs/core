import h from "virtual-dom/h";
import VNode from "virtual-dom/vnode/vnode";
import VText from "virtual-dom/vnode/vtext";

/**
 * Clones a list of nodes.
 * @param nodes The list to be cloned.
 * @returns 
 */
export function cloneNodes(nodes: (VirtualDOM.VTree)[]) {
    const cloned: (VirtualDOM.VTree)[] = [];

    for(let node of nodes) {
        cloned.push(cloneNode(node));
    }

    return cloned;
}

export function cloneNode(node: VirtualDOM.VTree | string): VirtualDOM.VTree {
    if (!(node instanceof VNode)) {
        if (node instanceof VText) {
            return new VText(node.text);
        }

        return new VText(String(node));
    }

    return h(node.tagName, node.properties, node.children);
}
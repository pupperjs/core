import { VNode } from "snabbdom";

/**
 * Clones a list of nodes.
 * @param nodes The list to be cloned.
 * @returns 
 */
export function cloneNodes(nodes: (VNode | string)[]) {
    const cloned: (VNode | string)[] = [];

    for(let node of nodes) {
        cloned.push(cloneNode(node));
    }

    return cloned;
}

export function cloneNode(node: VNode | string): VNode | string {
    if (typeof node === "string") {
        return node;
    }

    return {
        children: node.children ? cloneNodes(node.children) : undefined,
        data: node.data ? {
            attrs: node.data.attrs ? JSON.parse(JSON.stringify(node.data.attrs)) : undefined,
            props: node.data.props ? JSON.parse(JSON.stringify(node.data.props)) : undefined,
            on: node.data.on ? JSON.parse(JSON.stringify(node.data.on)) : undefined
        } : undefined,
        elm: undefined,
        key: node.key || undefined,
        sel: node.sel || undefined,
        text: node.text || undefined
    };
}
import { Node } from "../core/vdom/Node";
import { directives } from "./Directive";

export async function walk<TNode extends Node | Node[]>(nodes: TNode, scope: any = null): Promise<TNode> {
    if (!Array.isArray(nodes)) {
        return await node(nodes as Node, scope) as TNode;
    }

    let count = nodes.length;
    let i = 0;

    while(i < count) {
        const result = await node(nodes[i], scope);

        if (result === undefined) {
            nodes.splice(i++, 1);
            count = nodes.length;
            continue;
        }

        if (Array.isArray(result)) {
            nodes.splice(i++, 1, ...result);
            count = nodes.length;
            continue;
        }

        if (!result.exists() || result.isBeingIgnored()) {
            i++;
            continue;
        }

        nodes[i] = result;

        i++;
    }

    return nodes;
}

async function node(node: Node | undefined, scope: any) {
    //console.group(node.tag, node.getAttributesAndProps());

    // If it's an invalid node
    if (!node) {
        //console.groupEnd();
        // Ignore it
        return undefined;
    }

    // Ignore if it's a string
    if (typeof node === "string") {
        //console.groupEnd();
        return node;
    }

    // Ignore if it's being ignored
    if (node.isBeingIgnored()) {
        //console.groupEnd();
        return node;
    }

    for(let handle of directives(node, scope)) {
        await handle();
    }

    // If it's invisible
    if (node.invisible) {
        //console.groupEnd();
        return undefined;
    }

    // If the node was removed, stop parsing
    if (!node.exists()) {
        //console.groupEnd();
        return node;
    }

    // Parse children if needed
    if (node.children?.length > 0) {
        node.children = await walk(node.children, scope);
    }

    //console.groupEnd();

    return node;
}
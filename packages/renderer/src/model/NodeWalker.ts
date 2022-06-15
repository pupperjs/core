import { PupperNode } from "../core/vdom/Node";
import { directives } from "./Directive";

import * as Debugger from "../util/Debugger";

export async function walk<TNode extends PupperNode | PupperNode[]>(nodes: TNode, scope: any = null): Promise<TNode> {
    if (!Array.isArray(nodes)) {
        return await node(nodes as PupperNode, scope) as TNode;
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

async function node(node: PupperNode | undefined, scope: any) {
    Debugger.group(node.tag, node.getAttributesAndProps(), node);

    // If it's an invalid node
    if (!node) {
        Debugger.endGroup();
        // Ignore it
        return undefined;
    }

    // Ignore if it's a string
    if (typeof node === "string") {
        Debugger.info("node is a string");
        Debugger.endGroup();
        return node;
    }

    // Ignore if it's being ignored
    if (node.isBeingIgnored()) {
        Debugger.info("node is being ignored");
        Debugger.endGroup();
        return node;
    }

    for(let handle of directives(node, scope)) {
        await handle();
    }

    // Set it as non-dirty.
    node.setDirty(false);

    // If the node was removed, stop parsing
    if (!node.exists()) {
        Debugger.info("node was removed");
        Debugger.endGroup();
        return node;
    }

    // Parse children if needed
    if (node.children?.length > 0) {
        node.children = await walk(node.children, scope);
    }

    // If it's non-renderable
    if (!node.isRenderable()) {
        Debugger.info("node is not renderable");
        // Allow parsing its children but prevent itself from being rendered.
        return undefined;
    }

    Debugger.endGroup();

    return node;
}
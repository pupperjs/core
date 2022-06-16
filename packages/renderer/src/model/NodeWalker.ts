import { PupperNode } from "../core/vdom/Node";
import { directives } from "./Directive";

import * as Debugger from "../util/Debugger";

export enum ENodeWalkResult {
    PREVIOUS,
    NEXT,
    REMOVE
}

export async function walk<TNode extends PupperNode | PupperNode[]>(nodes: TNode, scope: any = null): Promise<TNode> {
    if (!Array.isArray(nodes)) {
        return (await walkNode(nodes as PupperNode, scope)).node as TNode;
    }

    let count = nodes.length;
    let i = 0;

    while(i < count) {
        const { node, result } = await walkNode(nodes[i], scope);

        // If the result is to remove the node
        if (result === ENodeWalkResult.REMOVE) {
            // Remove it and continue
            nodes.splice(i, 1);
            count = nodes.length;

            continue;
        }

        // If it's an array
        if (Array.isArray(node)) {
            // Append it to the nodes array
            nodes.splice(i, 1, ...await walk(node, scope));
            count = nodes.length;
        } else {
            // If it's going back
            if (result === ENodeWalkResult.PREVIOUS) {
                // Parse it again
                i--;
                continue;
            }

            // If the node doesn't exists or is being ignored
            if (!node.exists() || node.isBeingIgnored()) {
                i++;
                continue;
            }

            nodes[i] = node;
            i++;          
        }        
    }

    return nodes;
}

async function walkNode(node: PupperNode | undefined, scope: any): Promise<{
    result: ENodeWalkResult,
    node?: PupperNode | PupperNode[]
}> {
    // If it's an invalid node
    if (!node) {
        // Ignore it
        return {
            result: ENodeWalkResult.REMOVE
        };
    }

    Debugger.group(node.tag, node.getAttributesAndProps(), node);

    // Ignore if it's a string
    if (typeof node?.node === "string") {
        Debugger.warn("node is a plain string");
        Debugger.endGroup();

        return {
            node,
            result: ENodeWalkResult.NEXT
        };
    }

    // Ignore if it's being ignored
    if (node.isBeingIgnored()) {
        Debugger.warn("node is being ignored");
        Debugger.endGroup();

        return {
            node,
            result: ENodeWalkResult.NEXT
        };
    }

    for(let handle of directives(node, scope)) {
        await handle();
    }

    // Set it as non-dirty.
    node.setDirty(false);

    // If node was replaced, stop parsing
    if (node.wasReplaced()) {
        Debugger.warn("node was replaced with %O", node.getReplacement());
        Debugger.endGroup();

        return {
            node: node.getReplacement(),
            result: ENodeWalkResult.NEXT
        };
    }

    // If the node was removed, stop parsing
    if (!node.exists()) {
        Debugger.warn("node was removed");
        Debugger.endGroup();

        return {
            node,
            result: ENodeWalkResult.NEXT
        };
    }

    // Parse children if needed
    if (node.children?.length > 0) {
        node.children = await walk(node.children, scope);
    }

    // If it's non-renderable
    if (!node.isRenderable()) {
        Debugger.warn("node is not renderable");

        // Allow parsing its children but prevent itself from being rendered.
        return undefined;
    }

    Debugger.endGroup();

    return {
        node,
        result: ENodeWalkResult.NEXT
    };
}
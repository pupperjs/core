import { RendererNode } from "./vdom/RendererNode";
import { directives } from "./Directive";

import * as Debugger from "../util/Debugger";
import { TRendererNodes } from "../core/vdom/Renderer";

export enum ENodeWalkResult {
    REPLACED,
    NEXT,
    REMOVE,
    SKIP
}

interface IWalkResult {
    result: ENodeWalkResult.NEXT | ENodeWalkResult.REMOVE | ENodeWalkResult.REPLACED,
    node?: RendererNode | RendererNode[]
}

interface ISkipWalkResult {
    result: ENodeWalkResult.SKIP,
    amount: number
}

type TWalkResult = ISkipWalkResult | IWalkResult;

let recursionDetector = 0;

/**
 * Walks through a list of nodes, applying directives to them.
 * @param nodes The nodes to be walked.
 * @param scope The scope for this nodes.
 * @returns 
 */
export async function walk<TNode extends TRendererNodes | TRendererNodes[]>(nodes: TNode, scope: any = null): Promise<TNode> {
    // If it's a single node, walk it
    if (!Array.isArray(nodes)) {
        const result = await walkNode(nodes as RendererNode, scope);

        if (result.result === ENodeWalkResult.SKIP) {
            return nodes;
        }

        return result.node as TNode;
    }

    let count = nodes.length;
    let i = 0;

    while(i < count) {
        recursionDetector++;

        if (recursionDetector >= 100000) {
            Debugger.error("pupper.js detected a possible node walking recursion.");
            break;
        }

        const currentNode = nodes[i];
        const walkResult = await walkNode(currentNode, scope);

        // If it's skiping the node
        if (walkResult.result === ENodeWalkResult.SKIP) {
            i += Math.max(walkResult.amount, 1);
        } else
        // If the result is to remove the node
        if (walkResult.result === ENodeWalkResult.REMOVE) {
            // Remove it and continue
            nodes.splice(i, 1);
            count = nodes.length;
        } else
        // If it was replaced
        if (walkResult.result === ENodeWalkResult.REPLACED) {
            Debugger.warn("%s %O was replaced with %O", currentNode.tag, currentNode.getAttributesAndProps(), walkResult.node);

            // Calculate the replacement length
            const repl = Array.isArray(walkResult.node) ? walkResult.node : [walkResult.node];

            // Replace it from the nodes array
            nodes.splice(i, 1, ...repl);

            // Update the total count
            count = nodes.length;
        } else
        // If it's an array
        if (Array.isArray(walkResult.node)) {
            // Append it to the nodes array
            nodes.splice(i, 0, ...walkResult.node);
            count = nodes.length;

            i += walkResult.node.length;
        } else {
            // Replace the node with the new one
            nodes[i++] = walkResult.node;
        }
    }

    recursionDetector = 0;

    return nodes;
}

/**
 * Walks through a single node.
 * @param node The node to be walked.
 * @param scope The scope to this node.
 * @returns 
 */
async function walkNode(node: TRendererNodes | undefined, scope: any): Promise<TWalkResult> {
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
        Debugger.warn("\"%s\" is a plain string", node.node);
        Debugger.endGroup();

        return {
            node,
            result: ENodeWalkResult.NEXT
        };
    } else
    // Ignore if it's being ignored
    if (node.isBeingIgnored()) {
        Debugger.warn("%s is being ignored", node.tag);
        Debugger.endGroup();

        return {
            node,
            result: ENodeWalkResult.NEXT
        };
    }

    // Apply all directives for it
    for(let handle of directives(node, scope)) {
        await handle();
    }

    // If node was replaced, stop parsing
    if (node.wasReplaced()) {
        Debugger.endGroup();

        return {
            node: node.getReplacement(),
            result: ENodeWalkResult.REPLACED
        };
    } else
    // If the node was removed, stop parsing
    if (!node.exists()) {
        Debugger.warn("%s was removed", node.tag);
        Debugger.endGroup();

        return {
            amount: 1,
            result: ENodeWalkResult.SKIP
        };
    }

    // Parse children if needed
    if (node.children?.length > 0) {
        node.children = await walk(node.children, scope);
    }

    // If it's non-renderable
    if (!node.isRenderable()) {
        // If it's a $ pupper node
        if (node.isPupperNode()) {
            Debugger.warn("found a pupper tag %O, replacing with its children", node);
            Debugger.endGroup();

            return {
                amount: node.children.length,
                result: ENodeWalkResult.SKIP
            };
        }
        
        Debugger.warn("%s is not renderable", node.tag);
        Debugger.endGroup();

        // Allow parsing its children, but prevent itself from being rendered.
        return {
            result: ENodeWalkResult.SKIP,
            amount: 1
        };
    }

    Debugger.endGroup();

    return {
        node,
        result: ENodeWalkResult.NEXT
    };
}
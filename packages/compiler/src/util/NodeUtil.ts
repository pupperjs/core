import { appendFileSync } from "fs";
import { inspect } from "util";
import { NodeModel } from "../model/core/NodeModel";
import { CompilerNode } from "../model/core/nodes/CompilerNode";

export function InspectNode(node: NodeModel) {
    const inspected = inspect(node.toPugNode(), false, 99999, false);
    appendFileSync(process.cwd() + "/.test.js", inspected);
}

/**
 * Consumes all children nodes values from a node into a string.
 * @param node The node to be consumed.
 * @returns 
 */
export function ConsumeChildrenAsString(node: CompilerNode) {
    node.plugin.parseChildren(node);
    return node.getChildren().map((child) => child.getProp("val")).join("").trimEnd();
}
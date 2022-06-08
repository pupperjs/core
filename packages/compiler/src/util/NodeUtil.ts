import { appendFileSync } from "fs";
import { inspect } from "util";
import { NodeModel } from "../model/core/NodeModel";

export function InspectNode(node: NodeModel) {
    const inspected = inspect(node.toPugNode(), false, 99999, false);
    appendFileSync(process.cwd() + "/.test.js", inspected);
}
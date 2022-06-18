import Debugger from "../../../util/Debugger";
import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { walk } from "../../../model/NodeWalker";
import { effect } from "../../../model/Reactivity";
import { IsNumeric, IsObject } from "../../../util/ObjectUtils";
import { LoopNode } from "../nodes/LoopNode";

const debug = Debugger.extend("vdom:directives:loop");

/**
 * @directive x-for
 * @description Recursively renders a node's children nodes.
 */
directive("for", async (node: LoopNode, { expression, scope }) => {
    const loopData = parseForExpression(expression);
    const evaluate = evaluateLater(loopData.items);

    const removeEffect = await effect(async () => {        
        let loopScope;

        debug("running");

        try {
            let items = await evaluate(scope);

            // Support number literals, eg.: x-for="i in 100"
            if (IsNumeric(items)) {
                items = Array.from(Array(items).keys(), (i) => i + 1);
            } else
            // If it's an object
            if (IsObject(items)) {
                // Retrieve the entries from it
                items = Object.entries(items);
            } else
            // If nothing is found, default to an empty array.
            if (items === undefined) {
                items = [];
            }

            // Clear the current children
            node.clearChildren();

            // Iterate over all evaluated items
            for(let index = 0; index < items.length; index++) {
                // Clone the scope
                loopScope = { ...scope };

                // Push the current item to the state stack
                if ("item" in loopData) {
                    loopScope[loopData.item] = items[index];
                }

                if ("index" in loopData) {
                    loopScope[loopData.index] = index;
                }

                if ("collection" in loopData) {
                    loopScope[loopData.collection] = items;
                }

                for(let child of node.body) {
                    // Clone it
                    child = child.clone()
                        .setParent(node)
                        .setIgnored(false)
                        .setChildrenIgnored(false);

                    // Append it to the children
                    node.appendChild(child);

                    // Walk through it
                    child = await walk(child, loopScope);
                }
            }

            node.setIgnored();
            node.setDirty().setChildrenDirty(true, false);
        } catch(e) {
            Debugger.error("failed to evaluate for loop");
            Debugger.error("the following information can be useful for debugging:");
            Debugger.error("last scope: %o", loopScope);
            
            throw e;
        }

        debug("ended");
    });

    node.addEventListener("DOMNodeRemoved", removeEffect);
});

/**
 * Parses a "for" expression
 * @note This was taken from VueJS 2.* core. Thanks Vue!
 * @param expression The expression to be parsed.
 * @returns 
 */
function parseForExpression(expression: string | number | boolean | CallableFunction) {
    let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    let stripParensRE = /^\s*\(|\)\s*$/g;
    let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    let inMatch = String(expression).match(forAliasRE);

    if (!inMatch) {
        return;
    }

    let res: {
        items?: string;
        index?: string;
        item?: string;
        collection?: string;
    } = {};

    res.items = inMatch[2].trim();
    let item = inMatch[1].replace(stripParensRE, "").trim();
    let iteratorMatch = item.match(forIteratorRE);

    if (iteratorMatch) {
        res.item = item.replace(forIteratorRE, "").trim();
        res.index = iteratorMatch[1].trim();

        if (iteratorMatch[2]) {
            res.collection = iteratorMatch[2].trim();
        }
    } else {
        res.item = item;
    }

    return res;
}
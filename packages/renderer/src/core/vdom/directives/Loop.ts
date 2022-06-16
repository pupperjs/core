import { directive } from "../../../model/Directive";
import { evaluateLater } from "../../../model/Evaluator";
import { walk } from "../../../model/NodeWalker";
import { effect } from "../../../model/Reactivity";
import { IsNumeric, IsObject } from "../../../util/ObjectUtils";
import { PupperNode } from "../Node";

/**
 * @directive x-for
 * @description Recursively renders a node's children nodes.
 */
directive("for", async (node, { expression, scope }) => {
    const loopData = parseForExpression(expression);
    const evaluate = evaluateLater(loopData.items);

    // Save and remove the children
    const children = node.children;
    node = node.replaceWithComment();
    node.setIgnored();
    node.setRenderable(false);

    let clones: PupperNode[] = [];

    const removeEffect = await effect(async () => {        
        let loopScope;

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

            // Clear the older nodes if needed
            if (clones.length) {
                clones.forEach((clone) => clone.delete());
                clones = [];
            }

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

                for(let child of children) {
                    child = child.clone()
                        .setIgnored(false)
                        .setParent(node.parent)
                        .setDirty(true, false)
                        .setChildrenDirty(true, false)

                        // @todo new added nodes are still being ignored because the comment is ignored
                        // strange, bug the effect is never triggered for freshly reacted items
                        .setChildrenIgnored(false);

                    node.insertBefore(child);

                    child = await walk(child, loopScope);
                    clones.push(child);
                }
            }

            node.parent.setDirty();
        } catch(e) {
            console.warn("[pupper.js] The following information can be useful for debugging:");
            console.warn("last scope:", loopScope);
            console.error(e);
        }
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
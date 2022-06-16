/// <reference types="virtual-dom" />

/**
 * Represents a hyperscript function.
 */
type FHyperScript = (
    tagNameOrText: string,
    properties?: Record<string, any>,
    children?: (VirtualDOM.VTree | string)[]
) => VirtualDOM.VTree;

/**
 * Used to convert nodes using a given hypescript function.
 */
class Converter {
    constructor(
        protected h: FHyperScript
    ) {

    }

    /**
     * Converts a single node into a virtual DOM node.
     * @param node The node to be converted.
     * @returns
     */
    public convertNode(node: Node | Element) {
        // If it's not an element
        if (!(node instanceof Element)) {
            return node.textContent;
        }

        const properties: Record<string, Record<string, Attr>> = {};
        const children: (VirtualDOM.VTree | string)[] = [];

        // If has attributes
        if (node.attributes) {
            properties.attrs = {};
    
            // Save over all attributes
            for(let key in node.attributes) {
                properties.attrs[key === "class" ? "className" : key] = node.attributes[key];    
            }
        }

        // If has children
        if (node.childNodes.length > 0) {
            for(let child of node.childNodes) {
                children.push(this.convertNode(child));
            }
        }
    
        return this.h(node.tagName, properties, children);
    }

    /**
     * Converts an element or a HTML string into virtual DOM nodes.
     * @param node The element or string to be converted.
     * @returns
     */
    public convertTree(node: Element | string) {
        const template = document.createElement("template");
        
        if (node instanceof Element) {
            template.content.appendChild(node);
        } else {
            template.innerHTML = node;
        }

        if (template.content.childElementCount > 1) {
            let tree = [];

            // Iterate over all nodes
            for(let node of template.children) {
                tree.push(this.convertNode(node));
            }

            return tree;
        }

        return this.convertNode(template.content.firstChild);
    }
}

function dom2vdom(element: Element | string, h: FHyperScript) {
    return new Converter(h).convertTree(element);
}

module.exports = dom2vdom;
export default dom2vdom;
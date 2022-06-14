import { PupperNode } from "../core/vdom/Node";
import { Renderer } from "../core/vdom/Renderer";

export type TScope = Record<string, string | boolean | number>;

export type TAttributeVal = string | number | boolean;

type TDirectives = typeof directiveOrder[number];

interface IProp {
    name: string;
    value: TAttributeVal;
}

interface IDirective {
    type: TDirectives | null;
    value: TAttributeVal | null;
    modifiers: string[];
    expression: string;
}

let isDeferringHandlers = false;

const directiveHandler: {
    [index in TDirectives]?: TDirectiveCallback
} = {};

const directiveHandlerStacks = new Map<string | Symbol, TDirectiveCallback[]>();
const currentHandlerStackKey = Symbol();

/**
 * The regex to detect and evaluate pupper.js related attributes
 */
const pupperAttrRegex = /^x-([^:^.]+)\b/;

type TDirectiveCallback = (
    node: PupperNode,
    data: {
        renderer: Renderer;
        scope: TScope;
        expression?: string;
        value?: string;
    }
) => any;

export function directive(attribute: TDirectives, callback: TDirectiveCallback) {
    directiveHandler[attribute] = callback;
}

/**
 * Retrieves an array of directives to be evaluated for the given node.
 * @param node The node to be evaluated.
 * @returns 
 */
export function directives(node: PupperNode, scope: TScope) {
    let transformedAttributeMap: Record<string, string> = {};

    const attributes = node.getAttributesAndProps();

    return Object.keys(attributes)
        .map((attr) => {
            return {
                name: attr,
                value: attributes[attr]
            };
        })
        .map(
            toTransformedAttributes((newName, oldName) => 
                transformedAttributeMap[newName] = oldName
            )
        )
        // Filter non-pupper attributes
        .filter((attr) => attr.name.match(pupperAttrRegex))
        .map(
            toParsedDirectives(transformedAttributeMap, null)
        )
        .sort(byPriority)
        .map((dir) => {
            return getDirectiveHandler(node, dir, scope);
        });
}

export function getDirectiveHandler(node: PupperNode, directive: IDirective, scope: TScope) {
    let noop = async () => {};
    let handler = directiveHandler[directive.type] || noop;

    const props = {
        ...directive,
        scope
    };

    // If wants to ignore this node
    if (node.isBeingIgnored()) {
        return noop;
    }

    if (isDeferringHandlers) {
        directiveHandlerStacks.get(currentHandlerStackKey).push(handler);
        return noop;
    }

    // Bind the handler to itself with the properties
    handler = handler.bind(handler, node, props);

    return async() => await handler(node, props as any);
}

const attributeTransformers: CallableFunction[] = [];

function toTransformedAttributes(callback: (newName: string, name: string) => any): ((props: IProp) => IProp) {
    return ({ name, value }) => {
        let { name: newName, value: newValue } = attributeTransformers.reduce((carry, transform) => {
            return transform(carry);
        }, { name, value });

        if (newName !== name) {
            callback && callback(newName, name);
        }

        return {
            name: newName,
            value: newValue
        };
    }
}

function toParsedDirectives(
    transformedAttributeMap: Record<string, TAttributeVal>,
    originalAttributeOverride: Record<string, TAttributeVal>
): ((props: IProp) => IDirective) {
    return ({ name, value }) => {
        const typeMatch = name.match(pupperAttrRegex)
        const valueMatch = name.match(/:([a-zA-Z0-9\-:]+)/)
        const modifiers: string[] = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || []
        const original = originalAttributeOverride || transformedAttributeMap[name] || name

        return {
            type: typeMatch ? typeMatch[1] as any : null,
            value: valueMatch ? valueMatch[1] as any : null,
            modifiers: modifiers.map(i => i.replace(".", "")),
            expression: String(value),
            original,
        };
    }
}

export function mapAttributes(callback: CallableFunction) {
    attributeTransformers.push(callback);
}

export function replaceWith(subject: string, replacement: string): (prop: IProp) => IProp {
    return ({ name, value }) => {
        if (name.startsWith(subject)) {
            name = name.replace(subject, replacement);
        }

        return { name, value };
    };
}

const DEFAULT = "DEFAULT"

const directiveOrder = [
    "ref",
    "id",
    "bind",
    "if",
    "for",
    "transition",
    "show",
    "on",
    "text",
    "html",
    DEFAULT
] as const;

function byPriority(a: IDirective, b: IDirective) {
    let typeA = !directiveOrder.includes(a.type) ? DEFAULT : a.type
    let typeB = !directiveOrder.includes(b.type) ? DEFAULT : b.type

    return directiveOrder.indexOf(typeA) - directiveOrder.indexOf(typeB)
}
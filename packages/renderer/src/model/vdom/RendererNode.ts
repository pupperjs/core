import { Renderer } from "../../core/vdom/Renderer";

import h from "virtual-dom/h";
import diff from "virtual-dom/diff";
import patch from "virtual-dom/patch";
import VComment from "virtual-dom/vnode/vcomment";
import VText from "virtual-dom/vnode/vtext";

import Debugger from "../../util/Debugger";

const debug = Debugger.extend("vdom:node");

interface IHookFn extends Function {
    hook?: CallableFunction;
    unhook?: CallableFunction
}

/**
 * Creates a new virtual DOM hook.
 * @param props The hook callbacks.
 * @returns 
 */
function Hook<TProps extends {
    hook?: CallableFunction,
    unhook?: CallableFunction
}>(props: TProps): IHookFn {
    const hook: IHookFn = function() { };

    hook.prototype.hook = props.hook;
    hook.prototype.unhook = props.unhook;

    // @ts-ignore
    return new hook();
};

export class RendererNode<TNode extends VirtualDOM.VTree = any> {
    /**
     * The children nodes for this node.
     */
    public children: RendererNode[] = [];

    /**
     * The properties for this node.
     */
    public properties: Record<string, string | boolean | number | IHookFn> = {};

    /**
     * The attributes for this node.
     */
    public attributes: Record<string, string | boolean | number> = {};

    /**
     * The event listeners for this node.
     */
    public eventListeners: Record<string, EventListenerOrEventListenerObject[]> = {};

    /**
     * The node tag name.
     */
    public tag: string;

    /**
     * If the node is being ignored.
     */
    private ignore: boolean = false;

    /**
     * If the node is dirty.
     */
    private dirty: boolean = true;

    /**
     * If it's currently patching this node.
     */
    private patching: boolean = false;

    /**
     * If the node can be rendered.
     */
    private renderable: boolean = true;

    /**
     * The node that replaced this node, if any.
     */
    public replacedWith: RendererNode[] = null;

    /**
     * The rendered DOM element for this node.
     */
    public element: Element = null;

    constructor(
        public node: TNode | string,
        public parent: RendererNode | null = null,
        public renderer: Renderer
    ) {
        this.initNode();
    }

    /**
     * Initializes the node data.
     * @returns 
     */
    protected initNode() {
        if (typeof this.node === "string") {
            return;
        }

        // If it's a text node
        if (this.node instanceof VText) {
            this.node = this.node.text;
            return;
        }

        // Initialize the properties
        this.tag = "tagName" in this.node ? this.node.tagName : "TEXT";

        if (this.node instanceof VComment) {
            this.tag = "!";
        } else {
            if ("properties" in this.node) {
                if ("attrs" in this.node.properties) {
                    this.attributes = Object.assign(this.attributes, this.node.properties.attrs);
                }

                if ("props" in this.node.properties) {
                    this.properties = Object.assign(this.properties, this.node.properties.props);
                }

                if ("on" in this.node.properties) {
                    this.eventListeners = Object.assign(this.eventListeners, this.node.properties.on as any);
                }
            } else {
                this.attributes = {};
                this.properties = {};
                this.eventListeners = {};
            }

            if ("children" in this.node) {
                this.children.push(
                    ...this.node.children.map((child) =>
                        Renderer.createNode(child, this, this.renderer)
                    )
                )
            }
        }
    }

    /**
     * Checks if it's an internal pupper node.
     * @returns 
     */
    public isPupperNode() {
        return this.tag === "$";
    }

    /**
     * Checks if this node element has been rendered.
     * @returns 
     */
    public wasRendered() {
        return this.element !== null;
    }

    /**
     * Checks if this node was replaced.
     * @returns 
     */
    public wasReplaced() {
        return this.replacedWith !== null;
    }

    /**
     * Retrieves the nodes which this node was replaced with.
     * @returns 
     */
    public getReplacement() {
        return this.replacedWith;
    }

    /**
     * Sets if this node is dirty (needs to be reparsed) or not.
     * @param dirty If it's dirty or not.
     */
    public setDirty(dirty: boolean = true, autoPatch: boolean = true) {
        this.dirty = dirty;

        if (dirty && autoPatch) {
            this.patch();
        }

        return this;
    }

    /**
     * Sets all children to dirty.
     * @param dirty If it's dirty or not.
     * @returns 
     */
    public setChildrenDirty(dirty: boolean = true, autoPatch: boolean = true) {
        this.children.forEach((child) => {
            child.setDirty(dirty, autoPatch);
            child.setChildrenDirty(dirty, autoPatch);
        });

        return this;
    }

    /**
     * Sets all children to dirty.
     * @param ignored If it's dirty or not.
     * @returns 
     */
    public setChildrenIgnored(ignored: boolean = true) {
        this.children.forEach((child) => {
            child.setIgnored(ignored);
            child.setChildrenIgnored(ignored);
        });

        return this;
    }

    /**
     * Determines if this node is being ignored by the directives.
     * @param ignored If this node needs to be ignored.
     */
    public setIgnored(ignored: boolean = true) {
        this.ignore = ignored;
        return this;
    }

    /**
     * Sets if this node can be rendered.
     * @param renderable If this node can be rendered.
     */
    public setRenderable(renderable: boolean = true) {
        this.renderable = renderable;
        return this;
    }

    /**
     * Determines if the node is being ignored.
     * @returns 
     */
    public isBeingIgnored() {
        return this.ignore;
    }

    /**
     * Determines if the node is dirty.
     * @returns 
     */
    public isDirty() {
        return this.dirty;
    }

    /**
     * Determines if this node can be rendered.
     * @returns 
     */
    public isRenderable() {
        // Pupper tags aren't renderable
        return this.tag !== "$" && this.renderable;
    }

    /**
     * Checks if it's a string node.
     * @returns 
     */
    public isString() {
        return typeof this.node === "string";
    }

    /**
     * Retrieves an object containing all attributes and properties.
     * @returns 
     */
    public getAttributesAndProps() {
        return {
            ...this.attributes,
            ...this.properties
        };
    }

    /**
     * Retrieves an attribute by the key.
     * @param key The attribute key.
     * @returns 
     */
    public getAttribute(key: string) {
        return this.attributes[key];
    }

    /**
     * Checks if an attribute exists.
     * @param key The attribute key.
     * @returns 
     */
    public hasAttribute(key: string) {
        return key in this.attributes;
    }

    /**
     * Sets an attribute value.
     * @param key The attribute key.
     * @param value The attribute value.
     * @returns 
     */
    public setAttribute(key: string, value: string | boolean | number) {
        this.attributes[key] = value;
        return this;
    }

    /**
     * Removes an attribute by the key.
     * @param key The attribute key.
     */
    public removeAttribute(key: string) {
        delete this.attributes[key];
    }

    /**
     * Retrieves a property by the key.
     * @param key The property key.
     * @returns 
     */
    public getProperty(key: string) {
        return this.properties[key];
    }

    /**
     * Checks if a property exists.
     * @param key The property key.
     * @returns 
     */
    public hasProperty(key: string) {
        return key in this.properties;
    }

    /**
     * Removes a property by the key.
     * @param key The property key.
     */
    public removeProperty(key: string) {
        delete this.properties[key];
    }

    /**
     * Sets a property value.
     * @param key The property key.
     * @param value The property value.
     * @returns 
     */
    public setProperty(key: string, value: string | boolean | number) {
        this.attributes[key] = value;
        return this;
    }

    /**
     * Replaces this node with a new one.
     * @param nodes The nodes to replace the current one.
     * @returns 
     */
    public replaceWith<TNode extends RendererNode | VirtualDOM.VTree | string>(...nodes: TNode[]) {
        if (!this.parent) {
            return nodes;
        }

        const replacement = nodes.map((node) =>
            !(node instanceof RendererNode) ?
                Renderer.createNode(node, this.parent, this.renderer) :
                node
        ) as RendererNode[];

        this.parent.children.splice(
            this.getIndex(),
            1,
            // @ts-ignore
            ...replacement
        );

        this.replacedWith = replacement;

        return nodes;
    }

    /**
     * Replaces the current node with a comment.
     * @returns 
     */
    public replaceWithComment(contents: string = "") {
        const comment = new RendererNode(h.c(contents), this.parent, this.renderer);

        this.replaceWith(comment);

        return comment;
    }

    /**
     * Adds an event listener to this node.
     * @param event The event name to be added.
     * @param callback The event callback.
     */
    public addEventListener(event: keyof DocumentEventMap | string, callback: EventListener) {
        this.eventListeners[event] = this.eventListeners[event] || [];

        if (!this.eventListeners[event].includes(callback)) {
            this.eventListeners[event].push(callback);
        }
    }

    /**
     * Removes a callback from an event listener.
     * @param event The event name.
     * @param callback The callback to be removed.
     */
    public removeEventListener(event: keyof DocumentEventMap | string, callback: EventListenerOrEventListenerObject) {
        this.eventListeners[event].splice(
            this.eventListeners[event].indexOf(callback),
            1
        );
    }

    /**
     * Returns the index of this node in the parent node children.
     * @returns 
     */
    public getIndex(): number {
        return this.parent.children.indexOf(this);
    }

    /**
     * Checks if the node exists.
     * @returns 
     */
    public exists() {
        return this.parent === null || this.getIndex() > -1;
    }

    /**
     * Sets the node parent node.
     * @param parent The new node parent.
     * @returns 
     */
    public setParent(parent: RendererNode) {
        this.parent = parent;

        // Update the children parents
        this.children.forEach((child) => {
            child.setParent(this);
        });

        return this;
    }

    /**
     * Insert a list of nodes before the current node.
     * @param nodes The list of nodes to be inserted.
     */
    public insertBefore(...nodes: RendererNode[]) {
        this.parent.children.splice(
            this.getIndex() - 1,
            0,
            ...nodes
        );
    }

    /**
     * Insert a list of nodes after the current node.
     * @param nodes The list of nodes to be inserted.
     */
    public insertAfter(...nodes: RendererNode[]) {
        this.parent.children.splice(
            this.getIndex() + 1,
            0,
            ...nodes
        );
    }

    /**
     * Appends a node to the children nodes.
     * @param node The node to be appended.
     */
    public appendChild(node: RendererNode) {
        this.children.push(node);
    }

    /**
     * Appends a list of node to the children nodes.
     * @param nodes The nodes to be appended.
     */
    public append(...nodes: RendererNode[]) {
        this.children.push(...nodes);
    }

    /**
     * Deletes the current node from the parent node.
     */
    public delete() {
        this.parent.children.splice(
            this.getIndex(),
            1
        );

        return this;
    }

    /**
     * Clears the node children nodes.
     */
    public clearChildren() {
        this.children = [];
        return this;
    }

    /**
     * Clones the current node into a new one.
     * @returns 
     */
    public clone(): RendererNode {
        // If it's a comment
        if (this.node instanceof VComment) {
            // Clone it
            return new RendererNode(h.c(this.node.comment), this.parent, this.renderer);
        }

        const clonedNode = this.isString() ? this.node : h(this.tag, {
            attrs: { ...this.attributes },
            props: { ...this.properties },
            on: {... this.eventListeners }
        }, []);

        const clone = Renderer.createNode(clonedNode as TNode, this.parent, this.renderer);
        clone.children = this.children.map((child) => child.clone());

        return clone;
    }

    /**
     * Retrieves the root node.
     * @returns 
     */
    public getRoot() {
        let node: RendererNode = this;

        while(node.parent !== null) {
            node = node.parent;
        }
        
        return node;
    }

    /**
     * Determines if any parent node is in patching state.
     * @returns 
     */
    private hasParentPatching() {
        let parent = this.parent;

        while(parent !== null) {
            if (parent.patching) {
                return true;
            }

            parent = parent.parent;
        }

        return false;
    }

    /**
     * Retrieves the closest rendered parent element.
     * @returns 
     */
    public getClosestRenderedParent() {
        let parent = this.parent;

        while(parent !== null) {
            if (parent.wasRendered()) {
                return parent;
            }

            parent = parent.parent;
        }

        return undefined;
    }

    /**
     * Enqueues a patch to the internal VDOM element.
     */
    public patch() {
        // Prevent patching if not dirty, being ignored or already patching
        if (!this.dirty || this.ignore || this.patching) {
            return;
        }

        if (this.wasRendered()) {
            // Ignore if the parent is already patching, because it will be included
            if (this.hasParentPatching()) {
                debug("parent is already patching, will ignore subsequent patches.");
                return;
            }

            debug("element was rendered, will be patched");

            this.patching = true;
            this.renderer.singleNextTick(this.doPatch.bind(this));
        } else
        // If already rendered the renderer for the first time
        if (this.renderer.rendered) {
            // If has a rendered parent element
            const renderedParent = this.getClosestRenderedParent();

            if (renderedParent && !renderedParent.patching) {
                debug("closest parent %O will patch %O", renderedParent, this);

                // Call it to patch the element
                renderedParent.setDirty();
            } else {
                debug("closest parent %O of %O is already patching.", renderedParent, this);
            }
        }
    }

    /**
     * Patches the VDOM element in real DOM.
     */
    private doPatch() {
        const diffs = diff(this.node as any, this.toVNode() as any);

        debug("applying patch %O to %O", diffs, this);

        try {
            this.element = patch(this.element, diffs);
            this.patching = false;
            this.dirty = false;
        } catch(e) {
            Debugger.error("an exception ocurred while patching node %O:", this);
            throw e;
        }

        debug("patched node %O into element %O", this, this.element);
    }

    /**
     * Called when the element has been added to the DOM.
     * @param node The node element.
     */
    private onElementCreated(node: Element) {
        this.element = node;

        for(let evt in this.eventListeners) {
            for(let handler of this.eventListeners[evt]) {
                this.element.addEventListener(evt, handler);
            }
        }
    }

    /**
     * Called when the element has been removed from the DOM.
     */
    private onElementRemoved() {
        for(let evt in this.eventListeners) {
            for(let handler of this.eventListeners[evt]) {
                this.element.removeEventListener(evt, handler);
            }
        }

        this.element = null;
    }

    /**
     * Converts the current node into a virtual DOM node.
     * @returns 
     */
    public toVNode(): VirtualDOM.VTree | string | (VirtualDOM.VTree | string)[] {
        // If it's a plain string
        if (typeof this.node === "string") {
            return this.node;
        } else
        // If it's a comment
        if (this.tag === "!") {
            this.node = h.c("") as TNode;
            return this.node;
        }

        // If has no $pupper hook yet
        if (!("$pupper" in this.properties)) {
            // Create the hook
            this.properties["$pupper"] = Hook({
                hook: (node: Element) => {
                    this.onElementCreated(node);
                },
                unhook: () => {
                    this.onElementRemoved();
                }
            });
        }

        const properties: Record<string, any> = {
            ...this.attributes,
            ...this.properties
        };

        // Rename the "class" attribute
        if (properties.class) {
            properties.className = properties.class;
            delete properties.class;
        }

        let finalChild: (VirtualDOM.VTree | string)[] = [];

        // Iterate over the children
        this.children
            // Only renderable children
            .filter((child) => child.isRenderable() || child.isPupperNode())
            // Into virtual nodes
            .forEach((child) => {
                const result = child.toVNode();

                if (Array.isArray(result)) {
                    finalChild.push(...result);
                    return;
                }

                finalChild.push(result);
            });

        this.node = h(
            this.tag,
            properties,
            finalChild
        ) as TNode;

        return this.node as VirtualDOM.VTree;
    }
}
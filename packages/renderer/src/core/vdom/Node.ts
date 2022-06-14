import { cloneNode } from "../../model/VirtualDom";
import { Renderer } from "./Renderer";

import VNode from "virtual-dom/vnode/vnode";
import VText from "virtual-dom/vnode/vtext";

import h from "virtual-dom/h";
import diff from "virtual-dom/diff";
import { patch, VNode } from "virtual-dom";

const debug = require("debug")("pupper:vdom:node");

const Hook = (callback: CallableFunction) => {
    const hook = function() {};
    hook.prototype.hook = callback;

    // @ts-ignore
    return new hook();
};

export class PupperNode<TNode extends VirtualDOM.VTree = any> {
    public children: PupperNode[] = [];

    public properties: Record<string, string | boolean | number> = {};
    public attributes: Record<string, string | boolean | number> = {};
    public eventListeners: Record<string, EventListenerOrEventListenerObject[]> = {};

    public tag: string;

    private ignore: boolean = false;
    private dirty: boolean = true;
    private patching: boolean = false;
    private renderable: boolean = true;

    public text: string = "";
    public element: Element = null;

    constructor(
        protected node: TNode | string,
        public parent: PupperNode = null,
        public renderer: Renderer
    ) {
        if (typeof node !== "string") {
            // Initialize the properties
            this.tag = "tagName" in node ? node.tagName : "TEXT";

            if ("properties" in node) {
                if ("attrs" in node.properties) {
                    this.attributes = Object.assign(this.attributes, node.properties.attrs);
                }

                if ("props" in node.properties) {
                    this.properties = Object.assign(this.properties, node.properties.props);
                }

                if ("on" in node.properties) {
                    this.eventListeners = Object.assign(this.eventListeners, node.properties.on as any);
                }
            } else {
                this.attributes = {};
                this.properties = {};
                this.eventListeners = {};
            }

            if ("children" in node) {
                this.children = node.children.map((child) => new PupperNode(child, this, renderer));
            }
        } else {
            this.tag = "TEXT";
            this.text = node;
        }
    }

    /**
     * Checks if this node element has been rendered.
     * @returns 
     */
    public wasRendered() {
        return this.element !== null;
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
        return this.ignore || !this.dirty;
    }

    /**
     * Determines if this node can be rendered.
     * @returns 
     */
    public isRenderable() {
        return this.renderable;
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
    public replaceWith<TNode extends PupperNode | VirtualDOM.VTree | string>(...nodes: TNode[]) {
        if (!this.parent) {
            return nodes;
        }

        this.parent.children.splice(
            this.getIndex(),
            1,
            // @ts-ignore
            ...nodes.map((node) => !(node instanceof PupperNode) ? new PupperNode(node, this.parent, this.renderer) : node)
        );

        return nodes;
    }

    /**
     * Replaces the current node with a comment.
     * @returns 
     */
    public replaceWithComment() {
        const comment = new PupperNode(new VNode("COMMENT", {}, []), this.parent, this.renderer);

        this.replaceWith(comment);

        return comment;
    }

    /**
     * Adds an event listener to this node.
     * @param event The event name to be added.
     * @param listener The event callback.
     */
    public addEventListener(event: keyof DocumentEventMap | string, listener: EventListenerOrEventListenerObject) {
        this.eventListeners[event] = this.eventListeners[event] || [];
        this.eventListeners[event].push(listener);
    }

    /**
     * Removes a callback from an event listener.
     * @param event The event name.
     * @param listener The callback to be removed.
     */
    public removeEventListener(event: keyof DocumentEventMap | string, listener: EventListenerOrEventListenerObject) {
        this.eventListeners[event].splice(
            this.eventListeners[event].indexOf(listener),
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
    public setParent(parent: PupperNode) {
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
    public insertBefore(...nodes: PupperNode[]) {
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
    public insertAfter(...nodes: PupperNode[]) {
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
    public appendChild(node: PupperNode) {
        this.children.push(node);
    }

    /**
     * Appends a list of node to the children nodes.
     * @param nodes The nodes to be appended.
     */
    public append(...nodes: PupperNode[]) {
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
    }

    /**
     * Clones the current node into a new one.
     * @returns 
     */
    public clone() {
        const clonedNode = this.node === undefined ? this.text : h(this.tag, {
            attrs: { ...this.attributes },
            props: { ...this.properties },
            on: {... this.eventListeners }
        }, []);

        const clone = new PupperNode(clonedNode, this.parent, this.renderer);
        clone.children = this.children.map((child) => child.clone());

        return clone;
    }

    /**
     * Retrieves the root node.
     * @returns 
     */
    public getRoot() {
        let node: PupperNode = this;

        while(node.parent !== null) {
            node = node.parent;
        }
        
        return node;
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
            debug("element was rendered, will be patched");

            this.patching = true;
            this.renderer.singleNextTick(this.doPatch.bind(this));
        }
    }

    /**
     * Patches the VDOM element in real DOM.
     */
    private doPatch() {
        const diffs = diff(this.node as any, this.toVNode() as any);

        this.element = patch(this.element, diffs);
        this.patching = false;
        this.dirty = false;
    }

    /**
     * Converts the current node into a virtual DOM node.
     * @returns 
     */
    public toVNode(): VirtualDOM.VTree | string {
        if (typeof this.node === "string") {
            return this.node;
        }

        const properties: Record<string, any> = {
            ...this.attributes,
            ...this.properties,
            $p_create: Hook((node: Element) => {
                this.element = node;
            })
        };

        // Rename the "class" attribute
        if (properties.class) {
            properties.className = properties.class;
            delete properties.class;
        }

        for(let evt in this.eventListeners) {
            properties["on" + evt] = this.eventListeners[evt];
        }

        this.node = h(
            this.tag,
            properties,
            this.children.map((child) => child.toVNode())
        ) as TNode;

        return this.node as VirtualDOM.VTree;
    }
}
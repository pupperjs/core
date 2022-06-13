import { dir } from "console";
import { VNode } from "snabbdom";
import { cloneNode } from "../../model/VirtualDom";
import { Renderer } from "./Renderer";

const debug = require("debug")("pupper:vdom:node");

export class Node<TVNode extends Partial<VNode> | string = any> {
    public children: Node[] = [];

    public properties: Record<string, string | boolean | number>;
    public attributes: Record<string, string | boolean | number>;
    public eventListeners: Record<string, CallableFunction[]>;

    public tag: string;

    public ignore: boolean = false;
    public dirty: boolean = true;
    public invisible: boolean = false;

    constructor(
        protected node: TVNode,
        public parent: Node = null,
        public renderer: Renderer
    ) {
        if (typeof node !== "string") {
            // Initialize the properties
            this.tag = node.sel || "text";

            if (node.data) {
                if ("attrs" in node.data) {
                    this.attributes = Object.assign({}, node.data.attrs);
                } else {
                    this.attributes = {};
                }

                if ("props" in node.data) {
                    this.properties = Object.assign({}, node.data.props);
                } else {
                    this.properties = {};
                }

                if ("on" in node.data) {
                    this.eventListeners = Object.assign({}, node.data.on as any);
                } else {
                    this.eventListeners = {};
                }
            } else {
                this.attributes = {};
                this.properties = {};
                this.eventListeners = {};
            }

            this.children = node.children ? node.children.map((child) => new Node(child, this, renderer)) : [];
        }
    }

    /**
     * Determines if this node is invisible (will be skipped).
     * @param invisible If it's invisible or not.
     */
    public setInvisible(invisible = true) {
        this.invisible = invisible;
    }

    /**
     * Determines if this node is dirty (needs to be reparsed) or not.
     * @param dirty If it's dirty or not.
     */
    public setDirty(dirty: boolean = true) {
        this.dirty = dirty;
        this.renderer.enqueueRender();
    }

    /**
     * Determines if this node is being ignored by the directives.
     * @param ignored If this node needs to be ignored.
     */
    public setIgnored(ignored: boolean = true) {
        this.ignore = ignored;
    }

    /**
     * Checks if the node is being ignored.
     * @returns 
     */
    public isBeingIgnored() {
        return this.ignore || !this.dirty;
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
    public replaceWith(...nodes: (Node | VNode)[]) {
        if (!this.parent) {
            return false;
        }

        this.parent.children.splice(
            this.getIndex(),
            1,
            ...nodes.map((node) => !(node instanceof Node) ? new Node(node, this.parent, this.renderer) : node)
        );

        return nodes;
    }

    /**
     * Replaces the current node with a comment.
     * @returns 
     */
    public replaceWithComment() {
        const comment = new Node({
            sel: "!"
        }, this.parent, this.renderer);

        this.replaceWith(comment);

        return comment;
    }

    /**
     * Adds an event listener to this node.
     * @param event The event name to be added.
     * @param listener The event callback.
     */
    public addEventListener(event: keyof DocumentEventMap | string, listener: CallableFunction) {
        this.eventListeners[event] = this.eventListeners[event] || [];
        this.eventListeners[event].push(listener);
    }

    /**
     * Removes a callback from an event listener.
     * @param event The event name.
     * @param listener The callback to be removed.
     */
    public removeEventListener(event: keyof DocumentEventMap | string, listener: CallableFunction) {
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
    public setParent(parent: Node) {
        this.parent = parent;
        return this;
    }

    /**
     * Insert a list of nodes before the current node.
     * @param nodes The list of nodes to be inserted.
     */
    public insertBefore(...nodes: Node[]) {
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
    public insertAfter(...nodes: Node[]) {
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
    public appendChild(node: Node) {
        this.children.push(node);
    }

    /**
     * Appends a list of node to the children nodes.
     * @param nodes The nodes to be appended.
     */
    public append(...nodes: Node[]) {
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
        return new Node(cloneNode(this.node as VNode), this.parent, this.renderer);
    }

    /**
     * Patches the DOM for this element.
     */
    public updateDOM(callback?: CallableFunction) {
        if (typeof this.node === "string") {
            return;
        }

        if (this.renderer.rendered) {
            this.renderer.update();

            if (typeof callback === "function") {
                this.renderer.nextTick(callback);
            }
        }
    }

    /**
     * Retrieves the root node.
     * @returns 
     */
    public getRoot() {
        let node: Node = this;

        while(node.parent !== null) {
            node = node.parent;
        }
        
        return node;
    }

    /**
     * Converts this node into a virtual node.
     * @returns 
     */
    public toVirtualNode(): TVNode | VNode {
        if (typeof this.node === "string") {
            return {
                sel: undefined,
                data: undefined,
                elm: undefined,
                children: undefined,
                key: undefined,
                text: this.node
            };
        }

        this.node = {
            sel: this.tag === "text" ? undefined : this.tag,
            data: {
                props: this.properties,
                attrs: this.attributes,
                on: this.eventListeners as any
            },
            elm: this.node.elm,
            children: this.children.map((child) => child.toVirtualNode()),
            key: this.node.key,
            text: this.node.text
        } as TVNode;

        return this.node;
    }
}
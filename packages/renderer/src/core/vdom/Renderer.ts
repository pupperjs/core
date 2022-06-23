import { Component } from "../Component";

import Pupper from "../..";

import { walk } from "../../model/NodeWalker";
import { RendererNode } from "../../model/vdom/RendererNode";

import { diff, patch, create } from "virtual-dom";
import h from "virtual-dom/h";

import Debugger from "../../util/Debugger";
import { ConditionalNode } from "./nodes/ConditionalNode";
import { LoopNode } from "./nodes/LoopNode";
import VNode from "virtual-dom/vnode/vnode";

const debug = Debugger.extend("vdom");

export type TRendererNodes = RendererNode | ConditionalNode | LoopNode;

/**
 * Most of the evaluation functions were taken from alpine.js
 * Thanks, alpine.js!
 */
export class Renderer {
    vnode: string | VirtualDOM.VTree | (string | VirtualDOM.VTree)[];
    rendererNode: ConditionalNode | LoopNode | RendererNode<VirtualDOM.VText | VirtualDOM.VComment | VirtualDOM.VNode | VirtualDOM.Widget | VirtualDOM.Thunk>;
    /**
     * Creates a renderer node from a virtual DOM node.
     * @param node The original virtual DOM node.
     * @param parent The parent node.
     * @param renderer The renderer related to this node.
     * @returns 
     */
    public static createNode(node: VirtualDOM.VTree | string, parent: RendererNode, renderer: Renderer) {
        if (node instanceof VNode) {
            if ("properties" in node && "attrs" in node.properties) {
                if ("x-if" in node.properties.attrs) {
                    return new ConditionalNode(node, parent, renderer);
                } else
                if ("x-for" in node.properties.attrs) {
                    return new LoopNode(node, parent, renderer);
                }
            }
        }

        return new RendererNode(node, parent, renderer);
    }

    public diff = diff;
    public patch = patch;

    /**
     * The stack of states that formulates the context for rendering elements.
     */
    protected stateStack: Record<string, any>[] = [];

    /**
     * The container that will receive the renderer contents.
     */
    public container: Element;

    /**
     * The rendering queue.
     */
    private queue: {
        callback: CallableFunction,
        listeners: CallableFunction[]
    }[] = [];
    
    /**
     * Determines if the renderer queue is currently running.
     */
    private inQueue: boolean;

    constructor(
        public component: Component
    ) {
        this.stateStack.push(
            // Globals
            Pupper.$global,

            // Magics
            Pupper.$magics,

            // Component state
            component.$state,

            // Renderer-related
            {
                $component: component
            }
        );
    }

    /**
     * Starts the queue if not executing it already.
     */
    private maybeStartQueue() {
        if (!this.inQueue) {
            this.processQueue();
        }
    }

    /**
     * Processes the renderer queue.
     */
    private async processQueue() {
        this.inQueue = this.queue.length > 0;

        // If doesn't have more items to process.
        if (!this.inQueue) {
            // Go out of the current queue.
            return;
        }

        // Retrieve the first queue job.
        const { callback, listeners } = this.queue.shift();

        // Do the job.
        await callback();

        // If has any listeners
        if (listeners && listeners.length) {
            for(let listener of listeners) {
                await listener();
            }
        }

        // Wait for a new job.
        window.requestAnimationFrame(this.processQueue.bind(this));
    }

    /**
     * Generates a state from the state stack.
     * @returns 
     */
    public generateScope() {
        return this.stateStack.reduce((carrier, curr) => {
            for(let key in curr) {
                carrier[key] = curr[key];
            }

            return carrier;
        }, {});
    }

    public rendered = false;

    /**
     * Renders the virtual dom into a virtual DOM node.
     * @returns 
     */
    public async renderToNode() {
        const tick = this.nextTick(async () => {
            const vdom = this.component.$component.render({ h });
            const node = Renderer.createNode(vdom, null, this);

            this.rendererNode = await walk(node, this.generateScope());

            this.rendererNode.addEventListener("$created", () => {
                this.component.$rendered = this.rendererNode.element;
                this.component.prepareDOM();
            });
        });

        await this.waitForTick(tick);

        return this.rendererNode;
    }

    /**
     * Renders the virtual dom for the first time.
     * @returns 
     */
    public async render() {
        this.vnode = (await this.renderToNode()).toVNode();

        try {
            this.container = create(this.vnode as VirtualDOM.VNode, {
                warn: true
            });

            this.rendered = true;

            debug("first render ended");
        } catch(e) {
            Debugger.error("an exception ocurred while rendering component %O", this.vnode);
            throw e;
        }

        return this.container;
    }

    /**
     * Enqueues a function to be executed in the next queue tick.
     * @param callback The callback to be executed.
     */
    public nextTick(callback: CallableFunction) {
        const tick = this.queue.push({
            callback,
            listeners: []
        });

        window.requestAnimationFrame(() => this.maybeStartQueue());

        return tick;
    }

    /**
     * Enqueues a function to be executed in the next queue tick only if it hasn't been enqueued yet.
     * @param callback The callback to be executed.
     */
    public singleNextTick(callback: CallableFunction) {
        if (this.queue.find((c) => c.callback === callback)) {
            return;
        }

        this.nextTick(callback);
    }

    /**
     * Waits for the given tick or the last added tick to be executed.
     * @returns 
     */
    public waitForTick(tick: number = null) {
        return new Promise((resolve) => {
            this.queue[tick !== null ? (tick - 1) : this.queue.length - 1].listeners.push(resolve);
        });
    }
}
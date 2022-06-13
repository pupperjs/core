import { Component } from "../Component";
import {
    h,
    propsModule,
    attributesModule,
    styleModule,
    eventListenersModule,
    init,
    VNode
} from "snabbdom";

import Pupper from "../..";

import { walk } from "../../model/NodeWalker";
import { Node } from "./Node";

const debug = require("debug")("pupper:vdom");

/**
 * Most of the evaluation functions were taken from alpine.js
 * Thanks, alpine.js!
 */
export class Renderer {
    private patch: ReturnType<typeof init>;

    /**
     * The stack of states that formulates the context for rendering elements.
     */
    protected stateStack: Record<string, any>[] = [];

    /**
     * The container that will receive the renderer contents.
     */
    protected container: HTMLDivElement;

    /**
     * The current VDOM node.
     */
    protected currentDOM: VNode;

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

    /**
     * Determines if has a pending render.
     */
    private isRenderEnqueued: boolean;

    constructor(
        protected component: Component
    ) {
        this.patch = init([
            propsModule,
            attributesModule,
            styleModule,
            eventListenersModule
        ]);

        this.stateStack.push(
            // Globals
            Pupper.$global,

            // Component state
            component.$state,
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
    protected generateScope() {
        return this.stateStack.reduce((carrier, curr) => {
            for(let key in curr) {
                carrier[key] = curr[key];
            }

            return carrier;
        }, {});
    }

    public rendered = false;

    /**
     * Renders the virtual dom for the first time.
     * @returns 
     */
    public async renderFirst() {
        const tick = this.nextTick(async () => {
            debug("first render");

            const vdom = this.component.$component.render({ h }) as VNode;
            const node = new Node(vdom, null, this);

            const result = await walk(node, this.generateScope());

            this.currentDOM = result.toVirtualNode() as VNode;

            this.container = document.createElement("div");
            this.patch(this.container, this.currentDOM);

            this.rendered = true;
        });

        await this.waitForTick(tick);

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

        setTimeout(() => this.maybeStartQueue());

        return tick;
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

    /**
     * Updates the renderer contents.
     */
    public update() {
        if (!this.rendered) {
            return;
        }

        this.isRenderEnqueued = true;

        return this.nextTick(async () => {
            const vdom = this.component.$component.render({ h }) as VNode;
            const node = new Node(vdom, null, this);

            const result = await walk(node, this.generateScope());

            const newDOM = result.toVirtualNode() as VNode;

            this.patch(this.currentDOM, newDOM);

            this.currentDOM = newDOM;
        });
    }

    /**
     * Enqueues a render update if the not enqueued yet.
     */
    public enqueueRender() {
        if (!this.isRenderEnqueued) {
            this.nextTick(() => this.update());
        }
    }
}
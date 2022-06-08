import Alpine from "alpinejs";
import morphdom from "morphdom";

const AlpineNames = ["x-data", "x-teleport", "x-text", "x-html"];

/**
 * DOM parser is everything a virtual DOM wants to be.
 * 
 * It parses the Alpine reactivity inside a template tag
 * and then removes everything related to Alpine like
 * the attributes starting with "@" and ":", and also
 * remove the Alpine-related tags like "x-data" or "x-html".
 * 
 * @todo would be useful in the future to use a real virtual DOM
 * by the pug-code-gen thing.
 */
export class DOMParser {
    /**
     * The virtual dom where Alpine will work on.
     */
    public template = document.createElement("template");

    protected templateObserver: MutationObserver;
    observer: MutationObserver;

    constructor(
        /**
         * The container where the application is hosted.
         * If none is given, will target the document body.
         */
        protected container: HTMLElement = document.body
    ) {
        this.observer = new MutationObserver(this.observeMutations.bind(this));
        this.observer.observe(this.container, {
            childList: true,
            subtree: true
        });
    }

    protected observeMutations(mutations: MutationRecord[]) {
        const queue: HTMLElement[] = [];

        for(let mutation of mutations) {
            if (!(mutation.target instanceof HTMLElement)) {
                continue;
            }

            if (queue.includes(mutation.target)) {
                continue;
            }

            queue.push(mutation.target);
        }

        queue.forEach((node) => {
            if (!(node instanceof HTMLElement)) {
                return;
            }

            this.filterChildrenAlpineAttributes(node);
        });
    }

    /**
     * Initializes a virtual dom node like Alpine does in start().
     * @param node The node to be initialized.
     */
    protected initNode(node: HTMLElement) {
        Alpine.initTree(node);
    }

    /**
     * Appends a child to the virtual DOM.
     * @param child The child to be appended.
     * @returns 
     */
    public async appendChild(child: HTMLElement) {
        // Append it to the virtual DOM
        child = this.template.content.appendChild(child);

        this.initNode(child);

        // Wait for the next tick
        await this.nextTick();

        this.flush();

        return child;
    }

    /**
     * Waits for the next parser tick.
     */
    public nextTick() {
        return new Promise<void>((resolve) => Alpine.nextTick(resolve));
    }

    /**
     * Flushes the updates to the DOM container.
     */
    protected flush() {
        morphdom(this.container, this.template.content, {
            childrenOnly: true
        });
        
        this.filterAlpineAttributes(this.container);
    }

    protected filterAlpineAttributes(el: Element) {
        Array.from(el.attributes).forEach(({ name }) => {
            if (
                AlpineNames.includes(name) ||
                name.startsWith("x-bind") ||
                name.startsWith("x-on")
            ) {
                el.removeAttribute(name);
            }
        });
    }

    protected filterChildrenAlpineAttributes(node: Element) {
        node.querySelectorAll("template, slot").forEach((node) => node.remove());
        
        return Array.from(node.querySelectorAll("*"))
            .forEach((el) => 
                this.filterAlpineAttributes(el)
            );
    }
}
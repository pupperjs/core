export class Slot {
    /**
     * The comment holding the slot position.
     */
    public container: HTMLElement | Comment;

    constructor(
        /**
         * All fallback nodes for this slot.
         */
        protected fallback: NodeListOf<Node>
    ) {

    }

    public createComment() {
        this.container = document.createComment("!");
        return this.container;
    }

    public replaceWith(content: Element) {
        this.container.replaceWith(content);
    }
}
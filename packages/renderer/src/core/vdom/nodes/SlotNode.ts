import Debugger from "../../../util/Debugger";
import { RendererNode } from "../../../model/vdom/RendererNode";

export class SlotNode extends RendererNode<VirtualDOM.VNode> {
    /**
     * The slot name.
     */
    public name: string;

    public initNode() {
        super.initNode();

        if (!this.hasAttribute("name")) {
            Debugger.debug("slot %O has no name", this);
            return;
        }

        // Save the slot name
        this.name = this.getAttribute("name") as string;
        this.tag = "!";

        // Remove the "name" attribute
        this.removeAttribute("name");

        // Save the slot reference
        this.renderer.component.$slots[this.name] = this;
    }

    /**
     * Replaces the slot contents with a given element.
     * @param replacement The element to replace this slot's content.
     */
    public replace(replacement: Element) {
        this.element.replaceWith(replacement);
        this.element = replacement;
    }
}
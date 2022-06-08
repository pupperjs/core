import { TagNode } from "../TagNode";

export class TemplateTagNode extends TagNode {
    public getName() {
        return "template";
    }

    public toPugNode() {
        // Template tags can only have one children
        if (this.getChildren().length > 1) {
            throw this.makeParseError("Template tags should only have one children");
        }

        return super.toPugNode();
    }
}
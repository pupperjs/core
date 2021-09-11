import { Reactive } from "../Reactive";

const debug = require("debug")("pupperjs:renderer:reactors:foreach");

export default class ForEachReactor extends Reactive.AbstractReactor {
    public static readonly Type: "foreach";

    private regex: RegExp = null;

    private reacted: Record<string | number, Node> = {};

    public getPath() {
        if (this.regex === null) {
            this.regex = new RegExp(`^(?<literal>${this.path.replace(/\./g, "\\.")})\.(?<index>.+?)\.(?<value>\.+)$`);
        }

        return this.regex;
    }

    public test(path: string): boolean {
        return !path.includes("." + this.options.var + ".") && (this.path === path || this.getPath().exec(path) !== null);
    }

    private handleAll(path: string, newValue: any) {
        let target: any[] | object = newValue;
        let indexes: number[] | string[];

        debug("new for...%s loop for \"%s\" (%O)", this.options.type, path, target);

        // Check if it's a for...in
        if (this.options.type === "in") {
            // Check if the target is an array
            if (Array.isArray(target)) {
                console.warn("Tried to iterate using for...in in a non-object variable", path);
                return false;
            }

            indexes = Object.keys(target);
        } else {
            indexes = Array.from(
                Array((target as any[]).length).keys()
            );
        }

        // Iterate over all changed array targets
        for(let index of indexes) {
            // @ts-ignore
            this.addSingle(index, target[index]);
        }
    }

    private addSingle(index: number|string, value: any) {
        const content = document.createElement("template");
        content.innerHTML = this.options.innerHTML;

        // Prepare the context
        const context = {
            [this.options.var]: value
        };

        // Prepare the nodes
        this.renderer.prepareNodes(content.content.childNodes, {
            pathPrefix: this.path + "." + index + ".",
            context
        });

        debug("\tparsed children %s", this.path + "." + index);

        this.reacted[index] = content.content;

        // Append it to the parent element
        (this.element as Comment).parentElement.appendChild(content.content);
    }

    private handleSingle(path: string, newValue: any) {
        const { groups } = path.match(this.regex);

        // Check if it's array.length (pushing a new object into the array)
        if (path === this.path + ".length") {
            path = this.path + "." + (newValue - 1);
            this.addSingle(path, this.renderer.getLiteralValue(path));

            return true;
        }

        const realPath = groups.literal + "." + groups.index + (groups.value ?  "." + this.options.var + "." + groups.value : "");

        debug("path %s was converted to %s", path, realPath);

        return this.reactor.triggerChangeFor(realPath, newValue);
    }

    public handle(path: string, newValue: any) {
        // Check if it's the root array value
        if (this.path === path) {
            this.handleAll(path, newValue);
        } else {
            this.handleSingle(path, newValue);
        }
    }
}
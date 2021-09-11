import { Reactive } from "../Reactive";

export default class HTMLAttributeReactor extends Reactive.AbstractReactor {
    public static readonly Type: "attribute";

    public handle(path: string, newValue: any) {
        (this.element as HTMLElement).setAttribute(this.options.key, newValue);
    }
}
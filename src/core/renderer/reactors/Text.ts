import { Reactive } from "../Reactive";

export default class TextReactor extends Reactive.AbstractReactor {
    public static readonly Type: "text";

    public handle(path: string, newValue: any) {
        this.element.textContent = newValue;
    }
}
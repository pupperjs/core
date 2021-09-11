import { Reactive } from "../Reactive";

export default class HTMLReactor extends Reactive.AbstractReactor {
    public static readonly Type: "html";

    public handle(path: string, newValue: any) {
        (this.element as HTMLElement).innerHTML = newValue;
    }
}
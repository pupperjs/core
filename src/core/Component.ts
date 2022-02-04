import { Renderer } from "./Renderer";
import type { CompiledTemplate } from "./Renderer";
import { Reactive } from "./renderer/Reactive";

export interface ComponentSettings {
    /**
     * The template to this component
     */
    template: CompiledTemplate;

    /**
     * The data to be passed to this component
     */
    data?: Record<any, any>;

    /**
     * The component methods
     */
    methods?: Reactive.ReactiveMethods;
}

export class Component {
    /**
     * The renderer related to this component
     */
    public renderer: Renderer;

    constructor(
        protected settings: ComponentSettings
    ) {
        this.renderer = new Renderer(this.settings.template, this.settings.data);
        this.methods = settings.methods;
        this.data = settings.data;
    }

    public get data() {
        return this.renderer.data;
    }

    public set data(data: Record<any, any>) {
        this.renderer.setData(data);
    }

    public get methods() {
        return this.renderer.methods;
    }

    public set methods(methods: Reactive.ReactiveMethods) {
        this.renderer.methods = methods;
    }

    /**
     * Renders the component
     */
    public async render() {
        return this.renderer.render();
    }

    /**
     * Renders the component into a HTML element
     * @param element The HTML element that will receive the element
     * @returns 
     */
    public async renderTo(element: string | HTMLElement) {
        return this.renderer.renderTo(element);
    }
}
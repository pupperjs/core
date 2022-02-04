import { Renderer } from "./Renderer";
import type { CompiledTemplate } from "./Renderer";

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
    methods?: Record<string, Function>;
}

export class Component {
    /**
     * The renderer related to this component
     */
    public renderer: Renderer;

    public data: Record<any, any>;
    public methods: Record<string, Function>;

    constructor(
        protected settings: ComponentSettings
    ) {
        this.renderer = new Renderer(this.settings.template, this.settings.data);
        this.data = this.renderer.data;
        this.methods = this.renderer.methods;
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